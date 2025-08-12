import { useState } from "react";
import { X, Send, MessageCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyPrice: string;
  propertyImage: string;
  sellerId: string;
  sellerName: string;
  propertyId: number;
}

export default function ChatModal({
  isOpen,
  onClose,
  propertyTitle,
  propertyPrice,
  propertyImage,
  sellerId,
  sellerName,
  propertyId,
}: ChatModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const quickMessages = [
    "Hi! Is this property still available?",
    "I'm interested in this property. Can we schedule a visit?",
    "What's your best price for this property?",
    "Can you share more photos and details?",
    "Is the price negotiable?",
    "When can I visit this property?",
  ];

  const handleSendMessage = async (messageText: string) => {
    try {
      setSending(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to send messages");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      console.log("🚀 Sending message to property owner:", {
        propertyId,
        message: messageText,
        sellerName
      });

      const response = await fetch("/api/chat/start-property-conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: propertyId.toString(),
          message: messageText,
        }),
      });

      const data = await response.json();
      console.log("📨 Chat response:", data);

      if (response.ok && data.success) {
        setSuccess(true);
        console.log("✅ Message sent successfully, redirecting to chat...");

        // Show success message briefly then redirect
        setTimeout(() => {
          window.location.href = `/chat?conversation=${data.data.conversationId}`;
        }, 1500);
      } else {
        setError(data.error || "Failed to send message. Please try again.");
      }
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCustomMessage = () => {
    if (message.trim()) {
      handleSendMessage(message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:w-96 md:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#C70000] text-white">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">Chat with {sellerName}</h3>
          </div>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Property Card */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-3">
            <img
              src={propertyImage}
              alt={propertyTitle}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">
                {propertyTitle}
              </h4>
              <p className="text-lg font-bold text-[#C70000]">
                {propertyPrice}
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-green-700 font-medium">Message sent successfully!</p>
            </div>
            <p className="text-green-600 text-sm mt-1">Redirecting to chat...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 font-medium">Error</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Quick Messages */}
        {!success && (
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Quick messages:
            </h4>
            <div className="space-y-2">
              {quickMessages.map((quickMsg, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(quickMsg)}
                  disabled={sending || success}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Message */}
        {!success && (
          <div className="p-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Or write your own message:
            </h4>
            <div className="space-y-3">
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={sending || success}
              />
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCustomMessage}
                  disabled={!message.trim() || sending || success}
                  className="flex-1 bg-[#C70000] hover:bg-[#A60000] text-white"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success state - show close button */}
        {success && (
          <div className="p-4 border-t">
            <Button
              onClick={onClose}
              className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
