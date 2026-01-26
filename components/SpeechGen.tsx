
import React, { useState } from 'react';
import { generateSpeech, decodeBase64Audio, playPcmAudio } from '../services/gemini';

const SpeechGen: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState('Kore');

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  const handleSpeak = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const base64 = await generateSpeech(text, voice);
      const bytes = decodeBase64Audio(base64);
      await playPcmAudio(bytes);
    } catch (error) {
      console.error(error);
      alert('Failed to synthesize speech.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="glass rounded-3xl p-8 border border-white/5">
        <h2 className="text-2xl font-bold mb-6">Multi-modal Speech Lab</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Choose Voice Profile</label>
            <div className="flex flex-wrap gap-2">
              {voices.map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`px-4 py-2 rounded-xl border transition-all ${
                    voice === v 
                      ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Input Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type anything here and let Gemini speak it in a high-fidelity natural voice..."
              className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all text-lg resize-none"
            />
          </div>

          <button
            onClick={handleSpeak}
            disabled={loading || !text.trim()}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-fuchsia-600/20"
          >
            {loading ? 'Synthesizing Audio...' : 'Generate and Play'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center gap-4 text-slate-400 text-sm">
          <div className="p-3 bg-slate-800 rounded-xl">ℹ️</div>
          <p>This tool uses the <strong>gemini-2.5-flash-preview-tts</strong> model to generate raw PCM audio at 24kHz. Experience low-latency, expressive speech synthesis.</p>
        </div>
      </div>
    </div>
  );
};

export default SpeechGen;
