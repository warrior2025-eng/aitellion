import { ToolDefinition } from './tools/crm-tools';

/**
 * Groq's API is OpenAI-compatible, so tool definitions use the same
 * {type:'function', function:{name, description, parameters}} shape.
 * Our ToolDefinition.input_schema is already a plain JSON schema
 * ({type:'object', properties, required}), so this is a thin wrapper -
 * no lossy enum conversion needed (unlike Gemini's Schema types).
 */
export function toOpenAiTools(tools: ToolDefinition[]) {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}