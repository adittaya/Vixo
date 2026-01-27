/**
 * Sentiment Analysis Utility for Customer Mood Detection
 * Analyzes customer messages to detect mood/emotion for better support
 */

interface SentimentResult {
  score: number; // -1 (very negative) to 1 (very positive)
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number; // 0 to 1
  keywords: string[];
}

// Define sentiment keywords for customer care context
const SENTIMENT_KEYWORDS = {
  positive: [
    'thank', 'thanks', 'great', 'good', 'excellent', 'happy', 'satisfied', 'pleased', 
    'amazing', 'awesome', 'love', 'perfect', 'wonderful', 'fantastic', 'brilliant',
    'helpful', 'appreciate', 'nice', 'kind', 'friendly', 'efficient', 'fast', 'quick'
  ],
  negative: [
    'angry', 'frustrated', 'disappointed', 'annoyed', 'mad', 'upset', 'sad', 'terrible',
    'awful', 'horrible', 'hate', 'worst', 'broken', 'failed', 'problem', 'issue', 'error',
    'can\'t', 'cannot', 'won\'t', 'doesn\'t', 'not working', 'bug', 'glitch', 'stuck',
    'delayed', 'missing', 'wrong', 'incorrect', 'confused', 'lost', 'scared', 'worried'
  ],
  neutral: [
    'hello', 'hi', 'hey', 'ok', 'okay', 'sure', 'yes', 'no', 'maybe', 'perhaps',
    'question', 'info', 'information', 'help', 'support', 'account', 'balance'
  ]
};

export const analyzeSentiment = (text: string): SentimentResult => {
  // Convert to lowercase and split into words
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  // Count sentiment words
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  const detectedKeywords: string[] = [];

  // Check for positive keywords
  SENTIMENT_KEYWORDS.positive.forEach(keyword => {
    const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
    const matches = text.match(regex);
    if (matches) {
      positiveCount += matches.length;
      detectedKeywords.push(...matches);
    }
  });

  // Check for negative keywords
  SENTIMENT_KEYWORDS.negative.forEach(keyword => {
    const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
    const matches = text.match(regex);
    if (matches) {
      negativeCount += matches.length;
      detectedKeywords.push(...matches);
    }
  });

  // Check for neutral keywords
  SENTIMENT_KEYWORDS.neutral.forEach(keyword => {
    const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
    const matches = text.match(regex);
    if (matches) {
      neutralCount += matches.length;
      detectedKeywords.push(...matches);
    }
  });

  // Calculate sentiment score (-1 to 1)
  let score = 0;
  if (words.length > 0) {
    // Normalize scores based on total sentiment-bearing words
    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords > 0) {
      score = (positiveCount - negativeCount) / totalSentimentWords;
    }
  }

  // Determine sentiment label
  let label: SentimentResult['label'] = 'neutral';
  if (score > 0.3) {
    label = score > 0.7 ? 'very_positive' : 'positive';
  } else if (score < -0.3) {
    label = score < -0.7 ? 'very_negative' : 'negative';
  }

  // Calculate confidence based on ratio of sentiment words to total words
  const confidence = Math.min(1, (positiveCount + negativeCount) / Math.max(1, words.length));

  return {
    score,
    label,
    confidence,
    keywords: Array.from(new Set(detectedKeywords)) // Remove duplicates
  };
};

// Enhanced function that also considers intensity modifiers
export const analyzeSentimentAdvanced = (text: string): SentimentResult => {
  // Basic sentiment analysis
  const basicResult = analyzeSentiment(text);
  
  // Look for intensity modifiers
  const intensityModifiers = {
    amplifiers: ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely'],
    reducers: ['somewhat', 'slightly', 'a little', 'bit', 'kind of', 'rather']
  };
  
  const lowerText = text.toLowerCase();
  let intensityMultiplier = 1;
  
  // Check for amplifiers
  intensityModifiers.amplifiers.forEach(modifier => {
    if (lowerText.includes(modifier)) {
      intensityMultiplier *= 1.5;
    }
  });
  
  // Check for reducers
  intensityModifiers.reducers.forEach(modifier => {
    if (lowerText.includes(modifier)) {
      intensityMultiplier *= 0.7;
    }
  });
  
  // Apply intensity multiplier to score (but cap it between -1 and 1)
  const adjustedScore = Math.max(-1, Math.min(1, basicResult.score * intensityMultiplier));
  
  // Determine new label based on adjusted score
  let label: SentimentResult['label'] = 'neutral';
  if (adjustedScore > 0.3) {
    label = adjustedScore > 0.7 ? 'very_positive' : 'positive';
  } else if (adjustedScore < -0.3) {
    label = adjustedScore < -0.7 ? 'very_negative' : 'negative';
  }
  
  return {
    ...basicResult,
    score: adjustedScore,
    label
  };
};

// Function to get appropriate response based on sentiment
export const getSentimentBasedResponse = (sentiment: SentimentResult, originalResponse: string): string => {
  switch (sentiment.label) {
    case 'very_negative':
      return `I understand you're feeling frustrated. ${originalResponse}`;
    
    case 'negative':
      return `I appreciate your feedback. ${originalResponse}`;
    
    case 'positive':
      return `Thank you for your positive feedback! ${originalResponse}`;
    
    case 'very_positive':
      return `Thank you for your wonderful feedback! ${originalResponse}`;
    
    default:
      return originalResponse;
  }
};