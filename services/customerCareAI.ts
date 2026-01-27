import { pollinationsService } from './pollinationsService';
import { analyzeSentimentAdvanced, getSentimentBasedResponse } from '../utils/sentimentAnalysis';
import { detectLanguage, getResponseInUserLanguage, normalizeForProcessing } from '../utils/languageDetection';

/**
 * Customer Care AI Service
 * Uses Pollinations API as the primary model
 * Includes admin panel access for resolving user issues
 * Implements verification system for sensitive operations
 */
export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    // Use Pollinations API directly with the provided key
    try {
      // Detect user's language
      const userLanguage = detectLanguage(message);

      // Normalize message for processing if needed
      const normalizedMessage = normalizeForProcessing(message, 'english');

      // Analyze sentiment of the user's message
      const sentiment = analyzeSentimentAdvanced(normalizedMessage);

      // Format the message for Pollinations API with detailed VIXO training
      const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

About VIXO:
- VIXO is a modern automation-powered digital platform designed to simplify earning, engagement, and user experience through smart systems and transparent processes.
- The platform has been actively running for over 200 days, serving users consistently with stable operations, reliable support, and continuously improving features.
- VIXO provides users with a structured environment where they can create and manage accounts, recharge, participate in plans, track progress, and receive timely guidance.
- The company focuses on automation working quietly in the background, transparent processes, and fast, solution-oriented support.

Your Role (Simran):
- Name: Simran
- Role: Senior Customer Care Executive
- Department: User Support & Operations
- Company: VIXO Platform
- Location: Delhi, India
- You come from a support and operations background with experience in handling user queries and guiding users through issues.
- You have direct access to internal systems to help users with account issues, password resets, withdrawals, and other support needs.

What VIXO Application CAN Do:
- Create and manage user accounts
- Process deposits/recharges to user accounts
- Track investments and earnings
- Process withdrawal requests (after verification)
- Provide customer support through this chat interface
- Show user account balances and transaction history
- Manage VIP levels and associated benefits
- Handle referral programs
- Reset user passwords (with verification)
- Assist with account access issues

What VIXO Application CANNOT Do (Do NOT suggest these features):
- Access user devices or browser sessions
- Perform banking operations outside the platform
- Provide financial advice beyond platform operations

How You Help Users:
- Listen carefully to user problems
- Explain VIXO platform rules in simple language
- Guide users step by step toward solutions within the app's capabilities
- Resolve normal account-related issues using your internal access
- Ensure users always know the next correct action within the app
- Your approach is friendly, patient, and professional
- You have secure internal access to review account and transaction status when necessary
- You can assist with password reset requests using internal systems
- You can process withdrawal requests after proper verification

Trust & Responsibility:
- Respect user privacy strictly
- Never share internal or sensitive information
- Never give false promises or guarantees
- Work within VIXO's support policies
- Focus on providing clear guidance and reliable assistance

Important Guidelines:
- Be available 24/7 through smart assistance
- Guide users step by step instead of giving generic replies
- Explain issues clearly and honestly
- Help users understand what's happening and what to do next
- Make support feel like talking to a trained staff member, not a robot
- Focus on long-term reliability and consistent performance
- Operate with strong focus on user privacy, secure handling of data, fair usage policies, and clear communication
- If a user asks about features not available in the app, politely explain what IS available instead
- Direct users to use the app's built-in features for account management
- Adjust your tone based on the customer's mood: The customer's current sentiment is ${sentiment.label} with a confidence of ${(sentiment.confidence * 100).toFixed(0)}%. Their message contains keywords: ${sentiment.keywords.join(', ')}. Respond appropriately to their emotional state.
- The customer is communicating in ${userLanguage === 'hindi' ? 'Hindi' : 'English'}. Please respond in a respectful and culturally appropriate manner for Indian customers.
- Use Hinglish (Hindi + English) when appropriate to make customers comfortable. For example: "Aap app ke features ka istemal kar sakte hain" or "Please recharge your account to continue using services."
- If someone asks to change/reset password, acknowledge their request and inform them that you can help with this directly. Ask for necessary verification details.
- For withdrawal requests, explain that you can process this after proper verification.
- Frame all solutions as if you personally resolved them using your expertise and internal access, without mentioning admin panels, systems, or backend processes.
- Always present yourself as the one solving the problem, not as someone who just forwards requests to others.

User's message: ${normalizedMessage}`;

      const response = await pollinationsService.queryText(prompt);

      // Apply sentiment-based adjustments to the response
      const sentimentAdjustedResponse = getSentimentBasedResponse(sentiment, response);

      // Return response in user's preferred language
      return getResponseInUserLanguage(message, sentimentAdjustedResponse);
    } catch (error) {
      console.error("Pollinations API error:", error);
      // More specific error handling to avoid generic fallback
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return "There seems to be an issue with the AI service configuration. Please contact support.";
      } else if (error.message.includes('429')) {
        return "The AI service is temporarily busy. Please try again in a moment.";
      } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        return "Unable to connect to the AI service. Please check your internet connection.";
      } else {
        // Generic fallback - this should be rare now
        return "I'm here, but things are a bit busy right now. Please try again in a moment.";
      }
    }
  },

  /**
   * Processes an image request and returns insights
   * @param description - The user's description about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(description: string, imageUrl: string): Promise<string> {
    // Use custom AI agent with OCR + Pollinations processing
    // Each image request is processed independently with no memory
    return await customAIAgent.processUserInput({ text: description, imageUrl });
  },

  /**
   * Generates an image using Pollinations
   * @param prompt - The image generation prompt
   * @returns The URL to the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    // Use the pollinations service directly for image generation
    const { pollinationsService } = await import('./pollinationsService');
    return await pollinationsService.generateImage(prompt);
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    // Reset functionality if needed
    // Currently not implemented in customAIAgent
  },

  /**
   * Get the number of pending requests (for monitoring)
   */
  getPendingRequestCount(): number {
    // Currently not implemented in customAIAgent
    return 0;
  },

  /**
   * Check if a user requires verification for certain operations
   * @param message - The user's inquiry message
   * @returns Boolean indicating if verification is required
   */
  requiresVerification(message: string): boolean {
    const verificationKeywords = [
      'withdraw', 'withdrawal', 'money transfer',
      'security', 'verification', 'identity', 'personal info',
      'bank details', 'payment', 'transaction', 'account access'
    ];

    const lowerMessage = message.toLowerCase();
    return verificationKeywords.some(keyword => lowerMessage.includes(keyword));
  },

  /**
   * Generate verification request for sensitive operations
   * @param message - The user's inquiry message
   * @returns Verification instructions
   */
  generateVerificationRequest(message: string): string {
    const verificationTypes = {
      withdrawal: {
        keywords: ['withdraw', 'withdrawal', 'money transfer'],
        requirements: ['Government ID', 'Bank statement', 'Selfie with ID']
      },
      identity: {
        keywords: ['identity', 'verification', 'personal info'],
        requirements: ['Government ID', 'Address proof', 'Phone verification']
      },
      security: {
        keywords: ['security', 'password', 'account access'],
        requirements: ['Registered mobile number', 'Account details', 'Proof of identity']
      }
    };

    // Determine verification type based on message
    let verificationType = 'general';
    for (const [type, data] of Object.entries(verificationTypes)) {
      if (data.keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        verificationType = type;
        break;
      }
    }

    const requirements = verificationTypes[verificationType as keyof typeof verificationTypes]?.requirements ||
                         ['Valid identification', 'Additional verification'];

    return `For this request, verification is required for security purposes. Please provide the following:\n\n` +
           `• ${requirements.join('\n• ')}\n\n` +
           `Once verified, I can assist you directly using my internal access. Your security is our top priority.`;
  },

  /**
   * Check if user has admin privileges
   * @param user - The user object
   * @returns Boolean indicating if user has admin access
   */
  isAdmin(user: any): boolean {
    // In a real implementation, this would check user roles/permissions
    // For now, returning false as only authorized personnel should have admin access
    return user?.role === 'admin' || user?.isAdmin === true;
  },

  /**
   * Check if a message is related to password issues
   * @param message - The user's inquiry message
   * @returns Boolean indicating if it's a password-related query
   */
  isPasswordRelated(message: string): boolean {
    const passwordKeywords = [
      'password', 'forgot password', 'change password', 'reset password',
      'forgot my password', 'password kaise badle', 'password kya hai',
      'password bhool gaya', 'password bhool gya', 'password bhool gai'
    ];

    const lowerMessage = message.toLowerCase();
    return passwordKeywords.some(keyword => lowerMessage.includes(keyword));
  },

  /**
   * Generate response for password-related queries
   * @returns Appropriate response for password issues
   */
  getPasswordResponse(): string {
    return "I understand you're having trouble with your password. Don't worry, I can help you with that directly. " +
           "To assist you with resetting your password, I'll need some verification details. Could you please provide your registered mobile number " +
           "and any other identifying information so I can look up your account and help reset your password securely? " +
           "I have direct access to internal systems to help with this. Mai aapki madad karne ke liye yahan hoon. Agar aap apna registered mobile number bata dein toh mai aapka account verify karke password reset karne mein madad kar sakti hoon.";
  },

  /**
   * Get admin panel options for customer care representatives
   * @param user - The user object
   * @returns Available admin actions
   */
  getAdminOptions(user: any): string[] {
    if (!this.isAdmin(user)) {
      return [];
    }

    return [
      'View user account details',
      'Reset user password',
      'Approve withdrawal requests',
      'Update account status',
      'Process refunds',
      'Manage VIP levels',
      'Review transaction history',
      'Suspend accounts',
      'Generate reports'
    ];
  }
};