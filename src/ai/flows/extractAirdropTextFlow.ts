
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
import { z } from 'zod';

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
  key: z.string().describe('Kunci atau label yang teridentifikasi untuk informasi yang diekstrak (misalnya, "Nama Proyek", "Batas Waktu").'),
  nilai: z.string().describe('Nilai yang diekstrak untuk kunci tersebut.'),
  tipe: z.enum(['string_short', 'string_long', 'date', 'url', 'number', 'boolean', 'unknown']).describe('Tipe data yang diinferensikan dari nilai yang diekstrak.')
});
export type ExtractedKVPair = z.infer<typeof ExtractedKVPairSchema>;


const ExtractAirdropTextOutputSchema = z.object({
  extractedDetails: z.array(ExtractedKVPairSchema)
    .optional()
    .describe('Sebuah array objek key-value-type yang diekstrak. Setiap objek merepresentasikan sepotong informasi dengan kunci, nilai, dan tipe. Bisa berupa array kosong atau undefined jika tidak ada detail yang ditemukan.'),
  summary: z.string().optional().describe("Ringkasan singkat mengenai proses ekstraksi atau masalah apa pun yang dihadapi oleh AI, dalam Bahasa Indonesia.")
}).describe("Hasil keseluruhan dari ekstraksi teks airdrop.");
// Internal type ExtractAirdropTextOutput is not exported.

// Exporting the type for the array elements for frontend usage
export type { ExtractedKVPair as AirdropExtractedDetailItem };


const extractionPrompt = ai.definePrompt({
  name: 'extractAirdropInfoPrompt',
  input: { schema: ExtractAirdropTextInputSchema },
  output: { schema: ExtractAirdropTextOutputSchema },
  prompt: `Anda adalah seorang ahli ekstraksi informasi airdrop. Semua output harus dalam Bahasa Indonesia.
Analyze the following text description AND/OR the content implicitly available at the provided URL to extract key details related to a potential airdrop.
Prioritize explicit textDescription if both are provided and seem to conflict for factual data extraction, but use the URL for broader context if needed.

For each piece of information you find, create an object with three properties: "key", "nilai", and "tipe".
- "key": Label deskriptif untuk informasi (contoh: "Nama Proyek", "Link Airdrop", "Kriteria Kelayakan", "Tanggal Mulai", "Batas Waktu", "Jumlah Token Diharapkan", "Jaringan Blockchain", "Jenis Tugas Utama"). Pastikan "key" dalam Bahasa Indonesia.
- "nilai": Teks atau nilai aktual yang diekstrak. Jika nilai bersifat deskriptif dan berasal dari sumber berbahasa Inggris, terjemahkan ke Bahasa Indonesia. Pertahankan nama propreti, istilah teknis, dan URL dalam bahasa aslinya kecuali ada padanan umum dalam Bahasa Indonesia.
- "tipe": Tipe data yang diinferensikan. Gunakan 'string_short' untuk teks singkat (seperti nama, frasa pendek), 'string_long' untuk deskripsi panjang atau teks multi-baris, 'date' (format YYYY-MM-DD jika tanggal spesifik ditemukan, jika tidak, berikan tanggal tekstual dan gunakan 'string_short'), 'url' untuk tautan web, 'number' untuk nilai numerik, 'boolean' untuk pernyataan benar/salah. Jika tipe ambigu atau tidak dapat ditentukan, gunakan 'unknown'.

Only include items for which you found relevant information in the text or from the URL context. Do not make up information.
If a date is mentioned textually (e.g., "end of August", "next week"), extract that text as "nilai" and set "tipe" to "string_short".
If a specific date like "August 15, 2024" is found, format "nilai" as "2024-08-15" and set "tipe" to "date".

Place all these extracted objects into an array under the "extractedDetails" field in your JSON response.
Jika Anda menemukan masalah atau memiliki catatan tentang ekstraksi, berikan dalam field "summary" dalam Bahasa Indonesia.

{{#if textDescription}}
Teks Deskripsi Airdrop:
{{{textDescription}}}
{{/if}}

{{#if sourceUrl}}
URL Sumber (gunakan untuk konteks atau info langsung jika model memiliki akses; CATATAN: model tidak dapat secara aktif mengambil konten web langsung dari string URL ini tanpa alat khusus, tetapi dapat menggunakannya untuk pengambilan pengetahuan jika URL atau domainnya diketahui):
{{{sourceUrl}}}
{{/if}}

Kembalikan hasilnya sebagai objek JSON terstruktur yang cocok dengan skema output yang ditentukan.
Contoh untuk "extractedDetails" yang berisi satu item:
"extractedDetails": [
  { "key": "Nama Proyek", "nilai": "Token Luar Biasa", "tipe": "string_short" }
]
Jika tidak ada detail relevan yang ditemukan, "extractedDetails" bisa berupa array kosong atau dihilangkan.
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

    
