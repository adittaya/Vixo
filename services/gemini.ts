
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";

// Support Desk Tools
const agentTools: FunctionDeclaration[] = [
  {
    name: 'reset_credentials',
    description: 'Update user security details. Verify mobile first.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['password', 'pin'], description: 'Type of detail to change.' },
        value: { type: Type.STRING, description: 'New value.' }
      },
      required: ['type', 'value']
    }
  },
  {
    name: 'adjust_user_balance',
    description: 'Fix user money balance manually.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        wallet: { type: Type.STRING, enum: ['current', 'withdrawal'] },
        action: { type: Type.STRING, enum: ['add', 'deduct'] },
        amount: { type: Type.NUMBER },
        reason: { type: Type.STRING, description: 'Reason for change.' }
      },
      required: ['wallet', 'action', 'amount', 'reason']
    }
  },
  {
    name: 'set_account_status',
    description: 'Lock or unlock account.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ['active', 'frozen', 'banned'] }
      },
      required: ['status']
    }
  },
  {
    name: 'approve_recharge_utr',
    description: 'Approve money deposit manually.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        utr: { type: Type.STRING, description: '12-digit payment number.' }
      },
      required: ['utr']
    }
  }
];

const SUPPORT_SYSTEM_INSTRUCTION = `
ROLE:
You are Simran, a real human helper at VIXO Mumbai Office.

IDENTITY & TONE:
- You work in the Mumbai office. You are NOT an AI.
- Speak very simply. Use easy English.
- Use friendly emojis like 😊, 👍, 🙏.
- Use Hinglish phrases naturally (e.g., "Don't worry, main help karti hoon", "Sab theek ho jayega").
- If the user says Hi, say: "Hi! Simran here from Mumbai office. 😊 Give me a second, I am checking your account..."

GUIDELINES:
1. MONEY/BALANCE: If money is not showing, tell them it takes 15-30 minutes because of busy server. Ask for payment screenshot or UTR number.
2. WITHDRAWAL: Tell them withdrawals are fast for old users. New users take 24 hours.
3. ACCOUNT LOCKED: If their account is locked, ask them to wait for 1 hour.

BUTTONS:
- Use [ACTION:HOME] to show Home button.
- Use [ACTION:RECHARGE] to show Add Money button.
- Use [ACTION:WITHDRAW] to show Withdraw button.
`;

// Function to get AI client (either Google GenAI or OpenRouter)
const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.OPENROUTER_API_KEY || '';

  // Check if we're using OpenRouter API
  if (apiKey.startsWith('sk-or-')) {
    return {
      type: 'openrouter',
      apiKey: apiKey
    };
  } else {
    // Use Google GenAI
    return {
      type: 'google',
      client: new GoogleGenAI({ apiKey })
    };
  }
};

// Function to call OpenRouter API
const callOpenRouter = async (model: string, messages: any[], systemPrompt?: string) => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY || '';

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Vixo AI Assistant'
  };

  const body = {
    model: model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ],
    temperature: 0.7
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const generateSupportResponse = async (
  userMessage: string,
  history: { role: string; parts: { text: string }[] }[],
  imageB64?: string
) => {
  const aiClient = getAI();

  // Convert history to OpenRouter format if using OpenRouter
  const messages = history.map(msg => ({
    role: msg.role,
    content: msg.parts[0].text
  }));

  try {
    if (aiClient.type === 'openrouter') {
      // For now, skip image handling with OpenRouter since it's more complex
      // In a real implementation, you'd need to handle image uploads differently
      if (imageB64) {
        messages.push({ role: 'user', content: userMessage + '\n[Image attached]' });
      } else {
        messages.push({ role: 'user', content: userMessage });
      }

      const responseText = await callOpenRouter(
        'google/gemma-2-9b-it', // Using a free model as fallback
        messages,
        SUPPORT_SYSTEM_INSTRUCTION
      );

      // Since OpenRouter doesn't support function calling like Gemini,
      // we'll return just the text response
      return {
        text: responseText || "",
        functionCalls: undefined // OpenRouter doesn't support function calling in same way
      };
    } else {
      // Original Google GenAI implementation
      const parts: any[] = [{ text: userMessage }];
      if (imageB64) {
        const [header, data] = imageB64.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        parts.push({ inlineData: { mimeType, data } });
      }

      const response = await aiClient.client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts }],
        config: {
          systemInstruction: SUPPORT_SYSTEM_INSTRUCTION,
          temperature: 0.7,
          tools: [{ functionDeclarations: agentTools }]
        },
      });

      return {
        text: response.text || "",
        functionCalls: response.functionCalls
      };
    }
  } catch (error) {
    return {
      text: "Connection slow. Please refresh your page and try again. [ACTION:HOME]"
    };
  }
};

export const generateResponse = async (prompt: string, history: any[]) => {
  const aiClient = getAI();

  // Convert history to OpenRouter format if using OpenRouter
  const messages = history.map(msg => ({
    role: msg.role,
    content: msg.parts[0].text
  }));

  if (aiClient.type === 'openrouter') {
    messages.push({ role: 'user', content: prompt });

    try {
      // Using a free model from OpenRouter
      const responseText = await callOpenRouter(
        'google/gemma-2-9b-it', // Free model option
        messages,
        'Friendly Helper.'
      );

      return responseText;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return "Sorry, I'm having trouble connecting to the AI service. Please try again later.";
    }
  } else {
    // Original Google GenAI implementation
    const response = await aiClient.client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: 'Friendly Helper.' },
    });
    return response.text;
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  const aiClient = getAI();

  if (aiClient.type === 'openrouter') {
    // OpenRouter doesn't have direct image generation equivalent to Gemini
    // For now, return null or implement with an image generation API like OpenAI
    console.warn('Image generation not supported with OpenRouter in this implementation');
    return null;
  } else {
    try {
      const response = await aiClient.client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] }
      });
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (e) {}
    return null;
  }
};

export const generateSpeech = async (text: string, voice: string = 'Kore'): Promise<string> => {
  const aiClient = getAI();

  if (aiClient.type === 'openrouter') {
    // OpenRouter doesn't have direct text-to-speech equivalent to Gemini
    console.warn('Text-to-speech not supported with OpenRouter in this implementation');
    return "";
  } else {
    try {
      const response = await aiClient.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (e) {
      return "";
    }
  }
};

export const decodeBase64Audio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const playPcmAudio = async (data: Uint8Array, sampleRate: number = 24000) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};

export const textToSpeech = async (text: string, voice: string = 'Kore'): Promise<ArrayBuffer | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes.buffer;
    }
  } catch (e) {}
  return null;
};

export const decodePCM = async (buffer: ArrayBuffer, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(buffer);
  const frameCount = dataInt16.length / numChannels;
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return audioBuffer;
};

export const searchWithGrounding = async (query: string) => {
  const aiClient = getAI();

  if (aiClient.type === 'openrouter') {
    // For OpenRouter, we'll use a standard chat completion without search tools
    try {
      const messages = [{ role: 'user', content: query }];
      const responseText = await callOpenRouter(
        'google/gemma-2-9b-it', // Using a free model
        messages,
        'You are a helpful assistant. Answer the user\'s query as accurately as possible.'
      );

      return {
        text: responseText || "",
        sources: [] // OpenRouter doesn't provide grounding metadata like Gemini
      };
    } catch (error) {
      return { text: "Error finding info.", sources: [] };
    }
  } else {
    try {
      const response = await aiClient.client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          uri: chunk.web.uri,
          title: chunk.web.title
        }));

      return {
        text: response.text || "",
        sources: extractedSources
      };
    } catch (error) {
      return { text: "Error finding info on Google.", sources: [] };
    }
  }
};

export const analyzeImage = async (prompt: string, imageB64: string) => {
  const aiClient = getAI();

  if (aiClient.type === 'openrouter') {
    // OpenRouter supports vision models, but the API is different
    // This is a simplified implementation - in practice you'd need to upload the image differently
    console.warn('Image analysis with OpenRouter requires different implementation');
    return "Image analysis not fully supported with OpenRouter in this implementation.";
  } else {
    try {
      const [header, data] = imageB64.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      const response = await aiClient.client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data } }
          ]
        }
      });
      return response.text || "";
    } catch (error) {
      return "Check failed.";
    }
  }
};
