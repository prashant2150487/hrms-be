import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["paid", "sick", "unpaid", "emergency", "maternity", "paternity"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    notifyTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: {
      type: String,
    },
    dayCount: {
      type: Number,
      default: 0,
    },
    workingDays: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

leaveSchema.index({ user: 1, startDate: 1 });

const Leave = mongoose.model("Leave", leaveSchema);
export { leaveSchema };
export default Leave;
