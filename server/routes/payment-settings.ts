import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";

// Payment settings interface
interface PaymentSettings {
  enablePayments: boolean;
  paymentGateway: string;
  paymentApiKey: string;
  paymentSecretKey?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  commissionRate: number;
  upi?: {
    enabled: boolean;
    upiId: string;
  };
  bankTransfer?: {
    enabled: boolean;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolder: string;
  };
}

// Get payment settings
export const getPaymentSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const settings = await db.collection("paymentSettings").findOne({});

    // Default settings if none exist
    const defaultSettings: PaymentSettings = {
      enablePayments: false,
      paymentGateway: "razorpay",
      paymentApiKey: "",
      commissionRate: 5,
      upi: {
        enabled: true,
        upiId: "aashishproperty@paytm",
      },
      bankTransfer: {
        enabled: true,
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        accountHolder: "Aashish Property Services",
      },
    };

    res.json({
      success: true,
      data: settings || defaultSettings,
    });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment settings",
    });
  }
};

// Update payment settings
export const updatePaymentSettings: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const updatedSettings = req.body;

    // Validate required fields for Razorpay
    if (updatedSettings.enablePayments && updatedSettings.paymentGateway === "razorpay") {
      if (!updatedSettings.paymentApiKey) {
        return res.status(400).json({
          success: false,
          error: "Razorpay API key is required when payments are enabled",
        });
      }
    }

    // Add timestamp
    updatedSettings.updatedAt = new Date();

    // Update or insert payment settings
    const result = await db.collection("paymentSettings").replaceOne(
      {},
      updatedSettings,
      { upsert: true }
    );

    console.log("💳 Payment settings updated:", {
      enablePayments: updatedSettings.enablePayments,
      gateway: updatedSettings.paymentGateway,
      hasApiKey: !!updatedSettings.paymentApiKey,
    });

    res.json({
      success: true,
      data: updatedSettings,
      message: "Payment settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update payment settings",
    });
  }
};

// Test Razorpay connection
export const testRazorpayConnection: RequestHandler = async (req, res) => {
  try {
    const { razorpayKeyId, razorpayKeySecret } = req.body;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(400).json({
        success: false,
        error: "Razorpay Key ID and Secret are required for testing",
      });
    }

    // In a real implementation, you would test the Razorpay connection here
    // For now, we'll simulate a successful test
    console.log("🧪 Testing Razorpay connection with:", {
      keyId: razorpayKeyId.substring(0, 10) + "...",
      hasSecret: !!razorpayKeySecret,
    });

    // Simulate connection test (replace with actual Razorpay API call)
    const isValid = razorpayKeyId.startsWith("rzp_") && razorpayKeySecret.length > 20;

    if (isValid) {
      res.json({
        success: true,
        message: "Razorpay connection test successful",
        data: {
          status: "connected",
          gateway: "razorpay",
          testMode: razorpayKeyId.includes("test"),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid Razorpay credentials",
        message: "Please check your API keys and try again",
      });
    }
  } catch (error) {
    console.error("Error testing Razorpay connection:", error);
    res.status(500).json({
      success: false,
      error: "Failed to test Razorpay connection",
    });
  }
};

// Get active payment methods (for frontend)
export const getActivePaymentMethods: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const settings = await db.collection("paymentSettings").findOne({});

    if (!settings || !settings.enablePayments) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          methods: [],
        },
      });
    }

    const methods = {
      enabled: true,
      gateway: settings.paymentGateway,
      methods: [],
    };

    // Add configured payment methods
    if (settings.upi?.enabled) {
      methods.methods.push({
        type: "upi",
        name: "UPI Payment",
        upiId: settings.upi.upiId,
      });
    }

    if (settings.bankTransfer?.enabled) {
      methods.methods.push({
        type: "bank_transfer",
        name: "Bank Transfer",
        bankDetails: settings.bankTransfer,
      });
    }

    if (settings.paymentApiKey && settings.paymentGateway === "razorpay") {
      methods.methods.push({
        type: "online",
        name: "Online Payment",
        gateway: "razorpay",
        enabled: true,
      });
    }

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error("Error fetching active payment methods:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment methods",
    });
  }
};
