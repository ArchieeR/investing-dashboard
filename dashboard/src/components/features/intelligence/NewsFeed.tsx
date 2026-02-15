"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsItem } from "@/types/intelligence";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  Bloomberg: "bg-blue-500/20 text-blue-400",
  Reuters: "bg-orange-500/20 text-orange-400",
  "Financial Times": "bg-[#FFF1E0]/20 text-[#FCD0A1]",
  CNBC: "bg-yellow-500/20 text-yellow-400",
  "Wall Street Journal": "bg-gray-500/20 text-gray-300",
  "Yahoo Finance": "bg-purple-500/20 text-purple-400",
};

interface NewsFeedProps {
  initialItems: NewsItem[];
  portfolioTickers?: string[];
  onLoadMore?: (page: number) => Promise<NewsItem[]>;
}

export function NewsFeed({
  initialItems,
  portfolioTickers = [],
  onLoadMore,
}: NewsFeedProps) {
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const tickerSet = new Set(portfolioTickers.map((t) => t.toUpperCase()));

  const loadMore = useCallback(async () => {
    if (loading || !onLoadMore) return;
    setLoading(true);
    try {
      const more = await onLoadMore(page);
      if (more.length > 0) {
        setItems((prev) => [...prev, ...more]);
        setPage((p) => p + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, onLoadMore, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, onLoadMore]);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          News Feed
        </h3>
        <p className="text-xs text-muted-foreground">No news available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        News Feed
      </h3>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {items.map((item, i) => {
          const matchesPortfolio = item.tickers.some((t) =>
            tickerSet.has(t.toUpperCase())
          );
          return (
            <motion.a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={cn(
                "block p-3 rounded-lg border transition-colors hover:bg-muted/30",
                matchesPortfolio
                  ? "border-primary/30 bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SourceBadge source={item.source} />
                    {item.tickers.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono text-[#22D3EE]"
                      >
                        ${t}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                    {item.summary}
                  </p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                    {relativeTime(item.publishedAt)}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground/40 flex-shrink-0 mt-1" />
              </div>
            </motion.a>
          );
        })}
        <div ref={sentinelRef} className="h-1" />
        {loading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Loading more...
          </p>
        )}
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colorClass =
    SOURCE_COLORS[source] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
        colorClass
      )}
    >
      {source}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
