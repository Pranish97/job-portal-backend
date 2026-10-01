import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [process.env.FRONTEND_URL, process.env.HOST_URL]
        .filter(Boolean)
        .map((url) => url.replace(/\/$/, ""));

      // Allow requests without origin
      // (Postman, mobile apps, server-to-server requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],

    credentials: true,
  }),
);

// JSON BODY PARSER
app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);

// HTTP SERVER
const server = http.createServer(app);

// START SERVER

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
