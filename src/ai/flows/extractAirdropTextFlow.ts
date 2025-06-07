
'use server';
/**
 * @fileOverview Genkit flow for extracting airdrop details from text or URL.
 *
 * - extractAirdropDetails: Analyzes text/URL to extract structured airdrop information.
 * - ExtractAirdropInput - Input type for the flow.
 * - ExtractAirdropOutput - Output type for the flow, structured like Airdrop data.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import { fetchWebpageContentTool } from '@/ai/tools/fetchWebpageTool';

// --- Schemas ---
const ExtractAirdropInputSchema = z.object({
  textDescription: z.string().min(3, 'Deskripsi teks minimal 3 karakter.').optional().describe('Deskripsi teks lengkap dari pengumuman airdrop.'),
  sourceUrl: z.string().url({ message: "Format URL tidak valid."}).optional().describe('URL opsional ke pengumuman airdrop atau halaman terkait.'),
}).refine(data => data.textDescription || data.sourceUrl, {
  message: 'Deskripsi teks atau URL sumber harus disediakan.',
  path: ['textDescription'], 
});
export type ExtractAirdropInput = z.infer<typeof ExtractAirdropInputSchema>;

// Output schema disesuaikan agar cocok dengan field-field di AirdropForm/Airdrop type
// These fields are optional; if data isn't found, the LLM should OMIT the field.
const ExtractAirdropOutputSchema = z.object({
  name: z.string().optional().describe('Nama proyek atau airdrop. Contoh: "Token XYZ Launch". WAJIB dalam Bahasa Indonesia.'),
  startDate: z.string().optional().describe('Tanggal mulai airdrop dalam format YYYY-MM-DD. Omit jika tidak ada.'),
  deadline: z.string().optional().describe('Tanggal berakhir airdrop dalam format YYYY-MM-DD. Omit jika tidak ada.'),
  blockchain: z.string().optional().describe('Jaringan blockchain utama yang digunakan (misal, Ethereum, Solana, BSC). Omit jika tidak ada.'),
  registrationDate: z.string().optional().describe('Tanggal pendaftaran (jika ada) dalam format YYYY-MM-DD. Omit jika tidak ada.'),
  participationRequirements: z.string().optional().describe('Syarat-syarat partisipasi atau kriteria kelayakan. WAJIB dalam Bahasa Indonesia. Omit jika tidak ada.'),
  airdropLink: z.string().url({ message: "Format URL tidak valid."}).optional().describe('Link utama ke halaman airdrop atau pendaftaran. Omit jika tidak ada.'),
  informationSource: z.string().optional().describe('Sumber informasi airdrop (misal, Twitter, Blog Proyek, teman). WAJIB dalam Bahasa Indonesia. Omit jika tidak ada.'),
  userDefinedStatus: z.string().optional().describe('Status kustom yang mungkin terlihat dari teks (misal, Applied, KYC Done). WAJIB dalam Bahasa Indonesia. Omit jika tidak ada.'),
  description: z.string().optional().describe('Deskripsi umum tentang airdrop atau proyek. WAJIB dalam Bahasa Indonesia. Omit jika tidak ada.'),
  notes: z.string().optional().describe('Catatan tambahan atau informasi menarik lainnya. WAJIB dalam Bahasa Indonesia. Omit jika tidak ada.'),
  walletAddress: z.string().optional().describe('Alamat wallet yang mungkin disebutkan perlu disiapkan (JANGAN MENGISI jika ini adalah alamat kontrak token). Omit jika tidak ada.'),
  tokenAmount: z.number().optional().describe('Jumlah token yang dialokasikan atau bisa didapat (hanya angka). Omit jika tidak ada.'),
  claimDate: z.string().optional().describe('Tanggal klaim token (jika ada) dalam format YYYY-MM-DD. Omit jika tidak ada.'),
  airdropType: z.string().optional().describe('Jenis airdrop (misal, Retroaktif, Testnet, Gleam). WAJIB dalam Bahasa Indonesia. Omit jika tidak ada.'),
  referralCode: z.string().optional().describe('Kode referral jika ditemukan. Omit jika tidak ada.'),
  tasks: z.array(z.string()).optional().describe('Daftar tugas-tugas yang perlu dilakukan, sebagai array string. Setiap string adalah satu tugas. WAJIB dalam Bahasa Indonesia. Omit jika tidak ada atau berikan array kosong [].'),
  aiSummary: z.string().describe('Ringkasan dari AI mengenai proses ekstraksi, kualitas dan kelengkapan hasil, atau masalah apa pun yang dihadapi, dalam Bahasa Indonesia. WAJIB ADA.'),
});
export type ExtractAirdropOutput = z.infer<typeof ExtractAirdropOutputSchema>;


const extractionPrompt = ai.definePrompt({
  name: 'extractAirdropDetailsPrompt',
  input: { schema: ExtractAirdropInputSchema },
  output: { schema: ExtractAirdropOutputSchema },
  tools: [fetchWebpageContentTool],
  prompt: `Anda adalah AI ahli yang sangat teliti dalam mengekstrak informasi airdrop kripto untuk diinput ke dalam sistem manajemen airdrop. Semua output HARUS dalam Bahasa Indonesia kecuali URL.
Tugas Anda adalah menganalisis teks deskripsi yang diberikan DAN/ATAU konten dari URL sumber (jika disediakan) untuk mengisi sebanyak mungkin field yang telah ditentukan dalam skema output.
Jika sourceUrl disediakan, WAJIB gunakan alat 'fetchWebpageContent' untuk mendapatkan konten tekstualnya. Perlakukan konten dari URL tersebut dengan KETELITIAN YANG SAMA seperti input teks langsung.

Field yang HARUS DIISI jika informasinya ada (prioritaskan ini):
- name: Nama proyek atau airdrop.
- description: Deskripsi umum tentang airdrop atau proyek.
- participationRequirements: Syarat partisipasi atau kriteria kelayakan.
- tasks: Array string berisi langkah-langkah atau tugas yang perlu dilakukan.

PENTING SEKALI:
- Untuk SEMUA field yang bersifat opsional dalam skema output: Jika informasinya tidak ada atau tidak ditemukan setelah analisis mendalam, **JANGAN sertakan field tersebut sama sekali dalam output JSON Anda.** Dengan kata lain, hilangkan key tersebut dari objek JSON. **Jangan pernah mengirimkan nilai \`null\` untuk field apapun.**
- Field \`aiSummary\` WAJIB ADA dan harus selalu berisi ringkasan proses Anda.
- Untuk SEMUA field teks deskriptif (name, description, participationRequirements, informationSource, userDefinedStatus, notes, airdropType, dan setiap item dalam tasks), output WAJIB dalam Bahasa Indonesia. Terjemahkan jika sumbernya berbahasa Inggris.
- Untuk tanggal (startDate, deadline, registrationDate, claimDate): Jika tanggal spesifik ditemukan (misal "15 Agustus 2024"), format sebagai "YYYY-MM-DD". Jika tidak ada informasi tanggal, JANGAN sertakan field tanggal tersebut dalam output.
- Untuk \`tokenAmount\`: Ekstrak hanya angka. Jika tidak ada informasi, JANGAN sertakan field \`tokenAmount\` dalam output.
- Untuk \`tasks\`: Jika tidak ada tugas yang teridentifikasi, JANGAN sertakan field \`tasks\` dalam output, atau berikan array kosong \`[]\`.
- Pastikan \`aiSummary\` selalu ada dan berisi feedback Anda tentang kualitas dan kelengkapan hasil ekstraksi (misalnya, apakah informasi dari URL minim, apakah banyak field penting yang tidak ditemukan), atau masalah apa pun yang dihadapi oleh AI (misalnya, jika konten URL minim atau tidak relevan), dalam Bahasa Indonesia.

Input Pengguna:
{{#if textDescription}}
Deskripsi Teks:
{{{textDescription}}}
{{/if}}

{{#if sourceUrl}}
URL Sumber (WAJIB gunakan alat 'fetchWebpageContent' untuk mengambil dan menganalisis kontennya secara detail):
{{{sourceUrl}}}
{{/if}}

Kembalikan hasilnya sebagai objek JSON tunggal yang cocok dengan skema output yang ditentukan. Jangan mengembalikan array.
Prioritaskan Kualitas, Akurasi, dan Kelengkapan.
`,
});


const extractAirdropFlowInternal = ai.defineFlow(
  {
    name: 'extractAirdropFlowInternal',
    inputSchema: ExtractAirdropInputSchema,
    outputSchema: ExtractAirdropOutputSchema,
  },
  async (input) => {
    const {output} = await extractionPrompt(input);

    if (!output) {
      return { aiSummary: 'AI model tidak mengembalikan output atau outputnya tidak valid. Konten sumber mungkin sangat minim atau tidak relevan.' };
    }
    
    // Pastikan aiSummary selalu ada, dan tasks adalah array jika outputnya ada tapi tasks tidak disertakan (jadi defaultnya array kosong)
    return {
        ...output, // sebarkan semua field dari output
        tasks: Array.isArray(output.tasks) ? output.tasks : [], // Pastikan tasks selalu array atau array kosong
        aiSummary: output.aiSummary || "AI tidak memberikan ringkasan spesifik, namun hasil ekstraksi (jika ada) telah dikembalikan.", // Pastikan aiSummary ada
    };
  }
);

export async function extractAirdropDetails(input: ExtractAirdropInput): Promise<ExtractAirdropOutput> {
  const flowResult = await extractAirdropFlowInternal(input);
  console.log("AI Extraction Summary from Flow:", flowResult.aiSummary);
  return flowResult;
}
