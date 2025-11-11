// config/seedDefaults.js
import Category from "../models/Category.js";
import Agency from "../models/Agency.js";

export const seedDefaults = async () => {
  try {
    // 🔹 Ensure default Category exists
    const defaultCategory = await Category.findOne({ name: "uncategorised" });
    if (!defaultCategory) {
      await Category.create({
        name: "uncategorised",
        description: "Uncategorized reports",
      });
      console.log("✅ Default category 'uncategorised' created");
    }

    // 🔹 Ensure default Agency exists
    const defaultAgency = await Agency.findOne({ name: "unassigned" });
    if (!defaultAgency) {
      await Agency.create({
        name: "unassigned",
        description: "Unassigned reports",
      });
      console.log("✅ Default agency 'unassigned' created");
    }

    console.log("🌱 Default data verified successfully.");
  } catch (error) {
    console.error("❌ Error seeding default data:", error.message);
  }
};
