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

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Serializable session data we keep in React state
export interface ChatSessionData {
  history: ChatMessage[];
  lastContext: DesignContext;
  lastImage: string | null;
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  image: string | null; // base64
  context: DesignContext;
  result: string | null;
  scores: DesignScore | null;
  chatData?: ChatSessionData;
  error?: string;
}

export enum TabOption {
  UPLOAD = 'upload',
  CAMERA = 'camera',
  URL = 'url',
}