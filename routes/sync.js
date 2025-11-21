import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Family from "../models/Family.js";
import Order from "../models/Order.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Measurement from "../models/Measurement.js";
import Template from "../models/Template.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const models = { User, Customer, Family, Order, Invoice, Payment, Measurement, Template };

// 🧹 Utility: Clean invalid ObjectId references
function sanitizeObjectIds(obj) {
  const result = { ...obj };
  for (const key in result) {
    const val = result[key];
    if ((key.endsWith("Id") || key.endsWith("_id")) && (!val || !mongoose.Types.ObjectId.isValid(val))) {
      delete result[key];
    }
  }
  return result;
}

// 🔹 Route: Sync all local data to MongoDB
router.post("/syncAllToMongo", authMiddleware, async (req, res) => {
  const data = req.body;

  if (!data || typeof data !== "object") {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    for (const storeName in data) {
      const items = data[storeName];
      if (!Array.isArray(items)) continue;

      // 👇👇👇 YAHAN FIX HAI 👇👇👇
      let modelName;
      
      // Special check for irregular plurals
      if (storeName === "families") {
        modelName = "Family";
      } else {
        // Baaki sab ke liye 's' hata do (customers -> Customer)
        modelName = storeName.charAt(0).toUpperCase() + storeName.slice(1, -1);
      }

      const Model = models[modelName];
      
      if (!Model) {
        console.log(`⚠️ Model not found for store: ${storeName} (Tried: ${modelName})`);
        continue;
      }
      // 👆👆👆 YAHAN FIX KHATAM 👆👆👆

      for (const item of items) {
        const { _id, ...rest } = item;
        const cleanData = sanitizeObjectIds(rest);

        if (modelName === "User" && cleanData.password) {
          const salt = await bcrypt.genSalt(10);
          cleanData.password = await bcrypt.hash(cleanData.password, salt);
        }

        if (modelName !== "User") cleanData.userId = req.user._id;

        let filter = {};
        if (_id && mongoose.Types.ObjectId.isValid(_id)) {
          filter = { _id };
        } else if (item.localId) {
          filter = { localId: item.localId };
          cleanData.localId = item.localId;
        } else if (modelName === "User" && item.email) {
          filter = { email: item.email };
        } else {
          filter = { _id: new mongoose.Types.ObjectId() };
        }

        try {
          await Model.updateOne(filter, { $set: cleanData }, { upsert: true, session });
        } catch (err) {
          console.warn(`⚠️ Error saving ${modelName}:`, err.message);
        }
      }
    }

    await session.commitTransaction();
    committed = true;
    res.status(200).json({ message: "✅ Sync successful" });
  } catch (error) {
    if (!committed) await session.abortTransaction();
    console.error("❌ Sync failed:", error);
    res.status(500).json({ message: "Sync failed", error: error.message });
  } finally {
    session.endSession();
  }
});

router.get("/loadAllFromMongo", authMiddleware, async (req, res) => {
  try {
    const result = {};
    for (const modelName in models) {
      const Model = models[modelName];
      
      // Correct plural mapping
      let storeName;
      if (modelName === "Family") storeName = "families";
      else storeName = modelName.toLowerCase() + "s";

      const query = modelName === "User" ? { _id: req.user._id } : { userId: req.user._id };
      const documents = await Model.find(query).lean();
      result[storeName] = documents;
    }
    
    res.status(200).json({ message: "✅ User-specific data loaded successfully", data: result });
  } catch (error) {
    console.error("❌ Load failed:", error);
    res.status(500).json({ message: "Failed to load data", error: error.message });
  }
});


export default router;
