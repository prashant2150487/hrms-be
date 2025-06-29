import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    clockIn: {
      type: Date,
      required: true,
    },
    clockOut: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave", "half-day"],
      default: "present",
    },
    workingHours: {
      type: Number,
      required: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"], 
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);
// Index for faster queries
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export { attendanceSchema };
export default Attendance;
