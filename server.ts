import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for generating motivational narratives
  app.post("/api/gemini/generate-narrative", async (req, res) => {
    try {
      const { habitName, category, goal } = req.body;

      if (!habitName || !category) {
        return res.status(400).json({ error: "habitName and category are required" });
      }

      const prompt = `Generate a personalized, deeply motivational and short narrative (3-4 sentences) for someone starting their journey of liberation from ${habitName} (Category: ${category}). ${goal ? `Their specific goal is: ${goal}.` : ''} The tone should be empathetic, powerful, and focused on reclaiming their freedom and future excellence.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a master coach and specialist in overcoming addictions. Your words are powerful, poetic, and provide immediate psychological strength.",
        },
      });

      res.json({ narrative: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate narrative" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
