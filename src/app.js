import express from "express";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import xss from "xss-clean";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import hpp from "hpp";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";

const app = express();
app.disable("x-powered-by");
dotenv.config();

// Body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Security & sanitisation
// app.use(
//   mongoSanitize({
//     replaceWith: '_',
//     onSanitize: ({ req, key }) => {
//       if (req.query && Object.prototype.hasOwnProperty.call(req.query, key)) {
//         delete req.query[key];
//       }
//     },
//   })
// );
// app.use(helmet());
// app.use(xss());

app.use(
  rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 100,
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(hpp());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/superAdmin", superAdminRoutes);
app.use("/api/v1", organizationRoutes);

// 404
// app.all('*', (req, res, next) => {
//   next(new Error(`Can't find ${req.originalUrl}`));
// });

// Global error handler
// app.use(errorHandler);

export default app;
