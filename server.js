import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large images

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// --- GEMINI CONFIGURATION ---
const SYSTEM_INSTRUCTION = `
You are a world-class Senior Product Design Architect and UX Engineer. Your job is to critique and improve product designs based on an image and context provided.

First, you must evaluate the design on 5 specific dimensions (0-10 scale) and calculate an overall score (0-100).
The dimensions are:
1. Information Architecture (Clarity of structure, grouping)
2. Visual Hierarchy (Scanning path, emphasis)
3. Layout & Spacing (Whitespace, alignment, grid)
4. Accessibility (Contrast, touch targets, text size)
5. Usability (Affordances, standard patterns)

**CRITICAL OUTPUT FORMAT:**
You must start your response with a valid JSON block strictly following this format, followed by your markdown critique. Do not wrap the JSON in markdown code blocks like \`\`\`json. Just output the raw JSON string first, then a divider, then the markdown.

{
  "overallScore": 59,
  "confidence": "High",
  "metrics": {
    "infoArchitecture": 6,
    "visualHierarchy": 5,
    "layoutSpacing": 7,
    "accessibility": 4,
    "usability": 6
  }
}
---SEPARATOR---
# Executive Summary
[Brief high-level summary of the design's effectiveness]

# 360° Perspective Analysis

## 👤 User Experience (The Human View)
[Critique how a new or power user would experience this. Focus on cognitive load, friction points, emotional response, and "Can I figure this out in 3 seconds?"]

## 💼 Business Strategy (The ROI View)
[Critique how this design impacts conversion, brand trust, and business goals. Are call-to-actions clear? Does it drive the intended user behavior? Identification of missed revenue opportunities.]

## 🛠️ Engineering & Feasibility (The Dev View)
[Critique implementation complexity. Are there non-standard patterns that increase technical debt? Accessibility risks (WCAG)? Performance implications of the layout?]

# Actionable Improvements
[Bulleted list of specific, high-impact changes]

... [Rest of Markdown Critique] ...

---

**INTERACTIVE REDESIGN MODE (Context for follow-up chat):**
If the user asks to "visualize", "show me", "code this", "apply changes", or "edit" the design in the chat follow-up:
1. You MUST generate a single, self-contained HTML file.
2. Use Tailwind CSS via CDN script: <script src="https://cdn.tailwindcss.com"></script>
3. Use Google Fonts (Inter) to make it look professional.
4. Use Lucide Icons (via script or SVG) if icons are needed.
5. Wrap the code specifically in a markdown code block tagged as html: \`\`\`html ... \`\`\`
6. Do not just give snippets. Give the FULL functional component/page that represents the improved design.
`;

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing on server.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- API ROUTES ---

// 1. Analyze Design Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, context, themeMode } = req.body;
    const ai = getAIClient();

    const parts = [];
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data,
        },
      });
    }

    let promptText = `Please critique the attached design.\n\n`;
    promptText += `**Current UI Theme:** ${themeMode}\n`;
    promptText += `If theme is "night", assume a dark background and adjust any design feedback for dark mode.\n\n`;

    if (context.figmaUrl) promptText += `**Figma URL provided:** ${context.figmaUrl}\n`;
    if (context.userContext) promptText += `**Context, Goals & Constraints:**\n${context.userContext}\n`;

    parts.push({ text: promptText });

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 5000 },
      },
    });

    // We use sendMessage to start the "chat" even though it's the first message
    const response = await chat.sendMessage({ message: parts });
    const text = response.text || "";

    res.json({ text });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze design" });
  }
});

// 2. Chat Endpoint (Stateless for the backend, Frontend sends history)
app.post('/api/chat', async (req, res) => {
  try {
    const { history, message, imageBase64, context } = req.body;
    const ai = getAIClient();

    // Reconstruct the chat session
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    // Note: In a stateless REST API with image inputs, maintaining perfect history 
    // with the SDK's history management is tricky because we can't serialize the 
    // server-side Chat object to the client.
    // 
    // Strategy: We will send the image + system context + previous user/model turns 
    // as a fresh request for every turn. This consumes more tokens but ensures 
    // the model "remembers" the image without server-side database session storage.

    const parts = [];

    // 1. Re-attach image context (Essential for "Make the button blue" to work)
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1];
      parts.push({
        inlineData: { mimeType: 'image/png', data: base64Data },
      });
    }

    // 2. Add Context String
    let contextStr = `(Context: ${context.userContext || 'None'})`;
    parts.push({ text: `Original Design Context: ${contextStr}\n\n` });

    // 3. Add History manually to the prompt to simulate memory
    // (Gemini 1.5/2.0/3.0 has massive context window, so this is safe)
    let historyStr = "--- PREVIOUS CONVERSATION HISTORY ---\n";
    history.forEach(msg => {
       historyStr += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}\n`;
    });
    historyStr += "--- END HISTORY ---\n\n";
    historyStr += `User's New Request: ${message}`;

    parts.push({ text: historyStr });

    const response = await chat.sendMessage({ message: parts });
    const text = response.text || "";

    res.json({ text });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
});

// Handle React Routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});