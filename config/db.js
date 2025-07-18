

import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

export const connectDb = async () => {
  const mongoUri = process.env.MONGO_URL;

  if (!mongoUri) {
    console.error("❌ MONGO_URL is not set. Add it in Render Environment Variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      //useNewUrlParser: true,
      //useUnifiedTopology: true,
      
    });
    console.log("✅ MongoDB connected successfully");
    
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};