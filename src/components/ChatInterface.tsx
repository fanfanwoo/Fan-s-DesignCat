import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Loader2, Sparkles, Eye, FileCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, ChatSessionData } from '../types';
import { sendChatMessage } from '../services/geminiService';
import DesignPreviewModal from './DesignPreviewModal';

interface ChatInterfaceProps {
  chatData: ChatSessionData;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatData, onClose }) => {
  // Initialize with history from props
  const [messages, setMessages] = useState<ChatMessage[]>(chatData.history);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractHtml = (text: string): string | null => {
    const match = text.match(/```html\n([\s\S]*?)\n```/);
    return match ? match[1] : null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    
    // Optimistically update UI
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Send the entire history + context + image to the backend
      const responseText = await sendChatMessage(
        messages, // Send previous history (backend will add the new user message)
        userMessage, // Current message
        chatData.lastImage, 
        chatData.lastContext
      );
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      
      const code = extractHtml(responseText);
      if (code) {
        setPreviewCode(code);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error communicating with the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl transform transition-transform z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
               <h3 className="font-bold text-slate-900 dark:text-white">Edit with AI</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400">Refine & Generate Code</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/50 transition-colors">
          {messages.map((msg, idx) => {
            const htmlCode = msg.role === 'model' ? extractHtml(msg.text) : null;
            
            const displayText = htmlCode 
              ? msg.text.replace(/```html\n([\s\S]*?)\n```/, '') 
              : msg.text;

            return (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User size={14} className="text-slate-600 dark:text-slate-300"/> : <Bot size={14} className="text-white"/>}
                </div>
                
                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm w-full transition-colors ${
                    msg.role === 'user' 
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-transparent rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-p:leading-normal prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700 dark:prose-invert">
                       <ReactMarkdown>{displayText}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Generated Design Card */}
                  {htmlCode && (
                    <div className="w-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all mt-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                          <FileCode size={20} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Design Concept Generated</h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-200">Ready for preview</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setPreviewCode(htmlCode)}
                        className="px-4 py-2 bg-white text-indigo-700 border border-indigo-100 dark:border-transparent text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white"/>
              </div>
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm transition-colors">
                  <Loader2 size={16} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Generating improvements...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask to visualize changes, e.g., 'Make the button blue'"
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none scrollbar-hide placeholder-slate-500 dark:placeholder-slate-500 transition-colors"
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
                input.trim() && !isLoading 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      {previewCode && (
        <DesignPreviewModal 
          htmlCode={previewCode} 
          onClose={() => setPreviewCode(null)} 
        />
      )}
    </>
  );
};

export default ChatInterface;