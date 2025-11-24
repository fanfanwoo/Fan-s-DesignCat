import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RefreshCw, ArrowLeft, Sparkles, Download } from 'lucide-react';
import ChatInterface from './ChatInterface';
import RadarChart from './RadarChart';
import { DesignScore, ChatSessionData } from '../types';

interface AnalysisResultProps {
  result: string;
  scores: DesignScore | null;
  image: string | null;
  chatData?: ChatSessionData;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, scores, image, chatData, onReset }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in relative">
      
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Input
        </button>
        
        <div className="flex gap-3">
          <button 
             onClick={onReset}
             className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
           >
             <RefreshCw size={16} /> Critique Again
           </button>
           {chatData && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              <Sparkles size={16} /> Edit with AI
            </button>
           )}
        </div>
      </div>

      {/* Score & Image Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mb-8 transition-colors duration-300">
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left: Image Preview */}
          <div className="md:col-span-4 flex flex-col items-center">
            {image ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-lg bg-slate-100 dark:bg-slate-900">
                <img 
                  src={image} 
                  alt="Analyzed Design" 
                  className="max-h-[300px] w-auto object-contain" 
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500">
                No Image
              </div>
            )}
          </div>

          {/* Right: Scores */}
          <div className="md:col-span-8 w-full">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
               <div>
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">Design Score</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">AI Confidence: <span className="text-indigo-600 dark:text-indigo-400 font-medium">{scores?.confidence || 'High'}</span></p>
               </div>
               
               {/* Overall Score Circle */}
               {scores && (
                 <div className="mt-4 md:mt-0 flex-shrink-0 w-24 h-24 rounded-full bg-rose-50 dark:bg-rose-100 flex items-center justify-center shadow-inner border border-rose-100 dark:border-transparent">
                    <span className="text-4xl font-bold text-rose-600">{scores.overallScore}</span>
                 </div>
               )}
             </div>

             {/* Radar Chart Area */}
             <div className="mt-4 w-full flex justify-center md:justify-start relative">
                {scores ? (
                  <div className="w-full max-w-md">
                    <RadarChart metrics={scores.metrics} />
                  </div>
                ) : (
                  <div className="h-48 w-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                    Generating Metrics...
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>

      {/* Main Markdown Content */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 md:p-10 transition-colors duration-300">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-6">Executive Summary & Detail</h3>
            <article className="prose prose-slate dark:prose-invert max-w-none 
              prose-headings:font-bold 
              prose-h1:text-indigo-600 dark:prose-h1:text-indigo-400
              prose-h2:border-l-4 prose-h2:border-indigo-500 prose-h2:pl-4
              prose-strong:text-slate-900 dark:prose-strong:text-white
              prose-table:border-collapse prose-table:w-full prose-table:my-8
              prose-th:bg-slate-100 dark:prose-th:bg-slate-900/50 prose-th:text-left prose-th:p-3
              prose-td:border-b prose-td:border-slate-200 dark:prose-td:border-slate-700 prose-td:p-3
              ">
              <ReactMarkdown>{result}</ReactMarkdown>
            </article>
        </div>
      </div>

      {/* Chat Overlay */}
      {isChatOpen && chatData && (
        <ChatInterface 
          chatData={chatData} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}
      
    </div>
  );
};

export default AnalysisResult;