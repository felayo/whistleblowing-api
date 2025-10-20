// config/seedDefaults.js
import Category from "../models/Category.js";
import Agency from "../models/Agency.js";

export const seedDefaults = async () => {
  try {
    // 🔹 Ensure default Category exists
    const defaultCategory = await Category.findOne({ name: "Other" });
    if (!defaultCategory) {
      await Category.create({
        name: "Other",
        description: "Uncategorized reports",
      });
      console.log("✅ Default category 'Other' created");
    }

    // 🔹 Ensure default Agency exists
    const defaultAgency = await Agency.findOne({ name: "No Agency Assigned" });
    if (!defaultAgency) {
      await Agency.create({
        name: "No Agency Assigned",
        description: "Unassigned reports",
      });
      console.log("✅ Default agency 'No Agency Assigned' created");
    }

    console.log("🌱 Default data verified successfully.");
  } catch (error) {
    console.error("❌ Error seeding default data:", error.message);
  }
};
