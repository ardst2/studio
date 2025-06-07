
'use server';
/**
 * @fileOverview A Genkit tool for fetching and extracting textual content from a webpage.
 *
 * - fetchWebpageContentTool - The Genkit tool definition.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as _cheerio from 'cheerio'; // Cheerio is CJS, often needs this import style in ESM
const cheerio = _cheerio; // Assign to a const for easier usage

const FetchWebpageInputSchema = z.object({
  url: z.string().url({ message: "URL tidak valid." }).describe('URL halaman web yang akan diambil kontennya.'),
});

const FetchWebpageOutputSchema = z.object({
  extractedText: z.string().optional().describe('Konten tekstual utama yang diekstrak dari halaman web. Bisa undefined jika terjadi error atau tidak ada konten yang signifikan.'),
  error: z.string().optional().describe('Pesan error jika pengambilan atau parsing gagal.'),
});

// Max characters to return to prevent overly long content for the LLM
const MAX_CONTENT_LENGTH = 15000; 

export const fetchWebpageContentTool = ai.defineTool(
  {
    name: 'fetchWebpageContent',
    description: 'Mengambil konten tekstual utama dari URL yang diberikan. Gunakan ini untuk memahami konten halaman web ketika URL disediakan sebagai sumber.',
    inputSchema: FetchWebpageInputSchema,
    outputSchema: FetchWebpageOutputSchema,
  },
  async ({url}) => {
    try {
      console.log(`[fetchWebpageContentTool] Fetching URL: ${url}`);
      const response = await fetch(url, {
        headers: {
          // Some websites block requests without a common user-agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        // Timeout can be important for web requests
        // signal: AbortSignal.timeout(15000) // 15 seconds timeout (requires Node 16.14+ or compatible env)
      });

      if (!response.ok) {
        console.error(`[fetchWebpageContentTool] HTTP error ${response.status} for URL: ${url}`);
        return { error: `Gagal mengambil URL: Status ${response.status}` };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove common non-content elements
      $('script, style, nav, footer, header, aside, form, noscript, svg, [aria-hidden="true"]').remove();
      
      // Attempt to get text from main content areas, then body
      let textContent = $('main').text() || $('article').text() || $('div[role="main"]').text() || $('body').text();
      
      // Basic cleanup
      textContent = textContent
        .replace(/(\r\n|\n|\r)/gm, " ") // Replace newlines with spaces
        .replace(/\s\s+/g, ' ') // Replace multiple spaces with single space
        .trim();

      if (textContent.length > MAX_CONTENT_LENGTH) {
        textContent = textContent.substring(0, MAX_CONTENT_LENGTH) + "... (konten dipotong)";
      }
      
      console.log(`[fetchWebpageContentTool] Extracted content length: ${textContent.length} for URL: ${url}`);
      return { extractedText: textContent };

    } catch (err: any) {
      console.error(`[fetchWebpageContentTool] Error fetching or parsing URL ${url}:`, err);
      let errorMessage = 'Terjadi kesalahan saat memproses URL.';
      if (err.message) {
        errorMessage += ` Detail: ${err.message}`;
      }
      // Check for timeout error specifically if using AbortSignal
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        errorMessage = `Pengambilan URL ${url} melebihi batas waktu.`;
      }
      return { error: errorMessage };
    }
  }
);
