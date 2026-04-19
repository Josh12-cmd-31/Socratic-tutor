import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
