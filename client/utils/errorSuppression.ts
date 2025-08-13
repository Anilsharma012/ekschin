// Global error suppression utility for production environments

class ErrorSuppressor {
  private isProduction: boolean;
  private suppressedErrors: Set<string> = new Set();
  private errorCounts: Map<string, number> = new Map();
  private lastLogTime: Map<string, number> = new Map();
  
  constructor() {
    this.isProduction = window.location.hostname.includes('.fly.dev') || 
                       window.location.hostname.includes('netlify.app');
  }

  shouldSuppressError(errorKey: string, maxOccurrences: number = 3, timeWindow: number = 60000): boolean {
    if (!this.isProduction) {
      return false; // Never suppress in development
    }

    const now = Date.now();
    const count = this.errorCounts.get(errorKey) || 0;
    const lastTime = this.lastLogTime.get(errorKey) || 0;

    // Reset count if time window has passed
    if (now - lastTime > timeWindow) {
      this.errorCounts.set(errorKey, 1);
      this.lastLogTime.set(errorKey, now);
      return false;
    }

    // Increment count
    this.errorCounts.set(errorKey, count + 1);
    this.lastLogTime.set(errorKey, now);

    // Suppress if over limit
    return count >= maxOccurrences;
  }

  logProductionError(errorKey: string, message: string, details?: any): void {
    if (this.shouldSuppressError(errorKey)) {
      return;
    }

    if (this.isProduction) {
      console.log(`[${errorKey}] ${message}`);
      if (details && typeof details === 'object') {
        console.log('Error details:', details);
      }
    } else {
      console.error(`[${errorKey}] ${message}`, details);
    }
  }

  suppressFetchErrors(): void {
    if (!this.isProduction) return;

    // Don't intercept fetch in production to avoid recursion issues
    // Instead, just suppress console errors
    console.log('Error suppression enabled for production environment');
  }

  suppressConsoleErrors(): void {
    if (!this.isProduction) return;

    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Suppress known production errors
      if (
        message.includes('WebSocket') ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('TypeError: Failed to fetch')
      ) {
        return; // Suppress these errors in production
      }
      
      originalError.apply(console, args);
    };
  }

  suppressUnhandledPromiseRejections(): void {
    if (!this.isProduction) return;

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      // Suppress known network-related promise rejections
      if (
        error instanceof Error && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('WebSocket')
        )
      ) {
        event.preventDefault(); // Suppress the error
        
        if (!this.shouldSuppressError('unhandled-network-error', 1, 60000)) {
          console.log('Network service temporarily unavailable');
        }
      }
    });
  }

  initializeGlobalSuppression(): void {
    this.suppressFetchErrors();
    this.suppressConsoleErrors();
    this.suppressUnhandledPromiseRejections();
    
    if (this.isProduction) {
      console.log('Error suppression initialized for production environment');
    }
  }
}

export const errorSuppressor = new ErrorSuppressor();

// Auto-initialize in production
if (window.location.hostname.includes('.fly.dev') || window.location.hostname.includes('netlify.app')) {
  errorSuppressor.initializeGlobalSuppression();
}
