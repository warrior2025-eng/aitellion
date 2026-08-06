import { SchemaType, FunctionDeclaration, FunctionDeclarationSchema, Schema } from '@google/generative-ai';
import { ToolDefinition } from './tools/crm-tools';

const TYPE_MAP: Record<string, SchemaType> = {
  string: SchemaType.STRING,
  integer: SchemaType.INTEGER,
  number: SchemaType.NUMBER,
  boolean: SchemaType.BOOLEAN,
  object: SchemaType.OBJECT,
  array: SchemaType.ARRAY,
};

/** Converts our CRM_TOOLS (provider-agnostic) into Gemini's FunctionDeclaration shape. */
export function toGeminiFunctionDeclarations(tools: ToolDefinition[]): FunctionDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(
        Object.entries(tool.input_schema.properties).map(([key, prop]) => [
          key,
          { type: TYPE_MAP[prop.type] ?? SchemaType.STRING, description: prop.description } as Schema,
        ]),
      ),
      required: tool.input_schema.required ?? [],
    } as FunctionDeclarationSchema,
  }));
}