import React, { useState, useEffect } from 'react';
import { Layers, Moon, Sun, Monitor } from 'lucide-react';
import InputSection from './components/InputSection';
import AnalysisResult from './components/AnalysisResult';
import { analyzeDesign } from './services/geminiService';
import { AnalysisState, DesignContext } from './types';

// Decision Engine Types
type ThemeChoice = 'day' | 'night';
type UserPreference = 'day' | 'night' | null;
type SystemTheme = 'light' | 'dark' | null;

interface ThemeEngineDecision {
  theme: ThemeChoice;
  reason: string;
}

// ---------------------------------------------------------
// THEME SELECTION ENGINE
// ---------------------------------------------------------
const determineTheme = (
  localHour: number,
  userPreference: UserPreference,
  systemTheme: SystemTheme
): ThemeEngineDecision => {
  // 1. User preference beats everything
  if (userPreference === 'day') {
    return { theme: 'day', reason: "User explicitly prefers day mode." };
  }
  if (userPreference === 'night') {
    return { theme: 'night', reason: "User explicitly prefers night mode." };
  }

  // 2. No user preference, follow system theme
  if (systemTheme === 'light') {
    return { theme: 'day', reason: "No user preference, light system theme maps to day mode." };
  }
  if (systemTheme === 'dark') {
    return { theme: 'night', reason: "No user preference, dark system theme maps to night mode." };
  }

  // 3. Neither set, use time of day
  // If localHour is between 7 and 18 (inclusive) → theme is "day".
  if (localHour >= 7 && localHour <= 18) {
    return { theme: 'day', reason: "No preference or system theme, time is between 7-18." };
  }

  return { theme: 'night', reason: "No preference or system theme, time is outside 7-18." };
};

// Helper to get current system theme
const getSystemTheme = (): SystemTheme => {
  if (typeof window === 'undefined') return null;
  // Check strict media queries
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;

  if (isDark) return 'dark';
  if (isLight) return 'light';
  return null; // Unknown or no-preference
};

function App() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    image: null,
    context: {
      userContext: '',
    },
    result: null,
    scores: null,
    chatSession: undefined,
  });

  // --- Theme State & Engine ---

  // 1. User Preference
  const [userPreference, setUserPreference] = useState<UserPreference>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('user_theme_pref');
    if (saved === 'day') return 'day';
    if (saved === 'night') return 'night';
    
    // Backward compatibility for 'theme' key
    const old = localStorage.getItem('theme');
    if (old === 'light') return 'day';
    if (old === 'dark') return 'night';
    if (old === 'system') return null;
    
    return null;
  });

  // 2. System Theme & Local Hour
  const [systemTheme, setSystemTheme] = useState<SystemTheme>(getSystemTheme());
  const [localHour, setLocalHour] = useState<number>(new Date().getHours());

  // Listen for environment changes
  useEffect(() => {
    const handleEnvChange = () => {
        setSystemTheme(getSystemTheme());
        setLocalHour(new Date().getHours());
    };

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    darkQuery.addEventListener('change', handleEnvChange);
    lightQuery.addEventListener('change', handleEnvChange);
    
    // Check time every minute to ensure transitions happen if app is left open
    const interval = setInterval(() => {
        setLocalHour(new Date().getHours());
    }, 60000);

    // Initial check
    handleEnvChange();

    return () => {
      darkQuery.removeEventListener('change', handleEnvChange);
      lightQuery.removeEventListener('change', handleEnvChange);
      clearInterval(interval);
    };
  }, []);

  // Calculate Theme Decision
  const decision = determineTheme(localHour, userPreference, systemTheme);

  // Apply Theme Side Effect
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (decision.theme === 'night') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Persist Preference
    if (userPreference) {
      localStorage.setItem('user_theme_pref', userPreference);
    } else {
      localStorage.removeItem('user_theme_pref');
    }
    // Clean up old key to avoid confusion
    localStorage.removeItem('theme');
  }, [decision.theme, userPreference]);

  const toggleTheme = () => {
    // Cycle: Auto (null) -> Night ('night') -> Day ('day') -> Auto
    setUserPreference((prev) => {
      if (prev === null) return 'night';
      if (prev === 'night') return 'day';
      return null;
    });
  };

  const getThemeIcon = () => {
    if (userPreference === 'day') return <Sun size={20} />;
    if (userPreference === 'night') return <Moon size={20} />;
    return <Monitor size={20} />;
  };

  const getThemeLabel = () => {
    if (userPreference === 'day') return 'Day';
    if (userPreference === 'night') return 'Night';
    return 'Auto';
  };

  const handleAnalyze = async (image: string | null, context: DesignContext) => {
    setState((prev) => ({ ...prev, status: 'analyzing', image, context, error: undefined }));
    
    try {
      // Pass the current theme decision to the AI
      const { text, scores, chat } = await analyzeDesign(image, context, decision.theme);
      setState((prev) => ({ 
        ...prev, 
        status: 'complete', 
        result: text,
        scores: scores,
        chatSession: chat
      }));
    } catch (error: any) {
      setState((prev) => ({ 
        ...prev, 
        status: 'error', 
        error: error.message || "Something went wrong. Please check your API key and try again." 
      }));
    }
  };

  const handleReset = () => {
    setState({
      status: 'idle',
      image: null,
      context: {
        userContext: '',
      },
      result: null,
      scores: null,
      chatSession: undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={handleReset}>
            <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <Layers className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-slate-600 dark:from-white dark:to-slate-400">
              Fan's DesignCat
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
             <span className="hidden sm:inline font-medium">Powered by Gemini 3</span>
             <button 
               onClick={toggleTheme}
               className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
               title={`Current Mode: ${decision.theme.charAt(0).toUpperCase() + decision.theme.slice(1)} (${decision.reason})`}
             >
               {getThemeIcon()}
               <span className="text-xs font-medium w-10 text-left">{getThemeLabel()}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {state.status === 'idle' && (
           <div className="animate-fade-in-up">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 transition-colors duration-300">
                  Refine your designs <br/>
                  <span className="text-indigo-600 dark:text-indigo-400">in seconds.</span>
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Upload a screenshot or Figma URL to get actionable, professional critique on visual design, UX, accessibility, and business strategy alignment.
                </p>
              </div>
              <InputSection onAnalyze={handleAnalyze} isAnalyzing={false} />
           </div>
        )}

        {state.status === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
             <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
               <div className="absolute inset-3 border-t-4 border-violet-500 border-solid rounded-full animate-spin-slow"></div>
             </div>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-300">Analyzing Design</h3>
             <p className="text-slate-500 dark:text-slate-400">Thinking deeply about UX, Business, and Engineering perspectives...</p>
          </div>
        )}

        {state.status === 'complete' && state.result && (
          <AnalysisResult 
            result={state.result} 
            scores={state.scores}
            image={state.image} 
            chatSession={state.chatSession}
            onReset={handleReset} 
          />
        )}

        {state.status === 'error' && (
           <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-red-100 dark:border-red-900/50 shadow-lg animate-fade-in transition-colors duration-300">
              <div className="text-red-500 mb-4 text-5xl">⚠️</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analysis Failed</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">{state.error}</p>
              <button 
                onClick={handleReset}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
           </div>
        )}

      </main>
    </div>
  );
}

export default App;