import mongoose from "mongoose";
import Department from "./Department";

const DesignationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: [
        "Manager",
        "Team Lead",
        "Developer",
        "Tester",
        "Designer",
        "Other",
      ],
    },
    level: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Department,
      required: true,
    },
    description: {
      type: string,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Designation = mongoose.model("Designation", DesignationSchema);
export default Designation;
export { DesignationSchema };
