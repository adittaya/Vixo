
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImageResult } from '../types';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setResults(prev => [{
          id: Date.now().toString(),
          url: imageUrl,
          prompt: prompt
        }, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Image Creator</h2>
          <p className="text-slate-400 mt-2">Transform your imagination into visual reality with Gemini 2.5 Flash Image.</p>
        </div>

        <div className="glass p-6 rounded-3xl border-slate-700/50 mb-10 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to see... (e.g., A cyberpunk city floating in the clouds, oil painting style)"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner text-lg"
                onKeyDown={(e) => e.key === 'Enter' && generateImage()}
              />
            </div>
            <button
              onClick={generateImage}
              disabled={!prompt.trim() || isGenerating}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  Create Image
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isGenerating && (
            <div className="aspect-square glass rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-6 text-center animate-pulse">
              <i className="fa-solid fa-image text-4xl text-slate-700 mb-4"></i>
              <p className="text-slate-500 font-medium">Coming to life...</p>
            </div>
          )}
          {results.map((img) => (
            <div key={img.id} className="group relative glass rounded-3xl border-slate-700/50 overflow-hidden shadow-xl">
              <img 
                src={img.url} 
                alt={img.prompt} 
                className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                <p className="text-sm font-medium line-clamp-3 mb-4">{img.prompt}</p>
                <div className="flex gap-2">
                  <a 
                    href={img.url} 
                    download={`gemini-studio-${img.id}.png`}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg text-center text-xs font-bold transition-colors"
                  >
                    Download
                  </a>
                  <button 
                    onClick={() => navigator.clipboard.writeText(img.prompt)}
                    className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg transition-colors"
                  >
                    <i className="fa-solid fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isGenerating && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <i className="fa-regular fa-images text-6xl mb-4 opacity-20"></i>
            <p className="text-xl font-medium opacity-40">Your gallery is empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageView;
