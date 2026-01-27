import { chatAI } from './chatAI';
import { imageAnalysisAI } from './imageAnalysisAI';
import { generateImageDescription, parseImageContent, ImageAnalysisResult } from '../utils/imageParser';

// State management for the router
let currentAgent: 'chat' | 'image' = 'chat';  // Changed to match the new architecture
let lastImageContext: any = null;  // Changed name to match the new architecture

/**
 * Router / Controller for Customer Care AI
 * Implements the agent switching architecture with state management
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
      // Switch to image agent temporarily
      currentAgent = 'image';

      let imageResult: string;
      try {
        // Image Agent is TEMPORARY - Runs only when image is uploaded
        imageResult = await imageAnalysisAI.analyzeImage(imageDescription, imageData);
        // Save image result for context
        lastImageContext = imageResult;
      } catch (error) {
        console.error("Error in image analysis agent:", error);
        imageResult = "Support is busy right now. Please try again.";
        lastImageContext = imageResult;
      }

      // FORCE switch back to Chat Agent (CRITICAL STEP)
      currentAgent = 'chat';

      // Combine the user's message with the image analysis
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
      // All text messages ALWAYS go to Chat Agent (DEFAULT)
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
    // Image Agent is TEMPORARY - Runs only once per image
    currentAgent = 'image';

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

    // FORCE switch back to Chat Agent (CRITICAL STEP)
    currentAgent = 'chat';

    // Return the image analysis result
    return imageResult;
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    // Chat Agent is the DEFAULT agent (RULE 1)
    currentAgent = 'chat';
    lastImageContext = null;
  },

  /**
   * Get the current agent state
   */
  getCurrentAgent(): 'chat' | 'image' {
    return currentAgent;
  },

  /**
   * Get the last image context
   */
  getLastImageContext(): any {
    return lastImageContext;
  }
};