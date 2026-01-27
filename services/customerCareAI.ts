import { backboneAI } from './backboneAI';

/**
 * Customer Care AI Service
 * Uses the backbone AI service with Pollinations integration
 */
export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    // Use the backbone AI for text-based interactions
    // Each message is processed independently with no memory
    const result = await backboneAI.processRequest(message);
    return result.content;
  },

  /**
   * Processes an image request and returns insights
   * @param description - The user's description about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(description: string, imageUrl: string): Promise<string> {
    // Use the backbone AI for image-based interactions
    // Each image request is processed independently with no memory
    const result = await backboneAI.processRequest(description, imageUrl, description);
    return result.content;
  },

  /**
   * Generates an image using Pollinations
   * @param prompt - The image generation prompt
   * @returns The URL to the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    // Use the backbone AI for image generation
    const result = await backboneAI.processRequest(prompt, undefined, undefined, true);
    return result.content;
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    // Reset the request manager
    // This is handled internally by the backbone AI
  },

  /**
   * Get the number of pending requests (for monitoring)
   */
  getPendingRequestCount(): number {
    // This is handled internally by the backbone AI
    return 0;
  }
};