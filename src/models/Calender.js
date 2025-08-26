const holidaysCalenderSchema = new mongoose.Schema(
  {
    title: {
      typeof: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      typeof: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const HolidaysCalender = mongoose.model("Calender", holidaysCalenderSchema);
export { holidaysCalenderSchema };
export default HolidaysCalender;
