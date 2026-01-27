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
      // Format the message for Pollinations API
      const prompt = `You are a helpful customer care assistant for VIXO investment platform.
      Provide personalized support based on the user's information and needs.
      Be professional, empathetic, and solution-oriented.
      If the user has a problem, try to understand it and suggest appropriate solutions.
      If the user needs help with their account, investments, withdrawals, or anything else, provide clear guidance.

      User's message: ${message}`;

      const response = await pollinationsService.queryText(prompt);
      return response;
    } catch (error) {
      console.error("Pollinations API error:", error);
      return "I'm here, but things are a bit busy right now. Please try again in a moment.";
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