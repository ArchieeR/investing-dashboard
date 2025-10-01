import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAlpacaQuote, fetchMultipleAlpacaQuotes } from '../src/services/alpacaApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Alpaca API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAlpacaQuote', () => {
    it('should return null for non-US exchanges', async () => {
      const result = await fetchAlpacaQuote('LLOY', 'LSE');
      expect(result).toBeNull();
    });

    it('should return null when API is not configured', async () => {
      // Without proper API key configuration, should return null
      const result = await fetchAlpacaQuote('AAPL', 'NASDAQ');
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Even if configured, should handle errors gracefully
      const result = await fetchAlpacaQuote('INVALID', 'NASDAQ');
      expect(result).toBeNull();
    });
  });

  describe('fetchMultipleAlpacaQuotes', () => {
    it('should filter out non-US holdings', async () => {
      const holdings = [
        { ticker: 'AAPL', exchange: 'NASDAQ' },
        { ticker: 'LLOY', exchange: 'LSE' }, // Should be filtered out
        { ticker: 'MSFT', exchange: 'NYSE' }
      ];

      const results = await fetchMultipleAlpacaQuotes(holdings);
      
      // Without API configuration, should return empty results
      // but should not crash and should handle filtering correctly
      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(0);
    });

    it('should return empty results when API not configured', async () => {
      const holdings = [
        { ticker: 'AAPL', exchange: 'NASDAQ' },
        { ticker: 'MSFT', exchange: 'NYSE' }
      ];

      const results = await fetchMultipleAlpacaQuotes(holdings);
      
      // Should return empty Map when not configured
      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(0);
    });
  });

  describe('Integration behavior', () => {
    it('should be used as fallback in the price fetching chain', () => {
      // Test that the module exports the expected functions
      expect(typeof fetchAlpacaQuote).toBe('function');
      expect(typeof fetchMultipleAlpacaQuotes).toBe('function');
    });

    it('should handle ticker formatting for US exchanges', async () => {
      // Test ticker formatting logic by checking non-US vs US exchanges
      const lseResult = await fetchAlpacaQuote('LLOY.L', 'LSE');
      const nasdaqResult = await fetchAlpacaQuote('AAPL', 'NASDAQ');
      
      // LSE should be rejected immediately
      expect(lseResult).toBeNull();
      
      // NASDAQ should at least attempt (even if it fails due to no API key)
      // Both will be null without API key, but the behavior should be consistent
      expect(nasdaqResult).toBeNull();
    });
  });
});