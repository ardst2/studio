
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
import { fetchWebpageContentTool } from '@/ai/tools/fetchWebpageTool'; // Import the new tool

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
  key: z.string().describe('Kunci atau label yang teridentifikasi untuk informasi yang diekstrak (misalnya, "Nama Proyek", "Batas Waktu"). Harus dalam Bahasa Indonesia.'),
  nilai: z.string().describe('Nilai yang diekstrak untuk kunci tersebut. Jika deskriptif, terjemahkan ke Bahasa Indonesia kecuali untuk nama propreti, istilah teknis, atau URL.'),
  tipe: z.enum(['string_short', 'string_long', 'date', 'url', 'number', 'boolean', 'unknown']).describe('Tipe data yang diinferensikan dari nilai yang diekstrak.')
});
export type ExtractedKVPair = z.infer<typeof ExtractedKVPairSchema>;


const ExtractAirdropTextOutputSchema = z.object({
  extractedDetails: z.array(ExtractedKVPairSchema)
    .optional()
    .describe('Sebuah array objek key-value-type yang diekstrak. Setiap objek merepresentasikan sepotong informasi dengan kunci, nilai, dan tipe. Bisa berupa array kosong atau undefined jika tidak ada detail yang ditemukan.'),
  summary: z.string().optional().describe("Ringkasan singkat mengenai proses ekstraksi, KUALITAS DAN KELENGKAPAN hasil ekstraksi, atau masalah apa pun yang dihadapi oleh AI (misalnya, jika konten URL minim atau tidak relevan), dalam Bahasa Indonesia.")
}).describe("Hasil keseluruhan dari ekstraksi teks airdrop.");
// Internal type ExtractAirdropTextOutput is not exported.

// Exporting the type for the array elements for frontend usage
export type { ExtractedKVPair as AirdropExtractedDetailItem };


const extractionPrompt = ai.definePrompt({
  name: 'extractAirdropInfoPrompt',
  input: { schema: ExtractAirdropTextInputSchema },
  output: { schema: ExtractAirdropTextOutputSchema },
  tools: [fetchWebpageContentTool], // Make the tool available to this prompt
  prompt: `Anda adalah seorang ahli ekstraksi informasi airdrop kripto yang sangat teliti. Semua output HARUS dalam Bahasa Indonesia.
Tugas utama Anda adalah menggali SEDALAM MUNGKIN dari teks deskripsi yang diberikan DAN/ATAU konten dari URL sumber (jika disediakan) untuk mengekstrak SEMUA DETAIL yang berpotensi relevan terkait airdrop.
Jika sourceUrl disediakan, WAJIB gunakan alat 'fetchWebpageContent' untuk mendapatkan konten tekstualnya. Perlakukan konten dari URL tersebut dengan KETELITIAN YANG SAMA seperti input teks langsung.

Untuk SETIAP informasi yang Anda temukan, buat objek dengan properti "key", "nilai", dan "tipe".
- "key": Label deskriptif untuk informasi. WAJIB dalam Bahasa Indonesia.
- "nilai": Teks atau nilai aktual yang diekstrak. Jika nilai bersifat deskriptif dan berasal dari sumber berbahasa Inggris atau konten URL, TERJEMAHKAN ke Bahasa Indonesia. Pertahankan nama properti (seperti nama token, nama proyek), istilah teknis (seperti ERC-20, NFT), dan URL dalam bahasa aslinya kecuali ada padanan umum dalam Bahasa Indonesia.
- "tipe": Tipe data yang diinferensikan. Gunakan 'string_short' untuk teks singkat, 'string_long' untuk deskripsi panjang, 'date' (format YYYY-MM-DD jika tanggal spesifik ditemukan, jika tidak, berikan tanggal tekstual dan gunakan 'string_short'), 'url' untuk tautan web, 'number' untuk nilai numerik, 'boolean' untuk pernyataan benar/salah. Jika ambigu, gunakan 'unknown'.

FOKUS untuk menemukan dan mengisi sebanyak mungkin kunci-kunci berikut. JANGAN mengarang informasi jika tidak ditemukan.
Kunci INTI (WAJIB diusahakan ada jika informasi tersedia):
"Nama Proyek", "Token Ticker" (jika ada), "Link Airdrop Utama" (jika ada), "Jaringan Blockchain", "Tanggal Mulai" (atau tanggal pengumuman jika mulai tidak spesifik), "Batas Waktu Pendaftaran/Klaim", "Deskripsi Singkat Proyek/Airdrop", "Instruksi Partisipasi Utama" (poin-poin langkah utama).

Kunci TAMBAHAN PENTING (cari jika ada):
"Kriteria Kelayakan Lengkap", "Jumlah Token Dialokasikan untuk Airdrop", "Estimasi Nilai Airdrop" (jika disebutkan), "Platform Distribusi Token", "Tanggal Distribusi Token", "Jadwal Vesting" (jika ada), "Total Supply Token", "Harga Token Saat Listing" (jika diketahui), "Link Situs Web Proyek", "Link Whitepaper", "Link Komunitas (Twitter)", "Link Komunitas (Discord)", "Link Komunitas (Telegram)", "Link Medium/Blog Proyek", "Syarat KYC" (Ya/Tidak/Tidak disebutkan), "Negara yang Dibatasi" (jika ada), "Target Audiens/Pengguna", "Jenis Tugas Spesifik" (misal: swap, mint NFT, follow social media), "Minimum Transaksi/Volume" (jika ada), "Referral Program" (Ya/Tidak/Detail).

Jika suatu informasi tidak ditemukan setelah analisis mendalam, JANGAN sertakan kuncinya.
Jika tanggal disebutkan secara tekstual (mis., "akhir Agustus", "minggu depan"), ekstrak teks itu sebagai "nilai" dan set "tipe" ke "string_short". Jika tanggal spesifik seperti "15 Agustus 2024" ditemukan, format "nilai" sebagai "2024-08-15" dan set "tipe" ke "date".

Tempatkan semua objek yang berhasil diekstrak ke dalam array di field "extractedDetails".
Pada field "summary", berikan ringkasan singkat tentang PROSES ekstraksi, KUALITAS dan KELENGKAPAN hasil (misalnya, apakah informasi dari URL minim, apakah banyak field penting yang tidak ditemukan). Jika ada masalah (misalnya, URL gagal diambil atau kontennya tidak relevan sama sekali dengan airdrop), jelaskan di sini. Semuanya dalam Bahasa Indonesia.

{{#if textDescription}}
Teks Deskripsi Airdrop (jika ada):
{{{textDescription}}}
{{/if}}

{{#if sourceUrl}}
URL Sumber (WAJIB gunakan alat 'fetchWebpageContent' untuk mengambil dan menganalisis kontennya secara detail):
{{{sourceUrl}}}
{{/if}}

Kembalikan hasilnya sebagai objek JSON terstruktur yang cocok dengan skema output yang ditentukan.
Jika tidak ada detail relevan yang ditemukan, "extractedDetails" bisa berupa array kosong atau dihilangkan. Prioritaskan Kualitas dan Akurasi.
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
      return { extractedDetails: [], summary: output?.summary || 'AI model did not return any extracted details or the output was malformed. Konten sumber mungkin sangat minim atau tidak relevan.' };
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
    return { extractedDetails: validatedDetails, summary: output.summary || (validatedDetails.length > 0 ? "Ekstraksi berhasil." : "Tidak ada detail spesifik yang diekstrak, atau konten sumber minim.") };
  }
);

export async function extractAirdropDetailsFromText(input: ExtractAirdropTextInput): Promise<AirdropExtractedDetailItem[]> {
  const flowResult = await extractAirdropTextFlowInternal(input);
  // Optionally, you could log flowResult.summary here to see AI's feedback on the process
  console.log("AI Extraction Summary:", flowResult.summary);
  return flowResult.extractedDetails || [];
}

    
