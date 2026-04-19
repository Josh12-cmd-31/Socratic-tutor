import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Stripe lazily
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("STRIPE_SECRET_KEY is not defined in the environment.");
        return null;
      }
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
  };

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session Creation
  app.post("/api/create-checkout-session", async (req, res) => {
    const s = getStripe();
    if (!s) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    try {
      const session = await (s.checkout.sessions.create as any)({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Socratic Math Tutor - Lifetime Access",
                description: "One-time payment for full platform access.",
              },
              unit_amount: 10000, // $100.00
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        automatic_payment_methods: {
          enabled: true,
        },
        success_url: `${req.headers.origin}/?payment=success`,
        cancel_url: `${req.headers.origin}/?payment=cancel`,
      });

      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
      console.error("Stripe Session Error:", err.message);
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
