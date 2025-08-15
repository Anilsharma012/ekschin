import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse } from "@shared/types";

// POST /conversations/find-or-create - Find existing or create new conversation
export const findOrCreateConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: "propertyId is required"
      });
    }

    if (!ObjectId.isValid(propertyId as string)) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID"
      });
    }

    // Get property to find owner
    const property = await db.collection("properties").findOne({
      _id: new ObjectId(propertyId as string)
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    const ownerId = property.ownerId || property.sellerId;
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: "Property has no owner"
      });
    }

    if (ownerId === userId) {
      return res.status(400).json({
        success: false,
        error: "Cannot create conversation with yourself"
      });
    }

    // Check if conversation already exists
    const existingConversation = await db.collection("conversations").findOne({
      propertyId: propertyId as string,
      participants: { $all: [userId, ownerId] }
    });

    if (existingConversation) {
      return res.json({
        success: true,
        data: {
          _id: existingConversation._id,
          propertyId: existingConversation.propertyId,
          participants: existingConversation.participants,
          createdAt: existingConversation.createdAt,
          lastMessageAt: existingConversation.lastMessageAt
        }
      });
    }

    // Create new conversation
    const newConversation = {
      propertyId: propertyId as string,
      participants: [userId, ownerId],
      createdAt: new Date(),
      lastMessageAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("conversations").insertOne(newConversation);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        _id: result.insertedId,
        ...newConversation
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error finding/creating conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find or create conversation"
    });
  }
};

// POST /conversations - Create new conversation
export const createConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { propertyId, participants } = req.body;

    if (!propertyId || !participants || !Array.isArray(participants)) {
      return res.status(400).json({
        success: false,
        error: "propertyId and participants array are required"
      });
    }

    // Ensure userId is in participants
    const allParticipants = [...new Set([userId, ...participants])];

    // Validate property exists
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid property ID"
      });
    }

    const property = await db.collection("properties").findOne({
      _id: new ObjectId(propertyId)
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    // Check if conversation already exists for this property and participants
    const existingConversation = await db.collection("conversations").findOne({
      propertyId: propertyId,
      participants: { $all: allParticipants }
    });

    if (existingConversation) {
      return res.json({
        success: true,
        data: {
          _id: existingConversation._id,
          propertyId: existingConversation.propertyId,
          participants: existingConversation.participants,
          createdAt: existingConversation.createdAt,
          lastMessageAt: existingConversation.lastMessageAt
        }
      });
    }

    // Create new conversation
    const newConversation = {
      propertyId,
      participants: allParticipants,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("conversations").insertOne(newConversation);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        _id: result.insertedId,
        ...newConversation
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create conversation"
    });
  }
};

// GET /conversations/my - Get user's conversations
export const getMyConversations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    const conversations = await db
      .collection("conversations")
      .aggregate([
        {
          $match: {
            participants: userId
          }
        },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participantDetails"
          }
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "conversationId",
            as: "messages"
          }
        },
        {
          $addFields: {
            lastMessage: {
              $arrayElemAt: [
                {
                  $sortArray: {
                    input: "$messages",
                    sortBy: { createdAt: -1 }
                  }
                },
                0
              ]
            },
            unreadCount: {
              $size: {
                $filter: {
                  input: "$messages",
                  cond: {
                    $and: [
                      { $ne: ["$$this.senderId", userId] },
                      {
                        $not: {
                          $in: [
                            userId,
                            {
                              $map: {
                                input: "$$this.readBy",
                                as: "reader",
                                in: "$$reader.userId"
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            propertyId: 1,
            participants: 1,
            createdAt: 1,
            lastMessageAt: 1,
            property: { $arrayElemAt: ["$property", 0] },
            participantDetails: 1,
            lastMessage: 1,
            unreadCount: 1
          }
        },
        {
          $sort: { lastMessageAt: -1 }
        }
      ])
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: conversations
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch conversations"
    });
  }
};

// GET /conversations/:id/messages - Get messages for a conversation
export const getConversationMessages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { id } = req.params;
    const { page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID"
      });
    }

    // Check if user is participant in conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(id),
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    const messages = await db
      .collection("messages")
      .find({ conversationId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Mark messages as read
    await db.collection("messages").updateMany(
      {
        conversationId: id,
        senderId: { $ne: userId },
        "readBy.userId": { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId: userId,
            readAt: new Date()
          }
        }
      }
    );

    const response: ApiResponse<any[]> = {
      success: true,
      data: messages.reverse() // Return in chronological order
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages"
    });
  }
};

// POST /conversations/:id/messages - Send message to conversation
export const sendMessageToConversation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { id } = req.params;
    const { text, imageUrl } = req.body;

    if (!text && !imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Either text or imageUrl is required"
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid conversation ID"
      });
    }

    // Check if user is participant in conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(id),
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    // Get user details
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Create message
    const newMessage = {
      conversationId: id,
      senderId: userId,
      senderName: user.name,
      senderType: user.userType || "buyer",
      message: text || "",
      imageUrl: imageUrl || null,
      messageType: imageUrl ? "image" : "text",
      readBy: [
        {
          userId: userId,
          readAt: new Date()
        }
      ],
      createdAt: new Date()
    };

    const messageResult = await db.collection("messages").insertOne(newMessage);

    // Update conversation last message timestamp
    await db.collection("conversations").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        _id: messageResult.insertedId,
        ...newMessage
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message"
    });
  }
};
