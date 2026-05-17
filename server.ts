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

  // API Route for Biblical Counseling
  app.post("/api/gemini/biblical-counsel", async (req, res) => {
    try {
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ error: "question is required" });
      }

      const prompt = `A user is seeking biblical guidance/counsel on: "${question}". Provide a compassionate, Christ-centered response that includes 1-2 relevant Bible verses and 2-3 sentences of practical/spiritual application. Help them find faith, strength, and redemption in Christ.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a compassionate, wise, and deeply grounded Christian Biblical Counselor and Pastor. Your goal is to lead people to Christ, build their faith using the Holy Bible, and provide hope, teaching, and preaching elements in your responses. Be encouraging and redemption-focused.",
        },
      });

      res.json({ counsel: response.text });
    } catch (error) {
      console.error("Gemini Biblical Counsel Error:", error);
      res.status(500).json({ error: "Failed to generate counsel" });
    }
  });

  // API Route for fetching Bible Chapters
  app.get("/api/bible/:book/:chapter", async (req, res) => {
    try {
      const { book, chapter } = req.params;
      const response = await fetch(`https://bible-api.com/${book}+${chapter}?translation=web`);
      if (!response.ok) throw new Error("Bible API error");
      const data = await response.json();
      res.json(data);
    } catch (error) {
       console.error("Bible Fetch Error:", error);
       res.status(500).json({ error: "Could not fetch scripture" });
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
