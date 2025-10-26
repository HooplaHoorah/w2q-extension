import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(cors()); // tighten later

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const TaskSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()).default([]),
  links: z.array(z.string()).default([])
});
const TasksSchema = z.object({ tasks: z.array(TaskSchema).default([]) });

const SYS = `You are a task refiner. ALWAYS return valid JSON:
{"tasks":[{"title":"","steps":[],"links":[]}]} No markdown fences; JSON only.`;

async function genJSON(parts){
  const r = await model.generateContent([{ text: SYS }, ...parts]);
  const t = r.response.text().trim();
  try { return TasksSchema.parse(JSON.parse(t)); }
  catch { return { tasks: [] }; }
}

app.post("/api/tasks", async (req, res) => {
  try {
    const { text = "", url = "" } = req.body || {};
    const prompt = `Turn this into actionable tasks. Include URL if present.
URL: ${url}
TEXT:
${text}`;
    res.json(await genJSON([{ text: prompt }]));
  } catch { res.status(500).json({ error: "TASKS_FAILED" }); }
});

app.post("/api/tasks-image", async (req, res) => {
  try {
    const { imageBase64, mime = "image/png" } = req.body || {};
    const img = { inlineData: { data: (imageBase64||"").split(",").pop(), mimeType: mime } };
    res.json(await genJSON([{ text: "Extract actionable tasks from this image. JSON only." }, img]));
  } catch { res.status(500).json({ error: "IMAGE_TASKS_FAILED" }); }
});

app.get("/healthz", (_, res) => res.send("ok"));
app.listen(process.env.PORT || 8080, () => console.log("hybrid backend listening"));
