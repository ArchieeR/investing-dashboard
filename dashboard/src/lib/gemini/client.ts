// =============================================================================
// Gemini 2.0 Flash — Vertex AI via Firebase service account (lazy init)
// Used for multimodal document parsing (images, PDFs, etc.)
// =============================================================================

import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

let _ai: ReturnType<typeof genkit> | null = null;

export function getGeminiAI() {
  if (!_ai) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    _ai = genkit({
      plugins: [
        vertexAI({
          projectId: serviceAccount?.project_id ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          location: 'europe-west2',
          googleAuth: serviceAccount ? { credentials: serviceAccount } : undefined,
        }),
      ],
    });
  }
  return _ai;
}

export const GEMINI_MODEL = 'vertexai/gemini-2.0-flash';

export const EXTRACTION_PROMPT = `You are a financial document parser. Extract all investment holdings from this document.

RULES:
- Extract every holding/position you can find
- For each holding, provide: ticker symbol, full name, quantity (number of shares/units), price per unit, asset type, and account type
- If the price is in GBX or pence, divide by 100 to convert to GBP
- Guess asset type from context: index funds/trackers → "ETF", individual companies → "Stock", crypto → "Crypto", bonds → "Bond", cash → "Cash", managed funds → "Fund", otherwise → "Other"
- Account types: ISA, SIPP, GIA, Trading, or use what the document says
- If a ticker symbol is missing, try to infer it from the fund/company name (e.g. "Vanguard S&P 500" → "VUSA.L")
- Try to detect the statement/valuation date from the document
- Try to detect the brokerage/provider name (e.g. "Interactive Investor", "Hargreaves Lansdown", "Vanguard")
- If a field is truly unknown, use reasonable defaults

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "statementDate": "YYYY-MM-DD" or null,
  "provider": "Provider Name" or null,
  "holdings": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "qty": 10,
      "price": 185.50,
      "assetType": "Stock",
      "account": "ISA",
      "exchange": "NASDAQ"
    }
  ]
}`;
