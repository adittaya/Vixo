import { chatAI } from './chatAI';
import { imageAnalysisAI } from './imageAnalysisAI';
import { generateImageDescription, parseImageContent, ImageAnalysisResult } from '../utils/imageParser';

// State management for the router
let routerState: 'chat' = 'chat';  // Simplified: Always reset to chat after image processing
let lastImageContext: any = null;

/**
 * Router / Controller for Customer Care AI
 * Implements the guaranteed fix for text processing after image upload
 */
export const customerCareRouter = {
  /**
   * Routes user requests to appropriate agents
   * @param message - The user's message
   * @param imageData - Optional image data for analysis
   * @returns The complete AI response
   */
  async processRequest(message: string, imageData?: string, imageDescription?: string): Promise<string> {
    // If there's an image, process it with the image agent (one-time action)
    if (imageData && imageDescription) {
      // Image Agent runs ONCE (fire-and-return)
      let imageResult: string;
      try {
        imageResult = await imageAnalysisAI.analyzeImage(imageDescription, imageData);
        // Save image result for context
        lastImageContext = imageResult;
      } catch (error) {
        console.error("Error in image analysis agent:", error);
        imageResult = "Support is busy right now. Please try again.";
        lastImageContext = imageResult;
      }

      // IMMEDIATELY RETURN - DO NOT WAIT
      // Router resets to CHAT automatically
      const combinedMessage = `${message}\n\nImage Analysis: ${imageResult}`;

      // Send to Chat Agent (DEFAULT, ALWAYS ON)
      let response: string;
      try {
        response = await chatAI.getResponse(combinedMessage);
      } catch (error) {
        console.error("Error in chat agent after image processing:", error);
        response = "Support is busy right now. Please try again.";
      }

      return response;
    } else {
      // Go directly to CHAT AGENT (no shared promises, no blocking)
      // Include any previous image context if available
      let fullMessage = message;
      if (lastImageContext) {
        fullMessage = `${message}\n\nPrevious Image Context: ${lastImageContext}`;
      }

      let response: string;
      try {
        response = await chatAI.getResponse(fullMessage);
      } catch (error) {
        console.error("Error in chat agent during text processing:", error);
        response = "Support is busy right now. Please try again.";
      }

      return response;
    }
  },

  /**
   * Process an image-only request
   * @param imageData - The image data
   * @param description - User's description of the image
   * @returns The AI response based on image analysis
   */
  async processImageRequest(description: string, imageData: string): Promise<string> {
    // Image Agent runs ONCE (fire-and-return)
    let imageResult: string;
    try {
      imageResult = await imageAnalysisAI.analyzeImage(description, imageData);
      // Save image result for context
      lastImageContext = imageResult;
    } catch (error) {
      console.error("Error in image analysis agent:", error);
      imageResult = "Support is busy right now. Please try again.";
      lastImageContext = imageResult;
    }

    // IMMEDIATELY RETURN - DO NOT WAIT
    // Router resets to CHAT automatically

    // Return the image analysis result
    return imageResult;
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    // Always reset to chat
    routerState = 'chat';
    lastImageContext = null;
  },

  /**
   * Get the current state
   */
  getState(): 'chat' {
    return routerState;
  },

  /**
   * Get the last image context
   */
  getLastImageContext(): any {
    return lastImageContext;
  }
};