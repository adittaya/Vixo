import { customerCareRouter } from './customerCareRouter';

/**
 * Customer Care AI Service
 * Uses the all-in-one permanent solution router architecture
 */
export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    // Use the router for text-based interactions
    // No image data provided, so goes directly to chat agent
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
    // This will run image agent once, then return control
    return await customerCareRouter.processImageRequest(description, imageUrl);
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    customerCareRouter.resetState();
  },

  /**
   * Get the router's busy status
   */
  getIsBusy(): boolean {
    return customerCareRouter.getIsBusy();
  },

  /**
   * Get the router's current mode
   */
  getCurrentMode(): 'chat' | 'image' {
    return customerCareRouter.getCurrentMode();
  }
};