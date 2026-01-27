/**
 * Pollinations AI Service - Primary AI Service
 * Implements Pollinations-first architecture with OpenRouter as fallback
 * Leverages Pollinations for distributed AI processing where possible
 * No API key required for Pollinations - distributed users = distributed load
 */

import { customerCareRouter } from './customerCareRouter';
import { pollinationsService } from './pollinationsService';

export const pollinationsAIService = {
  /**
   * Process a user request prioritizing Pollinations for distributed processing
   * @param message - The user's message
   * @param imageData - Optional image data for analysis
   * @param imageDescription - Optional description of the image
   * @returns The AI response
   */
  async processRequest(
    message: string,
    imageData?: string,
    imageDescription?: string
  ): Promise<string> {
    // Handle image generation requests with Pollinations (primary)
    if (this.isImageGenerationRequest(message)) {
      try {
        // Generate image using Pollinations (no API key needed)
        const imageUrl = await pollinationsService.generateImage(message);
        return `Image generated successfully: ${imageUrl}\n\nYou can check available plans now.`;
      } catch (error) {
        console.log("Pollinations image generation failed, falling back:", error);
      }
    }

    // For all other requests, try to use distributed processing approach
    // In a real implementation, this would connect to various Pollinations models
    // For now, we'll use the traditional approach but with the philosophy of
    // preferring distributed/local processing when possible
    try {
      // Attempt to process with the existing router (which uses OpenRouter)
      if (imageData && imageDescription) {
        return await customerCareRouter.processImageRequest(imageDescription, imageData);
      } else {
        return await customerCareRouter.processRequest(message);
      }
    } catch (error) {
      console.error("Request processing failed:", error);
      return "Support is busy right now. Please try again in a moment.";
    }
  },

  /**
   * Determines if a message is requesting image generation
   * @param message - The user's message
   * @returns True if the message is requesting image generation
   */
  isImageGenerationRequest(message: string): boolean {
    const lowerMsg = message.toLowerCase();
    return lowerMsg.includes('generate') ||
           lowerMsg.includes('create') ||
           lowerMsg.includes('make') ||
           lowerMsg.includes('draw') ||
           lowerMsg.includes('paint') ||
           lowerMsg.includes('image') ||
           lowerMsg.includes('picture');
  },

  /**
   * Generate an image using Pollinations (primary)
   * @param prompt - The image generation prompt
   * @returns The URL to the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Use Pollinations for image generation (primary, no API key needed)
      return await pollinationsService.generateImage(prompt);
    } catch (error) {
      console.error("Pollinations image generation failed:", error);
      throw new Error("Image generation failed. Please try again.");
    }
  }
};