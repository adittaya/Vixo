
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { VideoResult } from '../types';

// Removed manual 'declare global' for 'aistudio' as it conflicts with pre-existing 
// 'AIStudio' type definitions provided by the environment, causing type mismatch errors.

const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // Accessing pre-configured aistudio object via window casting to avoid conflicting declarations
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();
  }, []);

  const handleKeySelect = async () => {
    // Trigger the API key selection dialog as required by the Veo video generation process
    await (window as any).aistudio.openSelectKey();
    // Assume selection was successful to mitigate race conditions where hasSelectedApiKey() might not update immediately
    setHasKey(true);
  };

  const generateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationStep('Initiating request...');
    
    try {
      // Create a new GoogleGenAI instance right before the API call to ensure use of the most up-to-date API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      setGenerationStep('Submitting to Veo... This may take a minute.');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      // Poll the operation until completion
      while (!operation.done) {
        setGenerationStep('Rendering cinematic sequence...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setGenerationStep('Finalizing video file...');
        // Append the API key to the download URL when fetching the video bytes
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);

        setResults(prev => [{
          id: Date.now().toString(),
          url: videoUrl,
          prompt: prompt
        }, ...prev]);
        setPrompt('');
      }
    } catch (error: any) {
      console.error(error);
      // If the request fails due to key issues, reset the state and prompt the user to re-select
      if (error?.message?.includes('Requested entity was not found')) {
        setHasKey(false);
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
      } else {
        alert('Failed to generate video. High-quality video generation can be demanding on API resources.');
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  if (hasKey === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <div className="w-20 h-20 bg-pink-600/10 rounded-3xl flex items-center justify-center mb-6">
          <i className="fa-solid fa-key text-3xl text-pink-500"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Video Generation Requires a Paid Key</h2>
        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          To use the high-performance Veo 3.1 model, you must select an API key from a billing-enabled Google Cloud project.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={handleKeySelect}
            className="w-full py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
          >
            Select API Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline font-medium"
          >
            Learn about Gemini API billing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">Cinematic Video</h2>
          <p className="text-slate-400 mt-2">Generate high-quality video clips from text with Veo 3.1 Fast.</p>
        </div>

        <div className="glass p-6 rounded-3xl border-slate-700/50 mb-10 shadow-2xl">
          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene in detail... (e.g., A slow cinematic tracking shot of a futuristic greenhouse with bioluminescent plants)"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all shadow-inner text-lg resize-none"
              rows={2}
            />
            <button
              onClick={generateVideo}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  {generationStep || 'Processing...'}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-film"></i>
                  Generate Video
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isGenerating && (
            <div className="aspect-video glass rounded-3xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-6 text-center animate-pulse">
              <div className="relative">
                <i className="fa-solid fa-clapperboard text-5xl text-slate-700 mb-6"></i>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-slate-300 font-semibold text-lg">{generationStep}</p>
              <p className="text-slate-500 text-sm mt-2">This usually takes 30-60 seconds</p>
            </div>
          )}

          {results.map((vid) => (
            <div key={vid.id} className="glass rounded-3xl border-slate-700/50 overflow-hidden shadow-2xl">
              <video 
                src={vid.url} 
                controls 
                className="w-full aspect-video bg-black"
                poster="https://picsum.photos/800/450"
              />
              <div className="p-6">
                <p className="text-sm font-medium text-slate-300 leading-relaxed italic">"{vid.prompt}"</p>
                <div className="mt-4 flex gap-3">
                  <a 
                    href={vid.url} 
                    download={`gemini-veo-${vid.id}.mp4`}
                    className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 rounded-xl text-center text-sm font-bold transition-colors"
                  >
                    Download MP4
                  </a>
                  <button 
                    onClick={() => {
                      setPrompt(vid.prompt);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                    title="Reuse Prompt"
                  >
                    <i className="fa-solid fa-rotate-right"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isGenerating && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <i className="fa-solid fa-video-slash text-6xl mb-4 opacity-20"></i>
            <p className="text-xl font-medium opacity-40">No videos generated yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoView;
