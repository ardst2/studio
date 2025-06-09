
'use server';
/**
 * @fileOverview Genkit flow for researching airdrop potential from text or URL.
 *
 * - researchAirdrop: Analyzes text/URL to provide a research summary.
 * - ResearchAirdropInput - Input type for the flow.
 * - ResearchAirdropOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import { fetchWebpageContentTool } from '@/ai/tools/fetchWebpageTool'; // Import the new tool

// --- Schemas ---
const ResearchAirdropInputSchema = z.object({
  textQuery: z.string().min(3, 'Query teks harus minimal 3 karakter.').optional().describe('Pertanyaan atau teks yang mendeskripsikan airdrop/proyek untuk diteliti.'),
  sourceUrl: z.string().url({ message: "Format URL tidak valid."}).optional().describe('URL opsional yang terkait dengan airdrop/proyek untuk konteks penelitian.'),
}).refine(data => data.textQuery || data.sourceUrl, {
  message: 'Query teks atau URL sumber harus disediakan.',
  path: ['textQuery'],
});
export type ResearchAirdropInput = z.infer<typeof ResearchAirdropInputSchema>;

const ResearchAirdropOutputSchema = z.object({
  researchSummary: z.string().optional().describe('Ringkasan penelitian mendalam dalam Bahasa Indonesia, termasuk potensi, tautan resmi (jika ditemukan), dan poin-poin penting tentang airdrop atau proyek berdasarkan input yang diberikan. Jika tidak ada informasi yang dapat ditemukan atau dihasilkan, ini mungkin berupa string kosong atau pesan yang menunjukkannya.'),
  keyPoints: z.array(z.string()).optional().describe('Daftar poin-poin kunci dari penelitian, dalam Bahasa Indonesia.'),
  officialLinks: z.array(z.string()).optional().describe('Daftar URL resmi yang relevan yang ditemukan selama penelitian (misalnya, situs web proyek, media sosial). Hanya daftarkan URL yang valid.'),
  sentiment: z.string().optional().describe('Analisis singkat tentang sentimen atau potensi yang dirasakan, dalam Bahasa Indonesia (misalnya, "Potensi Tinggi", "Spekulatif", "Tampak Sah").'),
}).describe("Hasil keseluruhan dari riset airdrop.");
export type ResearchAirdropOutput = z.infer<typeof ResearchAirdropOutputSchema>;


const researchPrompt = ai.definePrompt({
  name: 'researchAirdropPrompt',
  input: { schema: ResearchAirdropInputSchema },
  output: { schema: ResearchAirdropOutputSchema },
  tools: [fetchWebpageContentTool], // Make the tool available to this prompt
  prompt: `Anda adalah seorang peneliti airdrop kripto yang ahli. Semua output harus dalam Bahasa Indonesia.
Analyze the following text query AND/OR the content from the provided URL to generate a research report.
If a sourceUrl is provided, use the 'fetchWebpageContent' tool to get the textual content of that URL. Then, analyze this retrieved content.
Your goal is to assess the potential of the airdrop/project, identify key information, and find official links.
Jika sumber informasi dalam Bahasa Inggris (baik dari textQuery atau konten URL), terjemahkan konten yang relevan ke Bahasa Indonesia untuk ringkasan dan poin kunci Anda.

Input:
{{#if textQuery}}
Query Teks/Deskripsi (jika ada):
{{{textQuery}}}
{{/if}}

{{#if sourceUrl}}
URL Sumber (gunakan alat 'fetchWebpageContent' untuk mengambil dan menganalisis kontennya):
{{{sourceUrl}}}
{{/if}}

Output Requirements:
1.  **researchSummary**: Berikan ringkasan yang komprehensif dalam Bahasa Indonesia. Bahas proyek, tentang apa airdrop tersebut, potensinya, tanda bahaya (jika ada), dan kelayakan jika diketahui. Jika konten URL adalah sumber utama, ringkas kontennya yang relevan dengan airdrop. Sajikan dalam paragraf yang terstruktur dengan baik dan mudah dibaca.
2.  **keyPoints**: Buat daftar 3-5 poin kunci dalam Bahasa Indonesia yang berasal dari riset Anda. Poin-poin ini harus ringkas dan informatif, disajikan sebagai daftar poin (bullet points).
3.  **officialLinks**: Jika memungkinkan, identifikasi dan daftarkan semua tautan resmi proyek seperti situs web, Twitter, Discord, atau pengumuman, baik dari textQuery maupun dari konten URL. Hanya daftarkan URL yang valid. Pertahankan URL dalam bahasa aslinya.
4.  **sentiment**: Nyatakan secara singkat sentimen atau potensi yang Anda rasakan dalam Bahasa Indonesia (contoh: "Potensi Tinggi", "Spekulatif", "Informasi Kurang", "Tampak Sah").

Jika Anda tidak dapat menemukan informasi substansial dari input yang diberikan (atau jika pengambilan URL gagal/konten tidak relevan), nyatakan dengan jelas dalam \`researchSummary\` (dalam Bahasa Indonesia) dan biarkan field lain kosong atau dengan catatan (misalnya, "Tidak ada poin kunci spesifik yang teridentifikasi.").
Jangan mengarang informasi. Dasarkan laporan Anda semata-mata pada input yang diberikan atau konten URL yang berhasil diambil dan relevan.
Kembalikan hasilnya sebagai objek JSON terstruktur yang cocok dengan skema output yang ditentukan. Jika field opsional seperti \`keyPoints\` atau \`officialLinks\` tidak memiliki data, kembalikan array kosong untuknya atau hilangkan field tersebut.
`,
});

const researchAirdropFlowInternal = ai.defineFlow(
  {
    name: 'researchAirdropFlowInternal',
    inputSchema: ResearchAirdropInputSchema,
    outputSchema: ResearchAirdropOutputSchema,
  },
  async (input) => {
    const {output} = await researchPrompt(input);
    if (!output) {
        return {
            researchSummary: "AI model did not return any output or the output was malformed. Please try a different query or URL.",
            keyPoints: [],
            officialLinks: [],
        };
    }
    // Ensure basic structure even if AI omits optional fields
    return {
        researchSummary: output.researchSummary || "No summary was generated by the AI.",
        keyPoints: output.keyPoints || [],
        officialLinks: output.officialLinks || [],
        sentiment: output.sentiment
    };
  }
);

export async function researchAirdrop(input: ResearchAirdropInput): Promise<ResearchAirdropOutput> {
  return researchAirdropFlowInternal(input);
}

    
