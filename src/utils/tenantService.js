// src/utils/tenantService.js

import mongoose from "mongoose";
import { userSchema } from "../models/User.js";

const connections = {};

export const createTenantDatabase = async (subdomain) => {
  const dbName = `tenant_${subdomain}`;

  if (connections[dbName]) return connections[dbName];

  const conn = mongoose.createConnection(process.env.MONGO_URI, {
    dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  conn.model("User", userSchema);
  // Initialize other tenant-specific models here

  connections[dbName] = conn;
  return conn;
};
