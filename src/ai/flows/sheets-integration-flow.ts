'use server';
/**
 * @fileOverview Genkit flows for Google Sheets integration.
 *
 * - importAirdropsFromSheet: Imports airdrop data from a specified Google Sheet.
 * - exportAirdropsToSheet: Exports airdrop data to a specified Google Sheet.
 *
 * Authentication:
 * These flows require Google Cloud authentication with access to the Google Sheets API.
 * 1. Enable the Google Sheets API in your Google Cloud project.
 * 2. Set up credentials:
 *    - For local development or non-Google Cloud hosting:
 *      Create a Service Account, download its JSON key, and set the
 *      GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of this key file.
 *      Grant this Service Account editor access to the Google Sheets you intend to use.
 *    - When deployed on Google Cloud (e.g., Cloud Run, App Engine, Firebase Functions):
 *      Use Application Default Credentials (ADC). Ensure the service account running
 *      your application has appropriate IAM permissions for Google Sheets and editor
 *      access to the target Google Sheets.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {google} from 'googleapis';
import type {Airdrop, AirdropTask, AirdropStatus} from '@/types/airdrop';
import { format, parse, isValid } from 'date-fns';

// Helper to get an authenticated Google Sheets API client
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const authClient = await auth.getClient();
  return google.sheets({version: 'v4', auth: authClient});
}

// --- Schemas ---
const SheetCoordinatesSchema = z.object({
  sheetId: z.string().min(1, 'Sheet ID is required.').describe('The ID of the Google Sheet (from its URL).'),
  tabName: z.string().min(1, 'Tab name is required.').describe('The name of the tab within the Google Sheet.'),
});

const ImportedAirdropDataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startDate: z.number().optional(), // Timestamp
  deadline: z.number().optional(), // Timestamp
  tasks: z.array(z.object({ text: z.string(), completed: z.boolean() })).optional(),
  status: z.enum(['Upcoming', 'Active', 'Completed']).optional(),
});
export type ImportedAirdropData = z.infer<typeof ImportedAirdropDataSchema>;

// --- Import Flow ---
export const importAirdropsInputSchema = SheetCoordinatesSchema;
export type ImportAirdropsInput = z.infer<typeof importAirdropsInputSchema>;

export const importAirdropsOutputSchema = z.object({
    importedAirdrops: z.array(ImportedAirdropDataSchema),
    message: z.string(),
});
export type ImportAirdropsOutput = z.infer<typeof importAirdropsOutputSchema>;

const SHEET_HEADERS = ['Name', 'Description', 'StartDate (YYYY-MM-DD)', 'Deadline (YYYY-MM-DD)', 'Tasks (text;text;...)', 'Status'];

function parseSheetDate(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsedDate) ? parsedDate.getTime() : undefined;
}

function parseTasksString(tasksStr?: string): AirdropTask[] {
  if (!tasksStr) return [];
  return tasksStr.split(';').map(text => text.trim()).filter(text => text.length > 0).map(text => ({
    id: crypto.randomUUID(), // Client should generate consistent IDs if needed for updates
    text,
    completed: false, // Default to not completed on import
  }));
}


const importAirdropsFlow = ai.defineFlow(
  {
    name: 'importAirdropsFlow',
    inputSchema: importAirdropsInputSchema,
    outputSchema: importAirdropsOutputSchema,
  },
  async ({sheetId, tabName}) => {
    const sheets = await getSheetsClient();
    const range = `${tabName}!A:F`; // Assuming columns A to F based on SHEET_HEADERS

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) { // Need at least header + 1 data row
        return { importedAirdrops: [], message: 'No data found in sheet or sheet is empty/has only headers.' };
      }

      const headers = rows[0].map(h => String(h).trim());
      const expectedHeaders = SHEET_HEADERS.map(h => h.trim());
      // Basic header validation
      if (!expectedHeaders.every((eh, i) => headers[i] === eh)) {
          throw new Error(`Sheet headers do not match expected format. Expected: "${expectedHeaders.join(', ')}". Found: "${headers.join(', ')}"`);
      }

      const nameIndex = headers.indexOf('Name');
      const descriptionIndex = headers.indexOf('Description');
      const startDateIndex = headers.indexOf('StartDate (YYYY-MM-DD)');
      const deadlineIndex = headers.indexOf('Deadline (YYYY-MM-DD)');
      const tasksIndex = headers.indexOf('Tasks (text;text;...)');
      const statusIndex = headers.indexOf('Status');


      const importedAirdrops: ImportedAirdropData[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = row[nameIndex] ? String(row[nameIndex]).trim() : undefined;

        if (!name) continue; // Skip rows without a name

        const airdrop: ImportedAirdropData = {
          name,
          description: row[descriptionIndex] ? String(row[descriptionIndex]).trim() : undefined,
          startDate: parseSheetDate(row[startDateIndex] ? String(row[startDateIndex]).trim() : undefined),
          deadline: parseSheetDate(row[deadlineIndex] ? String(row[deadlineIndex]).trim() : undefined),
          tasks: parseTasksString(row[tasksIndex] ? String(row[tasksIndex]).trim() : undefined),
          status: row[statusIndex] ? String(row[statusIndex]).trim() as AirdropStatus : 'Upcoming',
        };
        importedAirdrops.push(airdrop);
      }
      return { importedAirdrops, message: `Successfully imported ${importedAirdrops.length} airdrops.` };
    } catch (err: any) {
      console.error('Error importing from Google Sheet:', err);
      throw new Error(err.message || 'Failed to import data from Google Sheet.');
    }
  }
);

export async function importAirdropsFromSheet(input: ImportAirdropsInput): Promise<ImportAirdropsOutput> {
  return importAirdropsFlow(input);
}


// --- Export Flow ---
const AirdropForExportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  startDate: z.number().optional(),
  deadline: z.number().optional(),
  description: z.string().optional(),
  tasks: z.array(z.object({ id: z.string(), text: z.string(), completed: z.boolean() })),
  status: z.enum(['Upcoming', 'Active', 'Completed']),
  createdAt: z.number(),
});

export const exportAirdropsInputSchema = z.object({
  sheetCoordinates: SheetCoordinatesSchema,
  airdrops: z.array(AirdropForExportSchema),
});
export type ExportAirdropsInput = z.infer<typeof exportAirdropsInputSchema>;

export const exportAirdropsOutputSchema = z.object({
  message: z.string(),
  rowsWritten: z.number(),
});
export type ExportAirdropsOutput = z.infer<typeof exportAirdropsOutputSchema>;

function formatTimestampForSheet(timestamp?: number): string {
  if (!timestamp) return '';
  return format(new Date(timestamp), 'yyyy-MM-dd');
}

function formatTasksForSheet(tasks: AirdropTask[]): string {
  return tasks.map(task => task.text).join(';');
}

const exportAirdropsFlow = ai.defineFlow(
  {
    name: 'exportAirdropsFlow',
    inputSchema: exportAirdropsInputSchema,
    outputSchema: exportAirdropsOutputSchema,
  },
  async ({sheetCoordinates, airdrops}) => {
    const {sheetId, tabName} = sheetCoordinates;
    const sheets = await getSheetsClient();

    const values = [
      SHEET_HEADERS, // Header row
      ...airdrops.map(airdrop => [
        airdrop.name || '',
        airdrop.description || '',
        formatTimestampForSheet(airdrop.startDate),
        formatTimestampForSheet(airdrop.deadline),
        formatTasksForSheet(airdrop.tasks),
        airdrop.status || '',
      ]),
    ];

    try {
      // Clear existing data in the tab (optional, but often desired for export)
      // Be cautious with this in a real app; provide options or warnings.
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: tabName, // Clears the entire tab
      });

      // Write new data
      const result = await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tabName}!A1`, // Start writing from cell A1
        valueInputOption: 'USER_ENTERED', // Or 'RAW' if you don't want Sheets to parse values
        requestBody: {
          values,
        },
      });
      
      const rowsWritten = result.data.updatedRows || 0;
      return { message: `Successfully exported ${rowsWritten -1} airdrops to sheet.`, rowsWritten: rowsWritten - 1 }; // -1 for header
    } catch (err: any) {
      console.error('Error exporting to Google Sheet:', err);
      throw new Error(err.message || 'Failed to export data to Google Sheet.');
    }
  }
);

export async function exportAirdropsToSheet(input: ExportAirdropsInput): Promise<ExportAirdropsOutput> {
  return exportAirdropsFlow(input);
}
