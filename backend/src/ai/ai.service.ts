import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { CRM_TOOLS, CrmToolExecutor } from './tools/crm-tools';
import { toOpenAiTools } from './openai-tools';
import { getCannedReply } from './canned-responses';

// TEMPORARY SWITCH: flip to true if GROQ_API_KEY isn't configured yet and
// you still want the assistant to respond with basic data-driven answers.
const USE_CANNED_RESPONSES = false;

// Groq hosts open models (Llama 3.3) behind an OpenAI-compatible API with a
// genuinely usable free tier (no billing setup, no per-account quota
// weirdness like some other providers) - good fit for a CRM assistant that
// needs reliable function/tool calling.
const MODEL_NAME = 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const SYSTEM_PROMPT = `You are the AITELLION AI Assistant, built by Team StackVolt.
You help small and medium businesses run their operations — starting with their CRM.
You can look up and create customers, leads, and deals; move deals through the pipeline;
create tasks and notes; and summarize account activity, using the tools available to you.

Rules:
- Always use tools to look up or change real data — never invent customer names, deal values, or IDs.
- Confirm destructive or high-impact actions (large deal value changes, stage moves to WON/LOST) by
  restating what you're about to do in your final answer.
- Keep answers concise and business-focused. Use bullet points for lists of records.
- Amounts are stored in cents; convert to a normal currency figure when talking to the user.
- If a request is ambiguous (e.g. which customer named "Sam"), ask a clarifying question instead of guessing.
- When asked to summarize a customer/account, call save_customer_summary after producing the summary so it persists on their profile.`;

const MAX_TOOL_ITERATIONS = 6;

@Injectable()
export class AiService {
  private client: OpenAI | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private toolExecutor: CrmToolExecutor,
  ) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
    }
  }

  async listConversations(organizationId: string, userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(organizationId: string, userId: string, conversationId: string) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, organizationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async chat(organizationId: string, userId: string, conversationId: string | undefined, userMessage: string) {
    if (USE_CANNED_RESPONSES) {
      return this.chatCanned(organizationId, userId, conversationId, userMessage);
    }

    if (!this.client) {
      throw new BadRequestException(
        'GROQ_API_KEY is not configured on this deployment. Set it in the backend .env to enable the AI Assistant.',
      );
    }

    const conversation = conversationId
      ? await this.getConversation(organizationId, userId, conversationId)
      : await this.prisma.aiConversation.create({
          data: {
            organizationId,
            userId,
            title: userMessage.slice(0, 60),
          },
          include: { messages: true },
        });

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: userMessage },
    });

    const priorHistory = await this.prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...priorHistory.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      })),
    ];

    const tools = toOpenAiTools(CRM_TOOLS);
    let finalText = '';
    const executedToolCalls: Array<{ name: string; input: unknown; output: unknown }> = [];

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const completion = await this.client.chat.completions.create({
        model: MODEL_NAME,
        messages,
        tools,
      });

      const choice = completion.choices[0].message;
      messages.push(choice);

      if (!choice.tool_calls || choice.tool_calls.length === 0) {
        finalText = choice.content ?? '';
        break;
      }

      for (const call of choice.tool_calls) {
        if (call.type !== 'function') continue;

        let args: unknown = {};
        try {
          args = JSON.parse(call.function.arguments || '{}');
        } catch {
          args = {};
        }

        let output: unknown;
        try {
          output = await this.toolExecutor.execute(call.function.name, args, organizationId, userId);
        } catch (err) {
          output = { error: err instanceof Error ? err.message : 'Tool execution failed' };
        }
        executedToolCalls.push({ name: call.function.name, input: args, output });

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(output),
        });
      }
    }

    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: finalText || '(No response generated)',
        toolCalls: executedToolCalls.length ? (executedToolCalls as any) : undefined,
      },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    if (executedToolCalls.length > 0) {
      await this.prisma.activity.create({
        data: {
          organizationId,
          actorId: userId,
          type: 'AI_ACTION',
          summary: `AI Assistant executed: ${executedToolCalls.map((t) => t.name).join(', ')}`,
          metadata: executedToolCalls as any,
        },
      });
    }

    return {
      conversationId: conversation.id,
      message: finalText,
      toolCalls: executedToolCalls,
    };
  }

  /**
   * Canned-response path — used only if USE_CANNED_RESPONSES is manually
   * flipped to true (e.g. GROQ_API_KEY isn't set up yet). Still
   * creates/persists the conversation and messages exactly like the real
   * path, so the UI and history work identically either way.
   */
  private async chatCanned(
    organizationId: string,
    userId: string,
    conversationId: string | undefined,
    userMessage: string,
  ) {
    const conversation = conversationId
      ? await this.getConversation(organizationId, userId, conversationId)
      : await this.prisma.aiConversation.create({
          data: { organizationId, userId, title: userMessage.slice(0, 60) },
        });

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: userMessage },
    });

    const replyText = await getCannedReply(this.prisma, organizationId, userMessage);

    await this.prisma.aiMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: replyText },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      message: replyText,
      toolCalls: [],
    };
  }
}