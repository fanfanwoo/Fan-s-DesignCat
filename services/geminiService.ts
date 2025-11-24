import { GoogleGenAI, Chat } from "@google/genai";
import { DesignContext, DesignScore } from "../types";

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

export interface AnalysisResponse {
  text: string;
  scores: DesignScore | null;
  chat: Chat;
}

export const analyzeDesign = async (
  imageBase64: string | null,
  context: DesignContext,
  themeMode: 'day' | 'night' = 'day'
): Promise<AnalysisResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      // Enable thinking for deeper reasoning on complex design tasks.
      // 5000 tokens allows for significant analysis before outputting the critique.
      thinkingConfig: { thinkingBudget: 5000 },
    },
  });

  const parts: any[] = [];

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
  
  // Add Theme Context
  promptText += `**Current UI Theme:** ${themeMode}\n`;
  promptText += `If theme is "night", assume a dark background and adjust any design feedback (e.g. colour contrast, brightness) for dark mode. If theme is "day", assume a light background and adjust feedback for light mode.\n\n`;

  if (context.figmaUrl) promptText += `**Figma URL provided:** ${context.figmaUrl}\n`;
  
  if (context.userContext && context.userContext.trim().length > 0) {
    promptText += `**Context, Goals & Constraints:**\n${context.userContext}\n`;
  } else {
    promptText += "\n(Note: No specific business or user context was provided. Please infer the likely context based on standard UI patterns for this type of interface.)";
  }

  parts.push({ text: promptText });

  try {
    const response = await chat.sendMessage({
      message: parts
    });

    const fullText = response.text || "";
    
    // Parse split response
    let scores: DesignScore | null = null;
    let markdownText = fullText;

    try {
      const separatorIndex = fullText.indexOf('---SEPARATOR---');
      if (separatorIndex !== -1) {
        const jsonStr = fullText.substring(0, separatorIndex).trim();
        markdownText = fullText.substring(separatorIndex + 15).trim();
        // Clean up potential markdown code blocks if the model messed up
        const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        scores = JSON.parse(cleanJson);
      } else {
        // Fallback if separator missing, try to find first JSON block
        const jsonMatch = fullText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          scores = JSON.parse(jsonMatch[0]);
          markdownText = fullText.replace(jsonMatch[0], '').trim();
        }
      }
    } catch (e) {
      console.error("Failed to parse scores:", e);
      // Keep full text if parsing fails
    }

    return {
      text: markdownText,
      scores: scores,
      chat: chat
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to analyze design.");
  }
};

export const sendChatMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response = await chat.sendMessage({ message });
    return response.text || "";
  } catch (error: any) {
     console.error("Gemini Chat Error:", error);
     throw new Error(error.message || "Failed to send message.");
  }
};
