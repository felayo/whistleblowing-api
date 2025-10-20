import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import app from "./app.js";
import { seedDefaults } from "./config/seedDefaults.js";

const PORT = process.env.PORT || 5000;

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected ✅");
    // Seed default Category & Agency
    await seedDefaults();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed ❌", err);
    process.exit(1);
  });
