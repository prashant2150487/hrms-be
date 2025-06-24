// src/models/Organization.js

import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid subdomain"],
    },
    contactEmail: { type: String, required: true },
    phone: String,
    address: mongoose.Schema.Types.Mixed,
    subscription: {
      plan: String,
      status: String,
      startDate: Date,
      endDate: Date,
    },
    isActive: { type: Boolean, default: true },
    tenantConfig: {
      dbName: String,
      customDomain: String,
      branding: {
        primaryColor: { type: String, default: "#4f46e5" },
        secondaryColor: { type: String, default: "#6366f1" },
      },
    },
  },
  { timestamps: true }
);

OrganizationSchema.virtual("url").get(function () {
  return `https://${this.subdomain}.hrmsapp.com`;
});

const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;
