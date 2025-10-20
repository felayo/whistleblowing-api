import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const reportSchema = new mongoose.Schema(
  {
    caseID: {
      type: String,
      unique: true, // e.g. "LAG-YYYY-00001"
    },

    reporterType: {
      type: String,
      enum: ["anonymous", "confidential"],
      required: true,
    },

    // For confidential reporters
    reporterName: { type: String },
    reporterEmail: { type: String },
    reporterPhone: { type: String },

    title: { type: String, required: true },
    description: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "under review", "resolved", "closed"],
      default: "pending",
    },

    agencyAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
    },

    location: { type: String },
    password: { type: String, unique: true, select: false }, // system-generated password for follow-up access
    passwordKey: {
      type: String,
      unique: true,
      index: true, // for faster lookup
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    isResolved: { type: Boolean, default: false },

    // Internal notes by admin/agency
    internalNotes: { type: String },

    // Evidence files
    evidenceFiles: [
      {
        filePath: { type: String, required: true }, // e.g. S3 URL
        fileType: { type: String }, // e.g. image/png, video/mp4, etc.
        fileName: { type: String }, // original filename
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Comments or follow-up notes
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who made the comment
        role: { type: String }, // reporter, admin, agency
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Status change history / audit trail
    history: [
      {
        status: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate caseID before saving
reportSchema.pre("save", async function (next) {
  if (this.caseID) return next(); // already set

  const currentYear = new Date().getFullYear();

  const count = await mongoose.models.Report.countDocuments({
    caseID: { $regex: `^LAG-${currentYear}` },
  });

  const nextNumber = (count + 1).toString().padStart(5, "0");

  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 random digits

  this.caseID = `LAG-${currentYear}-${nextNumber}-${randomSuffix}`;

  next();
});

// 🔹 Auto-generate and hash unique password
// Hashing the plain password with a non-reversible hash (SHA256) — purely for lookup
reportSchema.pre("save", async function (next) {
  // only run when creating a new report
  if (!this.isNew) return next();

  const plainPassword = crypto.randomBytes(3).toString("hex").toUpperCase();
  this._plainPassword = plainPassword;

  this.passwordKey = crypto
    .createHash("sha256")
    .update(plainPassword)
    .digest("hex");

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(plainPassword, salt);

  next();
});

/* this was the initial method of generating passwords
reportSchema.pre("save", async function (next) {
  // Skip if password already exists
  if (this.password) return next();

  let isUnique = false;
  let plainPassword = "";

  while (!isUnique) {
    plainPassword = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A9F4C2"
    const existing = await mongoose.models.Report.findOne({ plainPassword }); // check uniqueness
    if (!existing) isUnique = true;
  }

  this._plainPassword = plainPassword; // temporarily store raw password (for response only)

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(plainPassword, salt);

  next();
});
*/
// 🔹 Compare password method
reportSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//  Removes private fields like password, passwordKey, and __v.
//  Return plain password once (for response only)
reportSchema.methods.getPublicData = function () {
  const obj = this.toObject();

  // Remove sensitive data
  delete obj.password;
  delete obj.passwordKey;
  delete obj.__v;

  // Include the generated password only once
  if (this._plainPassword) {
    obj.generatedPassword = this._plainPassword;
  }

  return obj;
};

// when status changes, push a new record into history
reportSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.history.push({
      status: this.status,
      updatedAt: new Date(),
    });
  }
  next();
});

// Auto-remove sensitive fields in API responses
reportSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.passwordKey;
    delete ret.__v;
    if (ret.reporterType === "anonymous") {
      delete ret.reporterName;
      delete ret.reporterEmail;
      delete ret.reporterPhone;
    }
    return ret;
  },
});

// Indexes for performance
// reportSchema.index({ caseID: 1 });
reportSchema.index({ status: 1 });

export default mongoose.model("Report", reportSchema);
