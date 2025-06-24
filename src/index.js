import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/connectDB.js";
dotenv.config(); // Load .env vars
await connectDB(); // Connect to MongoDB


const PORT = process.env.PORT || 5000;



const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown for unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
