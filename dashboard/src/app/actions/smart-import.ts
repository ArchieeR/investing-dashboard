'use server';

import { z } from 'zod';
import { getGeminiAI, GEMINI_MODEL, EXTRACTION_PROMPT } from '@/lib/gemini/client';
import type { ParseResult } from '@/types/import';

// Supported MIME types
const SUPPORTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ExtractedHoldingSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  qty: z.number(),
  price: z.number(),
  assetType: z.string(),
  account: z.string(),
  exchange: z.string().optional(),
});

const ParseResultSchema = z.object({
  statementDate: z.string().nullable(),
  provider: z.string().nullable(),
  holdings: z.array(ExtractedHoldingSchema),
});

export async function parseDocument(
  formData: FormData,
): Promise<{ data?: ParseResult; error?: string }> {
  try {
    const file = formData.get('document') as File | null;
    if (!file) return { error: 'No file provided' };
    if (file.size > MAX_FILE_SIZE) return { error: 'File too large (max 10MB)' };
    if (!SUPPORTED_TYPES.has(file.type) && !file.name.endsWith('.csv')) {
      return { error: `Unsupported file type: ${file.type || file.name.split('.').pop()}` };
    }

    const ai = getGeminiAI();

    // For text-based files, send as text prompt
    const isTextFile =
      file.type === 'text/csv' ||
      file.type === 'text/plain' ||
      file.name.endsWith('.csv');

    let response;

    if (isTextFile) {
      const text = await file.text();
      response = await ai.generate({
        model: GEMINI_MODEL,
        prompt: `${EXTRACTION_PROMPT}\n\nDocument content:\n${text}`,
      });
    } else {
      // For images, PDFs, Office docs — send as multimodal
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      response = await ai.generate({
        model: GEMINI_MODEL,
        prompt: [
          { text: EXTRACTION_PROMPT },
          { media: { url: dataUrl, contentType: file.type } },
        ],
      });
    }

    // Parse and clean the response
    let jsonText = response.text.trim();
    // Strip markdown code fences if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);
    const validated = ParseResultSchema.parse(parsed);

    return { data: validated };
  } catch (err) {
    console.error('Smart import error:', err);
    const message = err instanceof Error ? err.message : 'Failed to parse document';
    return { error: message };
  }
}
