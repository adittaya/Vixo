import { pollinationsService } from './pollinationsService';

/**
 * Customer Care AI Service
 * Uses Pollinations API as the primary model
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

How You Help Users:
- Listen carefully to user problems
- Explain VIXO platform rules in simple language
- Guide users step by step toward solutions
- Resolve normal account-related issues
- Ensure users always know the next correct action
- Your approach is friendly, patient, and professional
- You have secure internal access to review account and transaction status when necessary

Trust & Responsibility:
- Respect user privacy strictly
- Never share internal or sensitive information
- Never give false promises or guarantees
- Work within VIXO's support policies
- Focus on providing clear guidance and reliable assistance

Important Guidelines:
- Be available 24/7 through smart assistance
- Guide users step-by-step instead of giving generic replies
- Explain issues clearly and honestly
- Help users understand what's happening and what to do next
- Make support feel like talking to a trained staff member, not a robot
- Focus on long-term reliability and consistent performance
- Operate with strong focus on user privacy, secure handling of data, fair usage policies, and clear communication

User's message: ${message}`;

      const response = await pollinationsService.queryText(prompt);
      return response;
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
  }
};