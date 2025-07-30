// src/models/User.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto"; 
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: String,
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "employee", "teamlead"],
      default: "employee",
    },
    
    // Personal Information
    dateOfBirth: Date,
    age: Number,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"]
    },
    marriedStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", "Prefer not to say"]
    },
    
    // Government IDs
    panCard: { type: String },
    aadharCard: { type: String },
    uanNumber: { type: String },
    
    // Employment Details
    startDate: Date,
    department: {
      type: String,
      enum: ["Sales", "Marketing", "HR", "IT", "Finance", "Operations", "Other"],
      default: "Other"
    },
    designation: {
      type: String,
      enum: ["Manager", "Team Lead", "Developer", "Tester", "Designer", "Other"],
      default: "Other"
    },
    location: String,
    companyLocation: String,
    salary: Number,
    reportingManager: String,
    employmentStatus: {
      type: String,
      enum: ["Active", "Inactive", "Terminated", "On Leave", "Probation"],
      default: "Active"
    },
    
    // Banking Information
    accountHolder: String,
    accountNumber: { type: String, select: false }, // Sensitive data, not selected by default
    ifscCode: String,
    branchName: String,
    bankName: String,
    
    // System Fields
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      organization: this.organization,
      email: this.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire (20 minutes)
  this.resetPasswordExpire = Date.now() + 20 * 60 * 1000;

  return resetToken;
};
userSchema.methods.clearResetToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpire = undefined;
};

const User = mongoose.model("User", userSchema);
export { userSchema };
export default User;
