import { chatAI } from './chatAI';
import { imageAnalysisAI } from './imageAnalysisAI';

/**
 * Unified Customer Care AI Service
 * Coordinates between chat and image analysis AI agents
 */
export const customerCareAI = {
  /**
   * Sends a text message to the AI and returns the response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    // Use the chat AI for text-based interactions
    return await chatAI.getResponse(message);
  },

  /**
   * Analyzes an image and returns insights
   * @param message - The user's query about the image
   * @param imageUrl - The URL or base64 data of the image to analyze
   * @returns The complete AI response with image analysis
   */
  async analyzeImage(message: string, imageUrl: string): Promise<string> {
    // Use the image analysis AI for image-based interactions
    return await imageAnalysisAI.analyzeImage(message, imageUrl);
  }
};