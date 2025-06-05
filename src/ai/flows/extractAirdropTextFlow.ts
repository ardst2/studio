
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

const ExtractAirdropTextInputSchema = z.object({
  textDescription: z.string().min(10, 'Text description must be at least 10 characters long.').describe('The full text description of the airdrop announcement.'),
});
export type ExtractAirdropTextInput = z.infer<typeof ExtractAirdropTextInputSchema>;

// New schema for individual key-value pairs
const ExtractedKVPairSchema = z.object({
  key: z.string().describe('The identified key or label for the extracted information (e.g., "Project Name", "Deadline").'),
  nilai: z.string().describe('The extracted value for the key.'),
  tipe: z.enum(['string_short', 'string_long', 'date', 'url', 'number', 'boolean', 'unknown'])
    .describe('The inferred type of the extracted value.')
});
export type ExtractedKVPair = z.infer<typeof ExtractedKVPairSchema>;


const ExtractAirdropTextOutputSchema = z.object({
  extractedDetails: z.array(ExtractedKVPairSchema)
    .optional()
    .describe('An array of extracted key-value-type objects. Each object represents a piece of information with a key, value, and type. Can be an empty array or undefined if no details are found.'),
  summary: z.string().optional().describe("A brief summary of the extraction process or any issues encountered by the AI.")
}).describe("The overall result of the airdrop text extraction.");

// Exporting the type for the array elements for frontend usage
export type { ExtractedKVPair as AirdropExtractedDetailItem };


const extractionPrompt = ai.definePrompt({
  name: 'extractAirdropInfoPrompt',
  input: { schema: ExtractAirdropTextInputSchema },
  output: { schema: ExtractAirdropTextOutputSchema },
  prompt: `You are an expert airdrop information extractor. Analyze the following text and extract key details related to a potential airdrop.
For each piece of information you find, create an object with three properties: "key", "nilai", and "tipe".
- "key": A descriptive label for the information (e.g., "Project Name", "Airdrop Link", "Eligibility Criteria", "Start Date", "Deadline", "Expected Token Amount", "Blockchain Network", "Main Task Type").
- "nilai": The actual extracted text or value.
- "tipe": The inferred data type. Use 'string_short' for brief text (like names, short phrases), 'string_long' for longer descriptions or multi-line text, 'date' (strictly format as YYYY-MM-DD if a date is found, otherwise provide the textual date and use 'string_short'), 'url' for web links, 'number' for numerical values, 'boolean' for true/false statements. If the type is ambiguous or cannot be determined, use 'unknown'.

Only include items for which you found relevant information in the text. Do not make up information. If a date is mentioned textually (e.g., "end of August", "next week"), extract that text as "nilai" and set "tipe" to "string_short". If a specific date like "August 15, 2024" is found, format "nilai" as "2024-08-15" and set "tipe" to "date".

Place all these extracted objects into an array under the "extractedDetails" field in your JSON response.
If you encounter any issues or have notes about the extraction, provide them in a "summary" field.

Airdrop Description Text:
{{{textDescription}}}

Return the result as a structured JSON object matching the defined output schema.
Example for "extractedDetails" containing one item:
"extractedDetails": [
  { "key": "Project Name", "nilai": "Awesome Token", "tipe": "string_short" }
]
If no relevant details are found, "extractedDetails" can be an empty array.
`,
});


const extractAirdropTextFlow = ai.defineFlow(
  {
    name: 'extractAirdropTextFlow',
    inputSchema: ExtractAirdropTextInputSchema,
    outputSchema: ExtractAirdropTextOutputSchema, // The flow returns the full object
  },
  async (input) => {
    const {output} = await extractionPrompt(input); // output is ExtractAirdropTextOutput or null

    if (!output || !output.extractedDetails) {
      // Ensure we always return the expected structure, even if AI fails or finds nothing
      return { extractedDetails: [], summary: output?.summary || 'AI model did not return any extracted details or the output was malformed.' };
    }

    // Validate each item in the extractedDetails array
    const validatedDetails: ExtractedKVPair[] = [];
    for (const item of output.extractedDetails) {
      if (typeof item === 'object' && item !== null && 'key' in item && 'nilai' in item && 'tipe' in item) {
        validatedDetails.push({
            key: String(item.key),
            nilai: String(item.nilai),
            tipe: ['string_short', 'string_long', 'date', 'url', 'number', 'boolean', 'unknown'].includes(String(item.tipe)) ? String(item.tipe) as ExtractedKVPair['tipe'] : 'unknown'
        });
      } else {
        console.warn(`Malformed item in extractedDetails: ${JSON.stringify(item)}. Skipping.`);
      }
    }
    return { extractedDetails: validatedDetails, summary: output.summary || (validatedDetails.length > 0 ? "Extraction successful." : "No specific details extracted.") };
  }
);

// The wrapper function will now return an array of KVPairs or an empty array
export async function extractAirdropDetailsFromText(input: ExtractAirdropTextInput): Promise<ExtractedKVPair[]> {
  const flowResult = await extractAirdropTextFlow(input);
  return flowResult.extractedDetails || []; // Ensure it's always an array
}
