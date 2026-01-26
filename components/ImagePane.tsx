
import React, { useState } from 'react';
import { generateImage } from '../services/gemini';
import { GeneratedImage } from '../types';

const ImagePane: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);

    try {
      const url = await generateImage(prompt);
      if (url) {
        const newImg: GeneratedImage = {
          id: Math.random().toString(36).substr(2, 9),
          url,
          prompt,
          timestamp: new Date()
        };
        setGallery(prev => [newImg, ...prev]);
        setPrompt('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight">Image Studio</h2>
        <p className="text-zinc-500 text-sm">Create high-fidelity visuals using the Gemini 2.5 Flash Image engine. Perfect for assets, concepts, and creative sparks.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic cybernetic garden at sunset, cinematic lighting, 8k..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-2xl disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Crafting...</span>
              </>
            ) : (
              <span>Generate</span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {gallery.length === 0 && !loading && (
          <div className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600">
            <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Your creation gallery will appear here</p>
          </div>
        )}
        
        {loading && (
          <div className="aspect-square bg-zinc-900/50 rounded-3xl animate-pulse flex items-center justify-center border border-zinc-800">
             <div className="text-zinc-600 text-xs">Processing magic...</div>
          </div>
        )}

        {gallery.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
              <p className="text-xs text-zinc-300 line-clamp-2 italic mb-3">"{img.prompt}"</p>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[10px] py-2 rounded-lg border border-white/10 transition-colors uppercase tracking-widest font-bold">
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagePane;
