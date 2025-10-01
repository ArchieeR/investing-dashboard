export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high';
  category: 'network' | 'validation' | 'permission' | 'storage' | 'unknown';
  isRetryable: boolean;
  recoverySuggestions: string[];
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  attemptCount: number;
}

/**
 * Service for handling errors in backup and restore operations with retry mechanisms
 * and user-friendly error messages.
 */
export class ErrorHandlingService {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'fetch',
      'network',
      '503',
      '502',
      '504',
      'timeout',
      'connection',
    ],
  };

  /**
   * Analyzes an error and returns detailed error information
   */
  static analyzeError(error: unknown): ErrorDetails {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Determine error category and details
    const category = this.categorizeError(errorObj);
    const severity = this.determineSeverity(errorObj, category);
    const isRetryable = this.isRetryableError(errorObj);
    const userMessage = this.generateUserMessage(errorObj, category);
    const recoverySuggestions = this.generateRecoverySuggestions(errorObj, category);

    return {
      code: this.generateErrorCode(errorObj, category),
      message: errorObj.message,
      userMessage,
      severity,
      category,
      isRetryable,
      recoverySuggestions,
    };
  }

  /**
   * Executes an operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: ErrorDetails | undefined;
    
    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attemptCount: attempt,
        };
      } catch (error) {
        const errorDetails = this.analyzeError(error);
        lastError = errorDetails;

        // Don't retry if error is not retryable or we've reached max attempts
        if (!errorDetails.isRetryable || attempt === finalConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        );

        console.warn(`Operation failed (attempt ${attempt}/${finalConfig.maxAttempts}), retrying in ${delay}ms:`, errorDetails.message);
        
        await this.delay(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attemptCount: finalConfig.maxAttempts,
    };
  }

  /**
   * Creates a user-friendly error notification
   */
  static createErrorNotification(errorDetails: ErrorDetails): {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    actions: Array<{ label: string; action: string }>;
  } {
    const type = errorDetails.severity === 'high' ? 'error' : 
                 errorDetails.severity === 'medium' ? 'warning' : 'info';

    const actions: Array<{ label: string; action: string }> = [];

    if (errorDetails.isRetryable) {
      actions.push({ label: 'Try Again', action: 'retry' });
    }

    if (errorDetails.category === 'network') {
      actions.push({ label: 'Check Connection', action: 'check-network' });
    }

    if (errorDetails.category === 'validation') {
      actions.push({ label: 'View Details', action: 'view-details' });
    }

    actions.push({ label: 'Dismiss', action: 'dismiss' });

    return {
      title: this.getErrorTitle(errorDetails),
      message: errorDetails.userMessage,
      type,
      actions,
    };
  }

  private static categorizeError(error: Error): ErrorDetails['category'] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || name.includes('networkerror') ||
        message.includes('timeout') || name.includes('timeout') ||
        message.includes('abort') || name.includes('abort') ||
        message.includes('503') || message.includes('502') || message.includes('504')) {
      return 'network';
    }

    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('malformed') || message.includes('corrupt')) {
      return 'validation';
    }

    if (message.includes('permission') || message.includes('unauthorized') || 
        message.includes('forbidden') || message.includes('403')) {
      return 'permission';
    }

    if (message.includes('storage') || message.includes('disk') || 
        message.includes('space') || message.includes('quota')) {
      return 'storage';
    }

    return 'unknown';
  }

  private static determineSeverity(error: Error, category: ErrorDetails['category']): ErrorDetails['severity'] {
    // Network errors are usually temporary (low severity)
    if (category === 'network') {
      return 'low';
    }

    // Validation errors need attention but aren't critical (medium severity)
    if (category === 'validation') {
      return 'medium';
    }

    // Permission and storage errors are more serious (high severity)
    if (category === 'permission' || category === 'storage') {
      return 'high';
    }

    // Unknown errors default to medium severity
    return 'medium';
  }

  private static isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /temporary/i,
      /503/,
      /502/,
      /504/,
      /aborted/i,
    ];

    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private static generateUserMessage(error: Error, category: ErrorDetails['category']): string {
    switch (category) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      case 'validation':
        return 'The backup file appears to be corrupted or invalid. Please try a different backup file.';
      
      case 'permission':
        return 'You don\'t have permission to perform this operation. Please check your access rights.';
      
      case 'storage':
        return 'There\'s not enough storage space available. Please free up some space and try again.';
      
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  private static generateRecoverySuggestions(error: Error, category: ErrorDetails['category']): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case 'network':
        suggestions.push('Check your internet connection');
        suggestions.push('Try again in a few moments');
        suggestions.push('Refresh the page if the problem continues');
        break;

      case 'validation':
        suggestions.push('Try restoring from a different backup file');
        suggestions.push('Check that the backup file is not corrupted');
        suggestions.push('Create a new backup if possible');
        break;

      case 'permission':
        suggestions.push('Check your user permissions');
        suggestions.push('Try logging out and back in');
        suggestions.push('Contact your administrator');
        break;

      case 'storage':
        suggestions.push('Free up disk space');
        suggestions.push('Delete old backup files');
        suggestions.push('Check available storage quota');
        break;

      default:
        suggestions.push('Refresh the page and try again');
        suggestions.push('Check the browser console for more details');
        suggestions.push('Contact support if the issue persists');
        break;
    }

    return suggestions;
  }

  private static generateErrorCode(error: Error, category: ErrorDetails['category']): string {
    const timestamp = Date.now().toString(36);
    const categoryCode = category.toUpperCase().substring(0, 3);
    return `${categoryCode}_${timestamp}`;
  }

  private static getErrorTitle(errorDetails: ErrorDetails): string {
    switch (errorDetails.category) {
      case 'network':
        return 'Connection Problem';
      case 'validation':
        return 'Invalid Data';
      case 'permission':
        return 'Access Denied';
      case 'storage':
        return 'Storage Issue';
      default:
        return 'Operation Failed';
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ErrorHandlingService;