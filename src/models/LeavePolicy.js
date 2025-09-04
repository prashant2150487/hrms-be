import mongoose from "mongoose";

const LeavePolicySchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    unique: true
  },
  paidLeaves: {
    type: Number,
    default: 12,
    min: 0
  },
  sickLeaves: {
    type: Number,
    default: 8,
    min: 0
  },
  emergencyLeaves: {
    type: Number,
    default: 4,
    min: 0
  },
  year: {
    type: Number,
    default: new Date().getFullYear()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

LeavePolicySchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

const LeavePolicy = mongoose.model("LeavePolicy", LeavePolicySchema);
export default LeavePolicy;
export { LeavePolicySchema };