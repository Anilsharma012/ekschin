// Simple production error handler that doesn't interfere with existing systems

const isProduction = () => {
  return window.location.hostname.includes('.fly.dev') || 
         window.location.hostname.includes('netlify.app');
};

// Simple error handler that just reduces noise
if (isProduction()) {
  // Only handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Suppress known network-related errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('websocket') ||
        message.includes('connection refused') ||
        message.includes('aborted')
      ) {
        event.preventDefault(); // Suppress the error
        // Log once per session only
        if (!sessionStorage.getItem('network-error-logged')) {
          console.log('Network service temporarily unavailable');
          sessionStorage.setItem('network-error-logged', 'true');
        }
        return;
      }
    }
  });

  // Log that we're in production mode
  console.log('🚀 Production mode: Network error suppression active');
}

export {};
