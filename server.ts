import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization of Firebase Admin
let adminApp: admin.app.App | null = null;
function getAdmin() {
  if (!adminApp) {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    // Fallback to local file if env var is missing
    if (!serviceAccountJson) {
      const saPath = path.join(process.cwd(), "firebase-sa-minified.txt");
      if (fs.existsSync(saPath)) {
        serviceAccountJson = fs.readFileSync(saPath, "utf-8");
      }
    }

    if (!serviceAccountJson) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is not defined. Firebase Admin features will be disabled.");
      return null;
    }
    
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err);
      return null;
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

    // Basic security check
    if (!process.env.ADMIN_CLAIM_SECRET || adminSecret !== process.env.ADMIN_CLAIM_SECRET) {
      return res.status(403).json({ error: "Unauthorized. Invalid admin secret." });
    }

    try {
      const adminInstance = getAdmin(); 
      if (!adminInstance) {
        return res.status(503).json({ error: "Admin SDK not configured on server. Missing FIREBASE_SERVICE_ACCOUNT_JSON." });
      }

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

  // Endpoint to check and auto-ban multiple accounts on same device
  app.post("/api/check-device", async (req, res) => {
    const { uid, deviceId } = req.body;

    if (!uid || !deviceId) {
      return res.status(400).json({ error: "UID and DeviceID are required." });
    }

    try {
      const adminInstance = getAdmin();
      if (!adminInstance) {
        console.warn("Skipping device check: FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
        return res.json({ isBanned: false, warning: "Security check skipped due to missing config." });
      }

      // Read database ID from config
      let databaseId = "(default)";
      try {
        const configPath = path.join(process.cwd(), "firebase-applet-config.json");
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          databaseId = config.firestoreDatabaseId || "(default)";
        }
      } catch (e) {
        console.warn("Could not read firestoreDatabaseId from config, defaulting to (default)");
      }

      let db;
      try {
        db = getFirestore(adminInstance, databaseId);
      } catch (e) {
        console.warn(`Database ${databaseId} not found or error, falling back to default`);
        db = getFirestore(adminInstance);
      }
      
      const usersRef = db.collection("users");
      const snapshot = await usersRef.where("deviceId", "==", deviceId).get();
      
      const otherUsers = snapshot.docs.filter(doc => doc.id !== uid);
      
      if (otherUsers.length > 0) {
        // Multi-account detected
        const batch = db.batch();
        
        // Ban current user
        batch.update(usersRef.doc(uid), { 
          isBanned: true, 
          banReason: "Multiple accounts on same device detected (AI Auto-Ban)" 
        });
        
        // Ban other users
        otherUsers.forEach(doc => {
          if (!doc.data().isBanned) {
            batch.update(doc.ref, { 
              isBanned: true, 
              banReason: "Multiple accounts on same device detected (AI Auto-Ban)" 
            });
          }
        });
        
        await batch.commit();
        return res.json({ isBanned: true });
      }
      
      res.json({ isBanned: false });
    } catch (err: any) {
      console.error("Device Check Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Socratic AI endpoint
  app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined on server.");
      return res.status(503).json({ error: "AI Service not configured on server." });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      
      const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, "");
      
      if (cleanApiKey === "MY_GEMINI_API_KEY" || !cleanApiKey) {
        return res.status(503).json({ 
          error: "Gemini API key is not configured. Please set a valid GEMINI_API_KEY in the Secrets panel." 
        });
      }

      const ai = new GoogleGenAI({ apiKey: cleanApiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: `You are a Socratic Math Tutor. Your mission is to lead students to understanding through questioning, observation, and analysis.

STRICT PROTOCOLS:
1. NEVER give the final answer or a full solution directly.
2. BREAK DOWN complex problems into the smallest possible logical steps.
3. ASK one guiding question at a time. Wait for the student's input before moving to the next step.
4. SIMPLIFICATION EXAMPLE (e.g., 2n + 3n - 3m = 12m):
   - First, ask if they see any "like terms" that can be combined.
   - Then, ask how they would move terms to one side if needed.
   - Guide them to realize that 2n + 3n = 5n and -3m becomes +3m when moved.
5. FORMATTING: Use LaTeX for all math expressions (e.g., $$5n = 15m$$).
6. TONE: Encouraging, patient, and intellectually stimulating.

If the student is completely lost, give a conceptual hint rather than a calculation step.`,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text || "I'm having trouble thinking." });
    } catch (err: any) {
      console.error("AI Proxy Error details:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI response" });
    }
  });

  // Fallback for missing API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
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
