
'use server';
/**
 * @fileOverview Genkit flow for extracting airdrop details from text or URL.
 *
 * - extractAirdropDetailsFromText: Analyzes text/URL to extract airdrop information.
 * - ExtractAirdropTextInput - Input type for the flow.
 * - ExtractAirdropTextOutput - Output type for the flow (internal).
 * - AirdropExtractedDetailItem - Exported type for individual extracted items.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Schemas ---
const ExtractAirdropTextInputSchema = z.object({
  textDescription: z.string().min(3, 'Text description must be at least 3 characters long.').optional().describe('The full text description of the airdrop announcement.'),
  sourceUrl: z.string().url({ message: "Invalid URL format."}).optional().describe('An optional URL to the airdrop announcement or related page.'),
}).refine(data => data.textDescription || data.sourceUrl, {
  message: 'Either textDescription or sourceUrl must be provided.',
  path: ['textDescription'], 
});
export type ExtractAirdropTextInput = z.infer<typeof ExtractAirdropTextInputSchema>;

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
// Internal type ExtractAirdropTextOutput is not exported.

// Exporting the type for the array elements for frontend usage
export type { ExtractedKVPair as AirdropExtractedDetailItem };


const extractionPrompt = ai.definePrompt({
  name: 'extractAirdropInfoPrompt',
  input: { schema: ExtractAirdropTextInputSchema },
  output: { schema: ExtractAirdropTextOutputSchema },
  prompt: `You are an expert airdrop information extractor.
Analyze the following text description AND/OR the content implicitly available at the provided URL to extract key details related to a potential airdrop.
Prioritize explicit textDescription if both are provided and seem to conflict for factual data extraction, but use the URL for broader context if needed.

For each piece of information you find, create an object with three properties: "key", "nilai", and "tipe".
- "key": A descriptive label for the information (e.g., "Project Name", "Airdrop Link", "Eligibility Criteria", "Start Date", "Deadline", "Expected Token Amount", "Blockchain Network", "Main Task Type").
- "nilai": The actual extracted text or value.
- "tipe": The inferred data type. Use 'string_short' for brief text (like names, short phrases), 'string_long' for longer descriptions or multi-line text, 'date' (strictly format as YYYY-MM-DD if a date is found, otherwise provide the textual date and use 'string_short'), 'url' for web links, 'number' for numerical values, 'boolean' for true/false statements. If the type is ambiguous or cannot be determined, use 'unknown'.

Only include items for which you found relevant information in the text or from the URL context. Do not make up information.
If a date is mentioned textually (e.g., "end of August", "next week"), extract that text as "nilai" and set "tipe" to "string_short".
If a specific date like "August 15, 2024" is found, format "nilai" as "2024-08-15" and set "tipe" to "date".

Place all these extracted objects into an array under the "extractedDetails" field in your JSON response.
If you encounter any issues or have notes about the extraction, provide them in a "summary" field.

{{#if textDescription}}
Airdrop Description Text:
{{{textDescription}}}
{{/if}}

{{#if sourceUrl}}
Source URL (use for context or direct info if model has access; NOTE: model cannot actively fetch live web content from this URL string alone without a specific tool, but can use it for knowledge retrieval if the URL or domain is known):
{{{sourceUrl}}}
{{/if}}

Return the result as a structured JSON object matching the defined output schema.
Example for "extractedDetails" containing one item:
"extractedDetails": [
  { "key": "Project Name", "nilai": "Awesome Token", "tipe": "string_short" }
]
If no relevant details are found, "extractedDetails" can be an empty array or omitted.
`,
});


const extractAirdropTextFlowInternal = ai.defineFlow(
  {
    name: 'extractAirdropTextFlowInternal',
    inputSchema: ExtractAirdropTextInputSchema,
    outputSchema: ExtractAirdropTextOutputSchema, // The flow returns the full object
  },
  async (input) => {
    const {output} = await extractionPrompt(input); 

    if (!output || !output.extractedDetails) {
      return { extractedDetails: [], summary: output?.summary || 'AI model did not return any extracted details or the output was malformed.' };
    }

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

export async function extractAirdropDetailsFromText(input: ExtractAirdropTextInput): Promise<AirdropExtractedDetailItem[]> {
  const flowResult = await extractAirdropTextFlowInternal(input);
  return flowResult.extractedDetails || []; 
}

    