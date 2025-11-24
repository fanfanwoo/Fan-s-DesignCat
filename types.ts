import { Chat } from "@google/genai";

export interface DesignContext {
  userContext: string;
  figmaUrl?: string;
}

export interface DesignScore {
  overallScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  metrics: {
    infoArchitecture: number; // 0-10
    visualHierarchy: number;
    layoutSpacing: number;
    accessibility: number;
    usability: number;
  };
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  image: string | null; // base64
  context: DesignContext;
  result: string | null;
  scores: DesignScore | null;
  chatSession?: Chat;
  error?: string;
}

export enum TabOption {
  UPLOAD = 'upload',
  CAMERA = 'camera',
  URL = 'url',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}