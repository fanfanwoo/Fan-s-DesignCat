import { DesignContext, DesignScore, ChatMessage } from "../types";

export interface AnalysisResponse {
  text: string;
  scores: DesignScore | null;
}

// Helper to parse the specific JSON format we requested from the model
const parseResponse = (fullText: string) => {
  let scores: DesignScore | null = null;
  let markdownText = fullText;

  try {
    const separatorIndex = fullText.indexOf('---SEPARATOR---');
    if (separatorIndex !== -1) {
      const jsonStr = fullText.substring(0, separatorIndex).trim();
      markdownText = fullText.substring(separatorIndex + 15).trim();
      const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      scores = JSON.parse(cleanJson);
    } else {
      const jsonMatch = fullText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        scores = JSON.parse(jsonMatch[0]);
        markdownText = fullText.replace(jsonMatch[0], '').trim();
      }
    }
  } catch (e) {
    console.error("Failed to parse scores locally:", e);
  }
  return { text: markdownText, scores };
};

export const analyzeDesign = async (
  imageBase64: string | null,
  context: DesignContext,
  themeMode: 'day' | 'night' = 'day'
): Promise<AnalysisResponse> => {
  
  // Call our own backend
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      context,
      themeMode
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Server failed to analyze design");
  }

  const data = await response.json();
  const { text, scores } = parseResponse(data.text);

  return { text, scores };
};

export const sendChatMessage = async (
  history: ChatMessage[],
  message: string,
  imageBase64: string | null,
  context: DesignContext
): Promise<string> => {
  
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      history,
      message,
      imageBase64,
      context
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to send message");
  }

  const data = await response.json();
  return data.text;
};