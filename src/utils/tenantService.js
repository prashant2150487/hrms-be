// src/utils/tenantService.js

import mongoose from "mongoose";
import { userSchema } from "../models/User.js";
import { attendanceSchema } from "../models/Attendance.js";
import { leaveSchema } from "../models/Leave.js";
import { holidaysCalenderSchema } from "../models/Calender.js";

const connections = {};

export const createTenantDatabase = async (subdomain) => {
  const dbName = `tenant_${subdomain}`;

  if (connections[dbName]) return connections[dbName];

  const conn = mongoose.createConnection(process.env.MONGO_URI, {
    dbName,
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  });

  conn.model("User", userSchema);
  conn.model("Attendance", attendanceSchema);
  conn.model("Leave", leaveSchema);
  conn.model("HolidaysCalender", holidaysCalenderSchema);
  // Initialize other tenant-specific models here

  connections[dbName] = conn;
  return conn;
};
