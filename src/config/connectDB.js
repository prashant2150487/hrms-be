import mongoose from "mongoose";
import User from "../models/User.js";
import generatePassword from "../utils/generatePassword.js";

const connectDB = async () => {
  try {
    // In Mongoose ≥ 6, useNewUrlParser & useUnifiedTopology are on by default,
    // so you can connect with zero options unless you have something special.
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected…");

    await createInitialSuperAdmin();
  } catch (err) {
    console.error(`Database connection error: ${err.message}`);
    process.exit(1);
  }
};

const createInitialSuperAdmin = async () => {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  // Bail if env var is missing
  if (!superAdminEmail) {
    console.warn(
      "SUPER_ADMIN_EMAIL not set—skipping initial super‑admin creation."
    );
    return;
  }

  // Only create one if none exists
  const existing = await User.findOne({ email: superAdminEmail });
  if (existing) return;

  const newPassword = "Psachan04@";

  const superAdmin = new User({
    email: superAdminEmail,
    password: newPassword,
    role: "superadmin",
    isActive: true,
    firstName: "Prashant",
    lastName: "Sachan",
    phoneNumber: "1234567890",
  });

  await superAdmin.save();
  console.log(`Initial super‑admin created (${superAdminEmail})`);
};
export default connectDB;
