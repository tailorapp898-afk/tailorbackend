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

      // -------------------------------------------------
      // 1. Model Name ka pata lagana
      // -------------------------------------------------
      let modelName;
      if (storeName === "families") {
        modelName = "Family";
      } else {
        // "customers" -> "Customer"
        modelName = storeName.charAt(0).toUpperCase() + storeName.slice(1, -1);
      }

      const Model = models[modelName];
      
      if (!Model) {
        console.log(`⚠️ Model not found for store: ${storeName}`);
        continue;
      }

      // -------------------------------------------------
      // 🔥 STEP 2: DELETE LOGIC (Jo list me nahi hai, wo delete karo)
      // -------------------------------------------------
      
      // Hum 'User' table ko kabhi auto-delete nahi karenge (Safety)
      if (modelName !== "User") {
          
          // Frontend se aaye huye saare VALID _ids ki list nikalo
          const receivedIds = items
            .map(item => item._id)
            .filter(id => id && mongoose.Types.ObjectId.isValid(id));

          // Database Query:
          // "Is User ke wo saare records delete kardo jo 'receivedIds' list mein NAHI hain"
          await Model.deleteMany({ 
              userId: req.user._id, 
              _id: { $nin: receivedIds } // $nin = Not In
          }).session(session);
      }

      // -------------------------------------------------
      // 3. UPDATE / INSERT LOGIC (Jo list me hai, use save karo)
      // -------------------------------------------------
      for (const item of items) {
        const { _id, ...rest } = item;
        const cleanData = sanitizeObjectIds(rest);

        // Password handling (Sirf User model ke liye)
        if (modelName === "User" && cleanData.password) {
           if(cleanData.password.length < 20) { 
               const salt = await bcrypt.genSalt(10);
               cleanData.password = await bcrypt.hash(cleanData.password, salt);
           }
        }

        // Har item ke sath UserId zaroor lagana (Siwaye User table ke)
        if (modelName !== "User") cleanData.userId = req.user._id;

        // Filter banana (kaunsa item update karna hai?)
        let filter = {};
        if (_id && mongoose.Types.ObjectId.isValid(_id)) {
          filter = { _id };
        } else if (item.localId) {
          filter = { localId: item.localId };
          // localId ko save bhi kar lo taaki future me match ho sake
          cleanData.localId = item.localId;
        } else if (modelName === "User" && item.email) {
          filter = { email: item.email };
        } else {
          // Agar kuch match nahi hua to naya ID bana do
          filter = { _id: new mongoose.Types.ObjectId() };
        }

        try {
          // Update karo, agar nahi hai to Naya bana do (upsert: true)
          await Model.updateOne(filter, { $set: cleanData }, { upsert: true, session });
        } catch (err) {
          console.warn(`⚠️ Error saving ${modelName} item:`, err.message);
        }
      }
    }

    await session.commitTransaction();
    committed = true;
    res.status(200).json({ message: "✅ Sync Successful (Updated & Deleted)" });

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
