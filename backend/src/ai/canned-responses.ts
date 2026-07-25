import { PrismaService } from '../prisma/prisma.service';

/**
 * TEMPORARY: canned/preset responses used while the Anthropic API is not
 * wired up (to avoid API cost during early testing). Swap `chat()` in
 * ai.service.ts back to the real Anthropic call whenever ready — the
 * conversation history, persistence, and UI all stay the same either way.
 *
 * A few patterns below still hit the real database for counts, so those
 * numbers are always accurate — only the "personality"/wording is canned.
 */
export async function getCannedReply(
  prisma: PrismaService,
  organizationId: string,
  message: string,
): Promise<string> {
  const text = message.toLowerCase().trim();

  const has = (...keywords: string[]) => keywords.some((k) => text.includes(k));

  // 1. Greeting
  if (has('hi', 'hello', 'hey', 'namaste')) {
    return "Hi! I'm the AITELLION AI Assistant — currently running in demo mode (no live AI credits yet). I can still tell you real numbers about your customers, leads, and deals. Try asking 'how many customers do I have?'";
  }

  // 2. Customer count
  if (has('how many customer', 'customer count', 'total customers', 'number of customers')) {
    const count = await prisma.customer.count({ where: { organizationId, deletedAt: null } });
    return `You currently have ${count} customer${count === 1 ? '' : 's'} in AITELLION.`;
  }

  // 3. Lead count
  if (has('how many lead', 'lead count', 'total leads', 'number of leads')) {
    const count = await prisma.lead.count({ where: { organizationId, deletedAt: null } });
    return `You currently have ${count} lead${count === 1 ? '' : 's'} in the pipeline.`;
  }

  // 4. Deals / pipeline value
  if (has('how many deal', 'deal count', 'pipeline value', 'pipeline', 'open deals')) {
    const deals = await prisma.deal.findMany({ where: { organizationId, deletedAt: null } });
    const open = deals.filter((d: { stage: string }) => d.stage !== 'WON' && d.stage !== 'LOST');
    const totalCents = open.reduce((sum: number, d: { valueCents: number }) => sum + d.valueCents, 0);
    const total = (totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return `You have ${open.length} open deal${open.length === 1 ? '' : 's'} worth ${total} in total, out of ${deals.length} deals overall.`;
  }

  // 5. Who are you / what can you do
  if (has('who are you', 'what are you', 'what can you do')) {
    return "I'm the AITELLION AI Assistant, built by Team StackVolt. Once fully enabled, I can look up and create customers, leads and deals, move deals through stages, add notes and tasks, and summarize accounts. Right now I'm running on preset answers while the live AI connection is being set up.";
  }

  // 6. Help
  if (has('help', 'what should i ask', 'commands')) {
    return "Right now, try asking things like:\n• How many customers do I have?\n• How many leads do I have?\n• What's my pipeline value?\n\nCreating records and full conversations will be available once the live AI is switched on.";
  }

  // 7. Attempted create/action requests
  if (has('create', 'add a', 'convert', 'move', 'update', 'delete')) {
    return "Taking actions through chat (like creating or updating records) will be available once the live AI is switched on. For now, please use the buttons on the Customers, Leads, or Deals pages.";
  }

  // 8. Summaries
  if (has('summar', 'summary')) {
    return "Account summaries will be available once the live AI is switched on. For now, you can review a customer's notes and deals directly on their profile page.";
  }

  // 9. Thanks
  if (has('thank', 'thanks', 'shukriya')) {
    return "You're welcome! Let me know if there's anything else you'd like to check.";
  }

  // 10. Fallback
  return "I'm running in limited demo mode right now (no live AI credits yet), so I can only answer a few preset questions — try asking about your customer count, lead count, or pipeline value. Full conversational AI is coming soon.";
}