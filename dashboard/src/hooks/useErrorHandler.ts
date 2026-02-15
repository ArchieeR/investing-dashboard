'use client';

import { useCallback } from 'react';
import { logger } from '@/services/logging';
import { toast } from '@/components/shared/Toast';

export type ErrorCategory = 'network' | 'validation' | 'permission' | 'storage' | 'unknown';
export type ErrorSeverity = 'low' | 'medium' | 'high';

interface CategorisedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  original: unknown;
}

function categoriseError(error: unknown): CategorisedError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return { category: 'network', severity: 'medium', message: 'Network error. Check your connection.', original: error };
  }

  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return { category: 'storage', severity: 'high', message: 'Storage quota exceeded. Clear some data.', original: error };
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('timeout')) {
      return { category: 'network', severity: 'medium', message: 'Network error. Please try again.', original: error };
    }
    if (msg.includes('permission') || msg.includes('unauthorized') || msg.includes('forbidden')) {
      return { category: 'permission', severity: 'high', message: 'Permission denied.', original: error };
    }
    if (msg.includes('valid') || msg.includes('required') || msg.includes('invalid')) {
      return { category: 'validation', severity: 'low', message: error.message, original: error };
    }
    if (msg.includes('storage') || msg.includes('quota')) {
      return { category: 'storage', severity: 'high', message: 'Storage error. Try clearing data.', original: error };
    }

    return { category: 'unknown', severity: 'medium', message: error.message, original: error };
  }

  return { category: 'unknown', severity: 'medium', message: 'An unexpected error occurred.', original: error };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const waitTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await delay(waitTime);
      }
    }
  }
  throw lastError;
}

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, context?: string) => {
    const categorised = categoriseError(error);

    const errorObj = error instanceof Error ? error : new Error(categorised.message);
    logger.error('portfolio', errorObj, {
      category: categorised.category,
      severity: categorised.severity,
      context,
    });

    const variant = categorised.severity === 'low' ? 'warning' : 'error';
    toast(categorised.message, variant);

    return categorised;
  }, []);

  return { handleError, categoriseError, retryWithBackoff };
}
