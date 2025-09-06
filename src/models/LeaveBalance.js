import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
   
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    year: {
      type: Number,
      default: new Date().getFullYear(),
    },

    paidLeaves: {
      type: Number,
      default: 0,
    },
    sickLeaves: {
      type: Number,
      default: 0,
    },
    emergencyLeaves: {
      type: Number,
      default: 0,
    },
    maternityLeaves: {
      type: Number,
      default: 0,
    },
    paternityLeaves: {
      type: Number,
      default: 0,
    },

    unpaidLeaves: {
      type: Number,
      default: 0,
    },
    

  },
  {
    timestamps: true,
  }
);
leaveBalanceSchema.index({ organization: 1, year: 1 }, { unique: true });
const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);
export { leaveBalanceSchema };
export default LeaveBalance;


