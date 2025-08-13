import { RequestHandler } from "express";
import path from "path";
import fs from "fs";
import { ApiResponse } from "@shared/types";

// Get app information
export const getAppInfo: RequestHandler = async (req, res) => {
  try {
    // Check if APK file exists
    const apkPath = path.join(process.cwd(), "public", "app", "AashishProperty.apk");
    const exists = fs.existsSync(apkPath);
    
    let fileInfo = null;
    if (exists) {
      const stats = fs.statSync(apkPath);
      fileInfo = {
        size: stats.size,
        lastModified: stats.mtime,
        version: "1.0.0", // You can read this from package.json or config
      };
    }

    const response: ApiResponse<{
      available: boolean;
      version?: string;
      size?: number;
      lastModified?: Date;
      downloadUrl?: string;
    }> = {
      success: true,
      data: {
        available: exists,
        ...(fileInfo && {
          version: fileInfo.version,
          size: fileInfo.size,
          lastModified: fileInfo.lastModified,
          downloadUrl: "/api/app/download",
        }),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting app info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get app info",
    });
  }
};

// Download APK file
export const downloadAPK: RequestHandler = async (req, res) => {
  try {
    const apkPath = path.join(process.cwd(), "public", "app", "AashishProperty.apk");
    
    // Check if file exists
    if (!fs.existsSync(apkPath)) {
      return res.status(404).json({
        success: false,
        error: "APK file not found",
      });
    }

    // Get file stats for headers
    const stats = fs.statSync(apkPath);

    // Set headers for Android APK download
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Disposition", "attachment; filename=AashishProperty.apk");
    res.setHeader("Content-Length", stats.size.toString());
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Headers to help with Android download manager
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Set proper MIME type for Android recognition
    res.setHeader("Content-Transfer-Encoding", "binary");

    // Stream the file
    const fileStream = fs.createReadStream(apkPath);
    fileStream.pipe(res);

    // Log download
    console.log("APK download initiated:", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date(),
    });

    // Handle stream errors
    fileStream.on("error", (error) => {
      console.error("Error streaming APK file:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Failed to download APK",
        });
      }
    });

  } catch (error) {
    console.error("Error downloading APK:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download APK",
    });
  }
};

// Upload new APK (admin only)
export const uploadAPK: RequestHandler = async (req, res) => {
  try {
    // This would handle file upload using multer
    // For now, we'll just return a success message
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "APK upload functionality to be implemented with multer" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error uploading APK:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload APK",
    });
  }
};

// Get download statistics (admin only)
export const getDownloadStats: RequestHandler = async (req, res) => {
  try {
    // This would fetch download statistics from database
    // For now, return mock data
    const response: ApiResponse<{
      totalDownloads: number;
      todayDownloads: number;
      weeklyDownloads: number;
      monthlyDownloads: number;
    }> = {
      success: true,
      data: {
        totalDownloads: 1547,
        todayDownloads: 23,
        weeklyDownloads: 145,
        monthlyDownloads: 632,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting download stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get download stats",
    });
  }
};
