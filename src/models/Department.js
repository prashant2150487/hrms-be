import mongoose from "mongoose";
import Organization from "./Organization";

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: [
        "Sales",
        "Marketing",
        "HR",
        "IT",
        "Finance",
        "Operations",
        "Other",
      ],
      description: String,
      isActive: {
        type: Boolean,
        default: true,
      },
      Organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
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
  },
  {
    timestamps: true,
  }
);
DepartmentSchema.index({ organization: 1, name: 1 }, { unique: true });
const Department = mongoose.model("Department", DepartmentSchema);
export { DepartmentSchema };

export default Department;
