import React, { useState, useRef } from 'react';
import { Upload, Camera, Link, Info, X } from 'lucide-react';
import { DesignContext, TabOption } from '../types';
import CameraCapture from './CameraCapture';

interface InputSectionProps {
  onAnalyze: (image: string | null, context: DesignContext) => void;
  isAnalyzing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.UPLOAD);
  const [image, setImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [context, setContext] = useState<DesignContext>({
    userContext: '',
    figmaUrl: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!image && !context.figmaUrl) {
      alert("Please upload an image or provide a Figma URL.");
      return;
    }
    onAnalyze(image, context);
  };

  const clearImage = () => setImage(null);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab(TabOption.UPLOAD)}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === TabOption.UPLOAD
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Upload size={18} /> Upload
        </button>
        <button
          onClick={() => setActiveTab(TabOption.CAMERA)}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === TabOption.CAMERA
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Camera size={18} /> Camera
        </button>
        <button
          onClick={() => setActiveTab(TabOption.URL)}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === TabOption.URL
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Link size={18} /> URL
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        
        {/* Media Input Area */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
            1. Design Input <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Required)</span>
          </h3>
          
          {activeTab === TabOption.UPLOAD && (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Preview" className="max-h-64 rounded shadow-lg object-contain" />
                  <button 
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={48} className="text-slate-400 dark:text-slate-500 mb-4" />
                  <p className="text-slate-600 dark:text-slate-300 mb-2 font-medium">Drag & drop an image here</p>
                  <p className="text-slate-500 text-sm mb-4">or click to browse files</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Select File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === TabOption.CAMERA && (
            <div className="border-2 border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 min-h-[200px] transition-colors">
              {image ? (
                <div className="relative group">
                  <img src={image} alt="Capture" className="max-h-64 rounded shadow-lg object-contain" />
                  <button 
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex flex-col items-center gap-3 px-6 py-8 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-all w-full max-w-xs text-slate-900 dark:text-white"
                >
                  <Camera size={48} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="font-semibold text-lg">Open Camera</span>
                </button>
              )}
            </div>
          )}

          {activeTab === TabOption.URL && (
            <div className="space-y-2">
               <label className="block text-sm text-slate-600 dark:text-slate-400">Figma URL (Public link preferred)</label>
               <input
                type="url"
                placeholder="https://www.figma.com/file/..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors"
                value={context.figmaUrl}
                onChange={(e) => setContext({ ...context, figmaUrl: e.target.value })}
              />
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info size={12} />
                For best results, upload a screenshot if the file is private.
              </p>
            </div>
          )}
        </div>

        {/* Context Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
            2. Context & Goals <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Recommended)</span>
          </h3>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
              Describe the product, target audience, business goals, or specific constraints...
            </label>
            <textarea
              rows={4}
              placeholder="e.g. This is a checkout flow for a mobile-first fashion retailer. Our goal is to reduce cart abandonment. The design must adhere to WCAG AA standards."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 dark:placeholder-slate-600 resize-none transition-all focus:border-indigo-500"
              value={context.userContext}
              onChange={(e) => setContext({ ...context, userContext: e.target.value })}
            />
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 ${
            isAnalyzing
              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Critiquing Design...
            </>
          ) : (
            <>
              Generate Critique
            </>
          )}
        </button>

      </div>

      {showCamera && (
        <CameraCapture
          onCapture={(data) => setImage(data)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default InputSection;