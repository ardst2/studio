
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
  path: ['textDescription'], // atau ['sourceUrl']
});
export type ExtractAirdropInput = z.infer<typeof ExtractAirdropInputSchema>;

// Output schema disesuaikan agar cocok dengan field-field di AirdropForm/Airdrop type
export const ExtractAirdropOutputSchema = z.object({
  name: z.string().optional().describe('Nama proyek atau airdrop. Contoh: "Token XYZ Launch". WAJIB dalam Bahasa Indonesia.'),
  startDate: z.string().optional().describe('Tanggal mulai airdrop dalam format YYYY-MM-DD. Kosongkan jika tidak ada.'),
  deadline: z.string().optional().describe('Tanggal berakhir airdrop dalam format YYYY-MM-DD. Kosongkan jika tidak ada.'),
  blockchain: z.string().optional().describe('Jaringan blockchain utama yang digunakan (misal, Ethereum, Solana, BSC).'),
  registrationDate: z.string().optional().describe('Tanggal pendaftaran (jika ada) dalam format YYYY-MM-DD.'),
  participationRequirements: z.string().optional().describe('Syarat-syarat partisipasi atau kriteria kelayakan. WAJIB dalam Bahasa Indonesia.'),
  airdropLink: z.string().url({ message: "Format URL tidak valid."}).optional().describe('Link utama ke halaman airdrop atau pendaftaran.'),
  informationSource: z.string().optional().describe('Sumber informasi airdrop (misal, Twitter, Blog Proyek, teman). WAJIB dalam Bahasa Indonesia.'),
  userDefinedStatus: z.string().optional().describe('Status kustom yang mungkin terlihat dari teks (misal, Applied, KYC Done). WAJIB dalam Bahasa Indonesia.'),
  description: z.string().optional().describe('Deskripsi umum tentang airdrop atau proyek. WAJIB dalam Bahasa Indonesia.'),
  notes: z.string().optional().describe('Catatan tambahan atau informasi menarik lainnya. WAJIB dalam Bahasa Indonesia.'),
  walletAddress: z.string().optional().describe('Alamat wallet yang mungkin disebutkan perlu disiapkan (JANGAN MENGISI jika ini adalah alamat kontrak token).'),
  tokenAmount: z.number().optional().describe('Jumlah token yang dialokasikan atau bisa didapat (hanya angka).'),
  claimDate: z.string().optional().describe('Tanggal klaim token (jika ada) dalam format YYYY-MM-DD.'),
  airdropType: z.string().optional().describe('Jenis airdrop (misal, Retroaktif, Testnet, Gleam). WAJIB dalam Bahasa Indonesia.'),
  referralCode: z.string().optional().describe('Kode referral jika ditemukan.'),
  tasks: z.array(z.string()).optional().describe('Daftar tugas-tugas yang perlu dilakukan, sebagai array string. Setiap string adalah satu tugas. WAJIB dalam Bahasa Indonesia.'),
  aiSummary: z.string().optional().describe('Ringkasan dari AI mengenai proses ekstraksi, kualitas dan kelengkapan hasil, atau masalah apa pun yang dihadapi, dalam Bahasa Indonesia. WAJIB ADA.'),
});
export type ExtractAirdropOutput = z.infer<typeof ExtractAirdropOutputSchema>;


const extractionPrompt = ai.definePrompt({
  name: 'extractAirdropDetailsPrompt',
  input: { schema: ExtractAirdropInputSchema },
  output: { schema: ExtractAirdropOutputSchema },
  tools: [fetchWebpageContentTool],
  prompt: `Anda adalah AI ahli yang sangat teliti dalam mengekstrak informasi airdrop kripto untuk diinput ke dalam sistem manajemen airdrop. Semua output HARUS dalam Bahasa Indonesia kecuali URL.
Tugas Anda adalah menganalisis teks deskripsi yang diberikan DAN/ATAU konten dari URL sumber (jika disediakan) untuk mengisi sebanyak mungkin field berikut.
Jika sourceUrl disediakan, WAJIB gunakan alat 'fetchWebpageContent' untuk mendapatkan konten tekstualnya. Perlakukan konten dari URL tersebut dengan KETELITIAN YANG SAMA seperti input teks langsung.

Field yang HARUS DIISI jika informasinya ada (prioritaskan ini):
- name: Nama proyek atau airdrop.
- description: Deskripsi umum tentang airdrop atau proyek.
- airdropLink: Link utama ke halaman airdrop/pendaftaran (jika ada).
- participationRequirements: Syarat partisipasi atau kriteria kelayakan.
- tasks: Array string berisi langkah-langkah atau tugas yang perlu dilakukan. Setiap tugas adalah satu string.
- startDate: Tanggal mulai airdrop (format YYYY-MM-DD).
- deadline: Tanggal berakhir/batas waktu airdrop (format YYYY-MM-DD).

Field PENTING LAINNYA untuk diisi jika informasinya ada:
- blockchain: Jaringan blockchain (misal, Ethereum, Solana).
- registrationDate: Tanggal pendaftaran jika berbeda dari tanggal mulai (format YYYY-MM-DD).
- informationSource: Dari mana informasi airdrop ini berasal (misal, Twitter Proyek X, Blog Post Y).
- userDefinedStatus: Status kustom yang mungkin terlihat dari teks (misal, Pendaftaran dibuka, KYC Diperlukan).
- notes: Catatan tambahan penting atau informasi menarik lain yang tidak masuk field lain.
- walletAddress: Alamat wallet yang disebutkan perlu disiapkan (JANGAN ISI jika ini alamat kontrak token).
- tokenAmount: Jumlah token yang bisa didapat (hanya angka, misal 100, 5000).
- claimDate: Tanggal klaim token jika ada (format YYYY-MM-DD).
- airdropType: Jenis airdrop (misal, Retroaktif, Testnet, Gleam, Komunitas).
- referralCode: Kode referral jika ditemukan.

PENTING:
- Jika suatu informasi tidak ditemukan setelah analisis mendalam, JANGAN sertakan field tersebut atau biarkan nilainya kosong/undefined (jangan mengarang informasi).
- Untuk SEMUA field teks deskriptif (name, description, participationRequirements, informationSource, userDefinedStatus, notes, airdropType, dan setiap item dalam tasks), output WAJIB dalam Bahasa Indonesia. Terjemahkan jika sumbernya berbahasa Inggris.
- Untuk tanggal (startDate, deadline, registrationDate, claimDate), jika tanggal spesifik ditemukan (misal "15 Agustus 2024"), format sebagai "YYYY-MM-DD" (misal "2024-08-15"). Jika tanggal bersifat perkiraan (misal "akhir Agustus", "minggu depan"), tuliskan apa adanya dalam Bahasa Indonesia dan masukkan ke field 'notes' atau 'description' jika lebih cocok, dan kosongkan field tanggal spesifiknya.
- Untuk 'tokenAmount', ekstrak hanya angka. Jika ada rentang (misal 50-100 token), ambil angka terkecil atau rata-rata jika memungkinkan, atau masukkan rentang teks ke 'notes'.
- AI WAJIB memberikan 'aiSummary': Ringkasan singkat mengenai proses ekstraksi, KUALITAS DAN KELENGKAPAN hasil ekstraksi (misalnya, apakah informasi dari URL minim, apakah banyak field penting yang tidak ditemukan), atau masalah apa pun yang dihadapi oleh AI (misalnya, jika konten URL minim atau tidak relevan), dalam Bahasa Indonesia.

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
Prioritaskan Kualitas, Akurasi, dan Kelengkapan. Jika suatu field tidak ada informasinya, lebih baik dikosongkan daripada diisi dengan informasi yang salah atau tidak relevan.
Pastikan field 'aiSummary' selalu ada dan berisi feedback Anda.
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
    
    // Pastikan aiSummary selalu ada
    if (!output.aiSummary) {
        output.aiSummary = "AI tidak memberikan ringkasan spesifik, namun hasil ekstraksi (jika ada) telah dikembalikan.";
    }

    // Validasi atau transformasi sederhana bisa dilakukan di sini jika perlu
    // Contoh: memastikan tasks adalah array
    output.tasks = Array.isArray(output.tasks) ? output.tasks : [];

    return output;
  }
);

export async function extractAirdropDetails(input: ExtractAirdropInput): Promise<ExtractAirdropOutput> {
  const flowResult = await extractAirdropFlowInternal(input);
  console.log("AI Extraction Summary from Flow:", flowResult.aiSummary);
  return flowResult;
}

    