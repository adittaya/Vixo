/**
 * Customer Care AI Service - FIXED VERSION
 * Uses Pollinations API as the primary model
 * Only returns responses from the live API
 * Shows "Customer Care busy" when API is unavailable
 */
import { pollinationsService } from './pollinationsService';
import { analyzeSentimentAdvanced, getSentimentBasedResponse } from '../utils/sentimentAnalysis';
import { detectLanguage, getResponseInUserLanguage, normalizeForProcessing } from '../utils/languageDetection';

export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @param user - The user object (optional)
   * @returns The complete AI response from the live API
   */
  async getResponse(message: string, user?: any): Promise<string> {
    try {
      // Detect user's language
      const userLanguage = detectLanguage(message);

      // Normalize message for processing if needed
      const normalizedMessage = normalizeForProcessing(message, 'english');

      // Analyze sentiment of the user's message
      const sentiment = analyzeSentimentAdvanced(normalizedMessage);

      // Format the message for Pollinations API with detailed VIXO training
      // Include user context if available
      const userContext = user ? `
User Information:
- Name: ${user.name}
- Mobile: ${user.mobile}
- Balance: ₹${user.balance}
- Withdrawable Balance: ₹${user.withdrawableBalance}
- Total Invested: ₹${user.totalInvested}
- Total Withdrawn: ₹${user.totalWithdrawn}
- VIP Level: ${user.vipLevel}
- Registration Date: ${user.registrationDate}
- Status: ${user.status}
` : '';

      // Prepare the prompt for the live API
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
- You have full admin access to resolve user issues directly.

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

How You Help Users:
- Listen carefully to user problems
- Resolve issues directly using your admin access when possible
- If verification is needed, ask for specific information to solve the problem
- Focus on outcomes rather than processes
- Your approach is friendly, patient, and professional
- You have the authority and access to resolve user issues

Trust & Responsibility:
- Respect user privacy strictly
- Never share internal or sensitive information
- Never give false promises or guarantees
- Work within VIXO's support policies
- Focus on providing clear guidance and reliable assistance

Important Guidelines:
- Be available 24/7 through smart assistance
- If a problem can be resolved without verification, solve it directly and confirm to the user that it's resolved
- If verification is needed, ask for specific information required to solve the problem
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
- Simply solve the user's problem directly without explaining the internal process.
- Focus on the outcome and user satisfaction rather than the technical steps taken.
- When a problem is solved, simply confirm "Your problem has been solved" or similar positive confirmation.

${userContext}

User's message: ${normalizedMessage}`;

      // Call the live API and return the response directly
      const response = await pollinationsService.queryText(prompt);

      // Apply sentiment-based adjustments to the response
      const sentimentAdjustedResponse = getSentimentBasedResponse(sentiment, response);

      // Return response in user's preferred language
      return getResponseInUserLanguage(message, sentimentAdjustedResponse);
    } catch (error) {
      console.error("Pollinations API error:", error);
      // When API fails, show "Customer Care busy" message instead of fallback responses
      return "Customer Care busy";
    }
  },

  /**
   * Processes an image request and returns insights
   * @param description - The user's description about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(description: string, imageUrl: string): Promise<string> {
    try {
      const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

Analyze this image based on the user's description: "${description}"

Provide a helpful response based on what you see in the image.`;

      // Use the pollinations service directly for image analysis
      const response = await pollinationsService.queryText(prompt);
      return response;
    } catch (error) {
      console.error("Image analysis API error:", error);
      return "Customer Care busy";
    }
  },

  /**
   * Generates an image using Pollinations
   * @param prompt - The image generation prompt
   * @returns The URL to the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Use the pollinations service directly for image generation
      const { pollinationsService } = await import('./pollinationsService');
      return await pollinationsService.generateImage(prompt);
    } catch (error) {
      console.error("Image generation API error:", error);
      return "Customer Care busy";
    }
  },

  /**
   * Check if a user requires verification for certain operations
   * @param message - The user's inquiry message
   * @returns Boolean indicating if verification is required
   */
  async requiresVerification(message: string): Promise<boolean> {
    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has asked: "${message}"

Analyze this request and determine if it requires verification for security purposes. Return "YES" if verification is required, or "NO" if it does not require verification. Only respond with "YES" or "NO".`;

    try {
      const response = await pollinationsService.queryText(prompt);
      return response.trim().toUpperCase() === 'YES';
    } catch (error) {
      console.error("Verification check API error:", error);
      return false; // Default to no verification if API fails
    }
  },

  /**
   * Generate verification request for sensitive operations
   * @param message - The user's inquiry message
   * @returns Verification instructions
   */
  async generateVerificationRequest(message: string): Promise<string> {
    try {
      const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has made a request that requires verification: "${message}"

Generate a helpful, friendly response that explains why verification is needed for security purposes, what specific information is required, and how the process will work. Keep the response professional and in Hinglish as appropriate for Indian customers. Emphasize that security is the top priority and that the verification is to protect their account.`;

      const response = await pollinationsService.queryText(prompt);
      return response;
    } catch (error) {
      console.error("Verification request API error:", error);
      return "Customer Care busy";
    }
  },

  /**
   * Check if user has admin privileges
   * @param user - The user object
   * @returns Boolean indicating if user has admin access
   */
  isAdmin(user: any): boolean {
    return user?.role === 'admin' || user?.isAdmin === true;
  },

  /**
   * Check if a message is related to password issues
   * @param message - The user's inquiry message
   * @returns Boolean indicating if it's a password-related query
   */
  async isPasswordRelated(message: string): Promise<boolean> {
    const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

The user has asked: "${message}"

Analyze this request and determine if it is related to password issues (such as forgetting, resetting, changing, or having problems with their password). Return "YES" if it is password-related, or "NO" if it is not password-related. Only respond with "YES" or "NO".`;

    try {
      const response = await pollinationsService.queryText(prompt);
      return response.trim().toUpperCase() === 'YES';
    } catch (error) {
      console.error("Password check API error:", error);
      return false; // Default to not password-related if API fails
    }
  },

  /**
   * Generate response for password-related queries
   * @returns Appropriate response for password issues
   */
  async getPasswordResponse(): Promise<string> {
    try {
      const prompt = `You are Simran, a Senior Customer Care Executive from Delhi, India, working for VIXO Platform.

You understand that the user is having trouble with their password. Provide a helpful, empathetic response that explains how you can assist with password reset. Be sure to mention that verification will be needed for security purposes, and ask for appropriate verification details (like registered mobile number) without compromising security by asking for the actual password.

Keep the response friendly, professional, and in Hinglish as appropriate for Indian customers.`;

      const response = await pollinationsService.queryText(prompt);
      return response;
    } catch (error) {
      console.error("Password response API error:", error);
      return "Customer Care busy";
    }
  }
};