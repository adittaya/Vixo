/**
 * Language Detection and Translation Utility
 * Detects language and provides basic translation between Hindi and English
 */

// Common Hindi phrases and their English equivalents
const HINDI_ENGLISH_PHRASES: Record<string, string> = {
  // Greetings
  'namaste': 'hello',
  'aap kaise hain': 'how are you',
  'aap ka naam': 'your name',
  'dhanyavaad': 'thank you',
  'shukriya': 'thanks',
  'maaf kijiye': 'excuse me',
  'kripya': 'please',
  
  // Common support phrases
  'mujhe madad chahiye': 'i need help',
  'samasya': 'problem',
  'trouble': 'samasya',
  'issue': 'samasya',
  'password': 'password',
  'mera password': 'my password',
  'bhool gaya': 'forgot',
  'bhool gya': 'forgot',
  'bhool gai': 'forgot',
  'paisa': 'money',
  'raashi': 'amount',
  'khata': 'account',
  'balance': 'balance',
  'nikasi': 'withdrawal',
  'jama': 'deposit',
  'recharge': 'recharge',
  'investment': 'nivesh',
  'nivesh': 'investment',
  'customer care': 'g्राहक सेवा',
  'gраहक सेवा': 'customer care',
  
  // Numbers
  'ek': 'one',
  'do': 'two',
  'teen': 'three',
  'char': 'four',
  'paanch': 'five',
  'chhah': 'six',
  'saat': 'seven',
  'aath': 'eight',
  'nau': 'nine',
  'das': 'ten',
  
  // Emotions
  'khushi': 'happiness',
  'udas': 'sad',
  'gussa': 'anger',
  'chinta': 'worry',
  'dar': 'fear',
  'shant': 'calm',
};

// Function to detect if text is in Hindi
export const isHindiText = (text: string): boolean => {
  // Check if the text contains Devanagari script characters (Hindi)
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text);
};

// Function to detect language
export const detectLanguage = (text: string): 'hindi' | 'english' => {
  // Check for Hindi characters first
  if (isHindiText(text)) {
    return 'hindi';
  }

  // Check for common Hindi words in Roman script
  const lowerText = text.toLowerCase();
  let hindiWordCount = 0;
  let englishWordCount = 0;

  for (const hindiWord of Object.keys(HINDI_ENGLISH_PHRASES)) {
    if (lowerText.includes(hindiWord)) {
      hindiWordCount++;
    }
  }

  // Also check for common Hinglish patterns
  const hinglishIndicators = ['ka', 'ke', 'ki', 'hai', 'hain', 'tha', 'the', 'ho', 'kar', 'karo', 'karte', 'raha', 'rahe', 'rahi'];
  for (const indicator of hinglishIndicators) {
    if (lowerText.includes(indicator)) {
      hindiWordCount++;
    }
  }

  // Count English words for comparison
  const words = lowerText.split(/\s+/);
  for (const word of words) {
    if (/[a-z]+/.test(word)) {
      englishWordCount++;
    }
  }

  // If more Hindi/Hinglish indicators than English words, consider it Hindi
  if (hindiWordCount > englishWordCount * 0.5) {
    return 'hindi';
  }

  return 'english';
};

// Function to translate basic phrases
export const translateToEnglish = (text: string): string => {
  let translated = text.toLowerCase();
  
  // Replace known Hindi phrases with English equivalents
  for (const [hindi, english] of Object.entries(HINDI_ENGLISH_PHRASES)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp('\\b' + hindi + '\\b', 'gi');
    translated = translated.replace(regex, english);
  }
  
  return translated;
};

// Function to translate basic phrases to Hindi
export const translateToHindi = (text: string): string => {
  let translated = text.toLowerCase();
  
  // Replace known English phrases with Hindi equivalents
  for (const [hindi, english] of Object.entries(HINDI_ENGLISH_PHRASES)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp('\\b' + english + '\\b', 'gi');
    translated = translated.replace(regex, hindi);
  }
  
  return translated;
};

// Function to normalize text for processing
export const normalizeForProcessing = (text: string, targetLang: 'hindi' | 'english' = 'english'): string => {
  if (targetLang === 'english') {
    return translateToEnglish(text);
  }
  return text; // For now, we'll process everything in English internally
};

// Function to get appropriate response based on detected language
export const getResponseInUserLanguage = (userText: string, englishResponse: string): string => {
  const userLanguage = detectLanguage(userText);

  if (userLanguage === 'hindi') {
    // Enhance response with Hinglish elements to make it more relatable
    let hinglishResponse = englishResponse;

    // Add Hinglish elements to make the response more culturally appropriate
    hinglishResponse += "\n\nAgar aapko koi aur help chahiye, toh beshak batayein. Hum aapki madad ke liye hamesha tyar hain.";

    return hinglishResponse;
  }

  return englishResponse;
};