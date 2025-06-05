
'use server';
/**
 * @fileOverview Genkit flow for extracting airdrop details from text.
 *
 * - extractAirdropDetailsFromText: Analyzes text to extract airdrop information.
 * - ExtractAirdropTextInput - Input type for the flow.
 * - ExtractAirdropTextOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Schemas ---
const ExtractedFieldSchema = z.object({
  nilai: z.string().describe('The extracted value for the key.'),
  tipe: z.enum(['string_short', 'string_long', 'date', 'url', 'number', 'boolean', 'unknown'])
    .describe('The inferred type of the extracted value. string_short for short text, string_long for long text/description, date in YYYY-MM-DD format, url, number, or boolean (true/false). Use unknown if type is unclear.'),
});

export const ExtractAirdropTextInputSchema = z.object({
  textDescription: z.string().min(10, 'Text description must be at least 10 characters long.').describe('The full text description of the airdrop announcement.'),
});
export type ExtractAirdropTextInput = z.infer<typeof ExtractAirdropTextInputSchema>;

export const ExtractAirdropTextOutputSchema = z.record(
  z.string().describe('The identified key or label for the extracted information (e.g., "Project Name", "Deadline", "Requirements").'),
  ExtractedFieldSchema
).describe('An object where each key is an identified piece of information from the text, and its value contains the extracted "nilai" (value) and "tipe" (type hint).');
export type ExtractAirdropTextOutput = z.infer<typeof ExtractAirdropTextOutputSchema>;


const extractionPrompt = ai.definePrompt({
  name: 'extractAirdropInfoPrompt',
  input: { schema: ExtractAirdropTextInputSchema },
  output: { schema: ExtractAirdropTextOutputSchema },
  prompt: `You are an expert airdrop information extractor. Analyze the following text and extract key details related to a potential airdrop.
For each piece of information you find, create a key-value pair. The key should be a descriptive label for the information (e.g., "Project Name", "Airdrop Link", "Eligibility Criteria", "Start Date", "Deadline", "Expected Token Amount", "Blockchain Network", "Main Task Type").
The value for each key must be an object containing:
1.  "nilai": The actual extracted text or value.
2.  "tipe": The inferred data type. Use 'string_short' for brief text (like names, short phrases), 'string_long' for longer descriptions or multi-line text, 'date' (strictly format as YYYY-MM-DD if a date is found, otherwise provide the textual date and use 'string_short'), 'url' for web links, 'number' for numerical values, 'boolean' for true/false statements. If the type is ambiguous or cannot be determined, use 'unknown'.

Only include keys for which you found relevant information in the text. Do not make up information. If a date is mentioned textually (e.g., "end of August", "next week"), extract that text as "nilai" and set "tipe" to "string_short". If a specific date like "August 15, 2024" is found, format "nilai" as "2024-08-15" and set "tipe" to "date".

Airdrop Description Text:
{{{textDescription}}}

Return the result as a structured JSON object matching the defined output schema.
Example for a single key:
"Project Name": { "nilai": "Awesome Token", "tipe": "string_short" }
`,
});


const extractAirdropTextFlow = ai.defineFlow(
  {
    name: 'extractAirdropTextFlow',
    inputSchema: ExtractAirdropTextInputSchema,
    outputSchema: ExtractAirdropTextOutputSchema,
  },
  async (input) => {
    const {output} = await extractionPrompt(input);
    if (!output) {
      throw new Error('AI model did not return any output.');
    }
    // Ensure all returned values have a 'nilai' and 'tipe'
    for (const key in output) {
        if (typeof output[key] !== 'object' || output[key] === null || !('nilai' in output[key]) || !('tipe' in output[key])) {
            // If malformed, try to salvage or default
            console.warn(`Malformed output for key ${key}. Setting to unknown.`);
            output[key] = { nilai: JSON.stringify(output[key] ?? 'Error: Malformed output'), tipe: 'unknown' };
        }
    }
    return output;
  }
);

export async function extractAirdropDetailsFromText(input: ExtractAirdropTextInput): Promise<ExtractAirdropTextOutput> {
  return extractAirdropTextFlow(input);
}
