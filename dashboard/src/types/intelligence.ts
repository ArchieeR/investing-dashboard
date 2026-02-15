// =============================================================================
// Intelligence & Research Types
// =============================================================================

export interface MacroEvent {
  id: string;
  title: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  expected?: string;
  previous?: string;
  actual?: string;
  category: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tickers: string[];
  imageUrl?: string;
}

export interface EarningEvent {
  ticker: string;
  company: string;
  date: string;
  time: string;
  estimatedEPS?: number | null;
  actualEPS?: number | null;
  estimatedRevenue?: number | null;
  impliedMove?: string;
}

export interface ImpactEvent {
  title: string;
  keyPoints: string[];
  marketReaction: { asset: string; change: string }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
