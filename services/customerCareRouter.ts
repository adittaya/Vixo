import { chatAI } from './chatAI';
import { generateImageDescription, parseImageContent, ImageAnalysisResult } from '../utils/imageParser';

/**
 * Router / Orchestrator for Customer Care AI
 * Implements the multi-agent architecture with decision logic
 */
export const customerCareRouter = {
  /**
   * Routes user requests to appropriate agents
   * @param message - The user's message
   * @param imageData - Optional image data for analysis
   * @returns The complete AI response
   */
  async processRequest(message: string, imageData?: string, imageDescription?: string): Promise<string> {
    // If there's an image, process it first
    if (imageData && imageDescription) {
      // Parse the image content
      const imageAnalysis: ImageAnalysisResult = parseImageContent(imageData, imageDescription);
      const structuredImageInfo = generateImageDescription(imageAnalysis);
      
      // Combine the user's message with the structured image info
      const combinedMessage = `${message}\n\nImage Analysis: ${structuredImageInfo}`;
      
      // Send to chat agent with image context
      return await chatAI.getResponse(combinedMessage);
    } else {
      // Just send the text message to the chat agent
      return await chatAI.getResponse(message);
    }
  },

  /**
   * Process an image-only request
   * @param imageData - The image data
   * @param description - User's description of the image
   * @returns The AI response based on image analysis
   */
  async processImageRequest(description: string, imageData: string): Promise<string> {
    // Parse the image content
    const imageAnalysis: ImageAnalysisResult = parseImageContent(imageData, description);
    const structuredImageInfo = generateImageDescription(imageAnalysis);
    
    // Create a message for the chat agent with image context
    const message = `User has submitted an image with the following description: "${description}".\n\n${structuredImageInfo}`;
    
    // Send to chat agent
    return await chatAI.getResponse(message);
  }
};