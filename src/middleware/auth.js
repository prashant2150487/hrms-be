import jwt from "jsonwebtoken";
import { createTenantDatabase } from "../utils/tenantService.js";

// Protect routes - verify JWT and set user/tenant context
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded, "decoded")
    const extractSubDomainFromEmail = (email) => {
      const match = email.match(/@([^.@]+)\.com$/);
      return match ? match[1] : null;
    };
    const subdomain = extractSubDomainFromEmail(decoded?.email);

    // Connect to tenant database
    const tenantConn = await createTenantDatabase(subdomain);
    const TenantUser = tenantConn.model("User");

    // Get user from tenant database
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
    req.tenantConn = tenantConn;
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Middleware to verify organization admin
export const isOrganizationAdmin = async (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized as organization admin",
    });
  }
  next();
};
