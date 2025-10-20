import mongoose from "mongoose";

const agencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // e.g. "Lagos State Environmental Protection Agency"
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        "Please add a valid email",
      ],
    },

    phone: {
      type: String,
    },

    description: {
      type: String,
    },

    // Each agency can have one or more user accounts (role = agency)
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Agency", agencySchema);
