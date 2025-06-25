import jwt from "jsonwebtoken";
import { createTenantDatabase } from "../utils/tenantService.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Connect to tenant DB to verify user
    const tenantConn = await createTenantDatabase(decoded.tenant);
    const TenantUser = tenantConn.model("User");

    const currentUser = await TenantUser.findById(decoded.id);
    if (!currentUser || !currentUser.isActive) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists or is inactive",
      });
    }

    // Attach user and tenant to request
    req.user = currentUser;
    req.tenant = decoded.tenant;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};
