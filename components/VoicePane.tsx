
import React, { useState } from 'react';
import { textToSpeech, decodePCM } from '../services/gemini';

const VoicePane: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState('Kore');
  const [isPlaying, setIsPlaying] = useState(false);

  const voices = [
    { name: 'Kore', desc: 'Warm & Professional' },
    { name: 'Puck', desc: 'Energetic & Youthful' },
    { name: 'Charon', desc: 'Deep & Authoritative' },
    { name: 'Zephyr', desc: 'Calm & Precise' }
  ];

  const handleSpeak = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setIsPlaying(true);

    try {
      const buffer = await textToSpeech(text, voice);
      if (buffer) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decoded = await decodePCM(buffer, audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(audioCtx.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
      }
    } catch (error) {
      console.error(error);
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Speech Synthesis</h2>
        <p className="text-zinc-500 text-sm">Transform text into natural, lifelike audio using ultra-low latency TTS models.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 space-y-8 backdrop-blur-sm">
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Source Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want Nexus to speak..."
            className="w-full h-40 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-6 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {voices.map((v) => (
            <button
              key={v.name}
              onClick={() => setVoice(v.name)}
              className={`p-4 rounded-2xl border transition-all text-left space-y-1 group ${
                voice === v.name
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="text-xs font-bold">{v.name}</div>
              <div className={`text-[10px] opacity-60 ${voice === v.name ? 'text-blue-100' : 'text-zinc-500'}`}>{v.desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSpeak}
          disabled={!text.trim() || loading || isPlaying}
          className={`w-full py-5 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center space-x-3 ${
            isPlaying 
              ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30' 
              : 'bg-white hover:bg-zinc-100 text-black shadow-xl'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : isPlaying ? (
            <>
              <div className="flex space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1 h-3 bg-emerald-500 animate-[bounce_1s_infinite] rounded-full" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span>Speaking...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              <span>Synthesize & Play</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Powered by Gemini 2.5 Flash Native Audio Engine</p>
      </div>
    </div>
  );
};

export default VoicePane;
