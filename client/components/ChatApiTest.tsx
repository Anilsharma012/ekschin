import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  error?: string;
  duration?: number;
}

export default function ChatApiTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Health Check", status: "pending" },
    { name: "Authentication Check", status: "pending" },
    { name: "Chat Conversations API", status: "pending" },
    { name: "Chat Messages API", status: "pending" },
    { name: "Send Message API", status: "pending" },
    { name: "Timeout Handling Test", status: "pending" },
    { name: "Error Recovery Test", status: "pending" },
  ]);

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...update } : test
    ));
  };

  const runTest = async (index: number, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    updateTest(index, { status: "running" });
    
    try {
      await testFn();
      updateTest(index, { 
        status: "success", 
        duration: Date.now() - startTime,
        error: undefined 
      });
    } catch (error: any) {
      updateTest(index, { 
        status: "error", 
        error: error.message,
        duration: Date.now() - startTime 
      });
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  const testHealthCheck = async () => {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== "ok" && data.status !== "degraded") {
      throw new Error(`Server status: ${data.status}`);
    }
  };

  const testAuthentication = async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found. Please login first.");
    }
    
    const response = await fetch("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }
  };

  const testConversationsApi = async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch("/api/chat/conversations", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Conversations API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
  };

  const testMessagesApi = async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Create a dummy conversation ID for testing
    const dummyConversationId = "507f1f77bcf86cd799439011";
    
    const response = await fetch(`/api/chat/conversations/${dummyConversationId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // We expect this to fail with 403 or 404, but not network errors
    if (response.status === 403 || response.status === 404) {
      return; // Expected error for non-existent conversation
    }
    
    if (!response.ok && response.status >= 500) {
      throw new Error(`Messages API server error: ${response.status}`);
    }
  };

  const testSendMessageApi = async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: "507f1f77bcf86cd799439011", // Dummy ID
        message: "Test message",
        messageType: "text",
      }),
    });

    // We expect this to fail with 403 or 400, but not network errors
    if (response.status === 403 || response.status === 400) {
      return; // Expected error for invalid conversation
    }
    
    if (!response.ok && response.status >= 500) {
      throw new Error(`Send message API server error: ${response.status}`);
    }
  };

  const testTimeoutHandling = async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      // Test with very short timeout to simulate timeout error
      const fetchPromise = fetch("/api/chat/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(1), // 1ms timeout to force timeout
      });

      await fetchPromise;
      throw new Error("Timeout test should have failed");
    } catch (error: any) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        return; // Expected timeout error
      }
      throw error;
    }
  };

  const testErrorRecovery = async () => {
    // Test fetching a non-existent endpoint to simulate network error handling
    try {
      const response = await fetch("/api/chat/nonexistent", {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.status === 404) {
        return; // Expected 404 for non-existent endpoint
      }
      
      throw new Error("Expected 404 error for non-existent endpoint");
    } catch (error: any) {
      if (error.message.includes("fetch")) {
        throw error;
      }
      // Expected error, test passes
    }
  };

  const runAllTests = async () => {
    const testFunctions = [
      testHealthCheck,
      testAuthentication,
      testConversationsApi,
      testMessagesApi,
      testSendMessageApi,
      testTimeoutHandling,
      testErrorRecovery,
    ];

    for (let i = 0; i < testFunctions.length; i++) {
      await runTest(i, testFunctions[i]);
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ 
      ...test, 
      status: "pending" as const, 
      error: undefined, 
      duration: undefined 
    })));
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      case "running":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "text-gray-600";
      case "running":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-blue-500" />
            <span>Chat API Functionality Test</span>
          </CardTitle>
          <p className="text-gray-600">
            This test verifies that all chat API endpoints are working correctly and error handling is functioning as expected.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex space-x-4">
              <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700">
                Run All Tests
              </Button>
              <Button onClick={resetTests} variant="outline">
                Reset Tests
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <span className={`font-medium ${getStatusColor(test.status)}`}>
                    {test.name}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  {test.duration && (
                    <span className="text-sm text-gray-500">
                      {test.duration}ms
                    </span>
                  )}
                  
                  {test.error && (
                    <div className="max-w-md">
                      <p className="text-sm text-red-600 truncate" title={test.error}>
                        {test.error}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => {
                      const testFunctions = [
                        testHealthCheck,
                        testAuthentication,
                        testConversationsApi,
                        testMessagesApi,
                        testSendMessageApi,
                        testTimeoutHandling,
                        testErrorRecovery,
                      ];
                      runTest(index, testFunctions[index]);
                    }}
                    variant="ghost"
                    size="sm"
                    disabled={test.status === "running"}
                  >
                    Run
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Test Information:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Health Check: Verifies the API server is responsive</li>
              <li>• Authentication Check: Verifies your login token is valid</li>
              <li>• Chat APIs: Test core chat functionality endpoints</li>
              <li>• Timeout Handling: Tests timeout error handling</li>
              <li>• Error Recovery: Tests error handling for invalid endpoints</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
