
import React, { useState, useRef } from 'react';
import { analyzeImage } from '../services/gemini';

const VisionGen: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Analyze this image in detail.');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const text = await analyzeImage(prompt, image);
      setResult(text);
    } catch (error) {
      console.error(error);
      alert('Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
      <div className="space-y-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`aspect-video glass rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
            image ? 'border-transparent p-0' : 'border-slate-700 hover:border-indigo-500 p-8'
          }`}
        >
          {image ? (
            <img src={image} className="w-full h-full object-contain rounded-2xl" />
          ) : (
            <>
              <div className="text-4xl mb-4">📸</div>
              <p className="text-slate-400 font-medium">Click to upload or drop an image</p>
              <p className="text-xs text-slate-500 mt-2">Supports PNG, JPG, WEBP</p>
            </>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>

        <div className="glass rounded-3xl p-6 space-y-4">
          <label className="block text-sm font-medium text-slate-400">Analysis Prompt</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="Ask anything about the image..."
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !image}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-xl font-bold transition-all"
          >
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full min-h-[400px]">
        <div className="flex-1 glass rounded-3xl p-8 border border-white/5 overflow-y-auto">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">📝</span> Analysis Report
          </h3>
          {result ? (
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result}</p>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <p>Results will appear here after processing.</p>
            </div>
          )}
          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-4 bg-slate-800 rounded w-5/6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionGen;
