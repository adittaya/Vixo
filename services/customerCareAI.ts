import { customerCareRouter } from './customerCareRouter';

/**
 * Customer Care AI Service
 * Uses the multi-agent router architecture
 */
export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    // Use the router for text-based interactions
    return await customerCareRouter.processRequest(message);
  },

  /**
   * Processes an image request and returns insights
   * @param description - The user's description about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(description: string, imageUrl: string): Promise<string> {
    // Use the router for image-based interactions
    return await customerCareRouter.processImageRequest(description, imageUrl);
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    customerCareRouter.resetState();
  }
};