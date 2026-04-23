import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization of Firebase Admin
let adminApp: admin.app.App | null = null;
function getAdmin() {
  if (!adminApp) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not defined. Please set it in your environment variables.");
    }
    
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err);
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON format.");
    }
  }
  return adminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Paystack Transaction Initialization
  app.post("/api/create-payment", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.warn("PAYSTACK_SECRET_KEY is not defined.");
      return res.status(500).json({ error: "Paystack is not configured." });
    }

    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: 10000 * 100, // $100.00 in cents/kobo (Paystack uses smallest unit)
          callback_url: `${req.headers.origin}/?payment=success`,
          metadata: {
            cancel_action: `${req.headers.origin}/?payment=cancel`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        res.status(200).json({ url: response.data.data.authorization_url });
      } else {
        res.status(400).json({ error: response.data.message });
      }
    } catch (err: any) {
      console.error("Paystack Error:", err.response?.data?.message || err.message);
      res.status(500).json({ error: err.response?.data?.message || err.message });
    }
  });

  // Endpoint to set Admin Claims
  app.post("/api/set-admin", async (req, res) => {
    const { uid, adminSecret } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "User ID (uid) is required." });
    }

    // Basic security check: Require a secret to prevent unauthorized claim updates
    if (adminSecret !== process.env.ADMIN_CLAIM_SECRET) {
      return res.status(403).json({ error: "Unauthorized. Invalid admin secret." });
    }

    try {
      getAdmin(); // Ensure initialized
      await admin.auth().setCustomUserClaims(uid, {
        admin: true
      });
      console.log(`Successfully set admin claim for user: ${uid}`);
      res.json({ message: `Successfully promoted user ${uid} to admin.` });
    } catch (err: any) {
      console.error("Firebase Admin Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
