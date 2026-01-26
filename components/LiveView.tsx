
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

// --- Helpers for Audio ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{role: string, text: string}[]>([]);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(20).fill(10));
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ input: '', output: '' });

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
  }, []);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };
      
      nextStartTimeRef.current = 0;
      setIsActive(true);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple Visualizer update
              const avg = inputData.reduce((a, b) => a + Math.abs(b), 0) / inputData.length;
              setVisualizerData(prev => [...prev.slice(1), Math.max(10, avg * 300)]);

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };

              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.output += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.input += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const input = transcriptionRef.current.input;
              const output = transcriptionRef.current.output;
              if (input || output) {
                setTranscriptions(prev => [...prev, 
                  { role: 'You', text: input }, 
                  { role: 'Gemini', text: output }
                ]);
              }
              transcriptionRef.current = { input: '', output: '' };
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const { output: oCtx } = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, oCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), oCtx, 24000, 1);
              const source = oCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(oCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            stopSession();
          },
          onclose: () => {
            console.log('Live session closed');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are Gemini Live, a friendly AI companion. Keep your responses conversational and brief.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      alert('Microphone access or connection failed.');
      setIsActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Live Interaction</h2>
          <p className="text-slate-400 mt-2">Low-latency, natural voice conversation powered by Gemini 2.5 Native Audio.</p>
        </div>

        <div className="flex-1 glass rounded-3xl border-slate-700/50 mb-8 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          {/* Background Ambient Glow */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-30' : 'opacity-0'}`}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse"></div>
          </div>

          {!isActive ? (
            <div className="text-center z-10">
              <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-500/30">
                <i className="fa-solid fa-microphone text-4xl text-emerald-400"></i>
              </div>
              <h3 className="text-xl font-bold mb-4">Ready to talk?</h3>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">Click the button below to start a real-time conversation. Please allow microphone access.</p>
              <button 
                onClick={startSession}
                className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-600/20"
              >
                Start Live Session
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col h-full z-10">
               <div className="flex-1 flex flex-col items-center justify-center mb-8">
                  {/* Visualizer */}
                  <div className="flex items-center gap-1.5 h-32">
                    {visualizerData.map((val, i) => (
                      <div 
                        key={i} 
                        className="w-2 bg-emerald-500 rounded-full transition-all duration-75 shadow-lg shadow-emerald-500/50"
                        style={{ height: `${val}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-emerald-400 font-bold mt-12 tracking-widest uppercase text-xs animate-pulse">Session Active</p>
               </div>

               <div className="h-48 overflow-y-auto bg-slate-900/50 rounded-2xl p-4 border border-slate-800 scrollbar-hide text-sm space-y-3">
                 {transcriptions.length === 0 && <p className="text-slate-500 italic text-center py-4">Transcript will appear here...</p>}
                 {transcriptions.map((t, i) => (
                   <div key={i} className="flex gap-2">
                     <span className={`font-bold uppercase text-[10px] w-12 pt-1 ${t.role === 'You' ? 'text-blue-400' : 'text-emerald-400'}`}>{t.role}:</span>
                     <span className="text-slate-300">{t.text}</span>
                   </div>
                 ))}
               </div>

               <button 
                onClick={stopSession}
                className="mt-8 px-12 py-4 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 rounded-2xl font-bold transition-all mx-auto"
              >
                End Conversation
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 glass rounded-2xl border-slate-800">
            <i className="fa-solid fa-bolt text-emerald-400 mb-2"></i>
            <p className="text-xs text-slate-400 uppercase font-bold">Latency</p>
            <p className="text-sm font-bold">~200ms</p>
          </div>
          <div className="p-4 glass rounded-2xl border-slate-800">
            <i className="fa-solid fa-volume-high text-blue-400 mb-2"></i>
            <p className="text-xs text-slate-400 uppercase font-bold">Voice</p>
            <p className="text-sm font-bold">Zephyr</p>
          </div>
          <div className="p-4 glass rounded-2xl border-slate-800">
            <i className="fa-solid fa-closed-captioning text-purple-400 mb-2"></i>
            <p className="text-xs text-slate-400 uppercase font-bold">Text Out</p>
            <p className="text-sm font-bold">Enabled</p>
          </div>
          <div className="p-4 glass rounded-2xl border-slate-800">
            <i className="fa-solid fa-shield-halved text-pink-400 mb-2"></i>
            <p className="text-xs text-slate-400 uppercase font-bold">Privacy</p>
            <p className="text-sm font-bold">Secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveView;
