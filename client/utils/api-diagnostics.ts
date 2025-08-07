// API Diagnostics and Health Check Utilities

export interface DiagnosticResult {
  endpoint: string;
  status: "success" | "failure" | "timeout";
  statusCode?: number;
  responseTime: number;
  error?: string;
  data?: any;
}

export interface EnvironmentInfo {
  environment: string;
  hostname: string;
  port: string;
  protocol: string;
  userAgent: string;
  isOnline: boolean;
  timestamp: string;
}

export const getEnvironmentInfo = (): EnvironmentInfo => {
  if (typeof window === "undefined") {
    return {
      environment: "server",
      hostname: "unknown",
      port: "unknown",
      protocol: "unknown",
      userAgent: "server",
      isOnline: false,
      timestamp: new Date().toISOString(),
    };
  }

  const { protocol, hostname, port } = window.location;

  let environment = "unknown";
  if (hostname === "localhost" || hostname === "127.0.0.1" || port === "8080") {
    environment = "development";
  } else if (hostname.includes(".fly.dev")) {
    environment = "fly";
  } else if (hostname.includes(".netlify.app")) {
    environment = "netlify";
  } else {
    environment = "production";
  }

  return {
    environment,
    hostname,
    port,
    protocol,
    userAgent: navigator.userAgent.substring(0, 100),
    isOnline: navigator.onLine,
    timestamp: new Date().toISOString(),
  };
};

export const testApiEndpoint = async (
  endpoint: string,
  timeout = 8000,
): Promise<DiagnosticResult> => {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    return {
      endpoint,
      status: response.ok ? "success" : "failure",
      statusCode: response.status,
      responseTime,
      data,
      error: response.ok
        ? undefined
        : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    if (error.name === "AbortError") {
      return {
        endpoint,
        status: "timeout",
        responseTime,
        error: `Request timeout after ${timeout}ms`,
      };
    }

    return {
      endpoint,
      status: "failure",
      responseTime,
      error: error.message || "Unknown error",
    };
  }
};

export const runApiDiagnostics = async (): Promise<{
  environment: EnvironmentInfo;
  tests: DiagnosticResult[];
  recommendations: string[];
}> => {
  const environment = getEnvironmentInfo();
  const tests: DiagnosticResult[] = [];
  const recommendations: string[] = [];

  // Generate potential API endpoints to test
  const baseEndpoints = [
    "/api/ping",
    "/api/demo",
    "/.netlify/functions/api/ping",
  ];

  // Add environment-specific endpoints
  if (environment.environment === "fly") {
    baseEndpoints.push(
      `${environment.protocol}//${environment.hostname}/api/ping`,
    );
  }

  // Test each endpoint
  for (const endpoint of baseEndpoints) {
    const result = await testApiEndpoint(endpoint);
    tests.push(result);
  }

  // Generate recommendations based on results
  const successfulTests = tests.filter((t) => t.status === "success");
  const failedTests = tests.filter((t) => t.status === "failure");
  const timeoutTests = tests.filter((t) => t.status === "timeout");

  if (successfulTests.length === 0) {
    if (timeoutTests.length > 0) {
      recommendations.push(
        "All API endpoints are timing out. The server may be starting up or overloaded.",
      );
    } else if (failedTests.length > 0) {
      recommendations.push(
        "API endpoints are reachable but returning errors. Check server logs.",
      );
    } else {
      recommendations.push(
        "Unable to reach any API endpoints. Check network connectivity.",
      );
    }
  } else {
    recommendations.push(
      `Found ${successfulTests.length} working API endpoint(s).`,
    );
  }

  if (environment.environment === "fly" && !environment.isOnline) {
    recommendations.push(
      "Device appears to be offline. Check internet connection.",
    );
  }

  if (
    environment.environment === "development" &&
    successfulTests.length === 0
  ) {
    recommendations.push(
      "Development server may not be running. Try 'npm run dev'.",
    );
  }

  return {
    environment,
    tests,
    recommendations,
  };
};
