import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true, // e.g. "REPORT_CREATED", "STATUS_UPDATED", "USER_LOGIN"
    },
    description: {
      type: String, // optional free-text explanation
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },
    targetAgency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
    },
    ipAddress: {
      type: String, // useful for tracing access
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 }); // optimize queries

export default mongoose.model("AuditLog", auditLogSchema);
