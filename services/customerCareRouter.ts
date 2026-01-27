import { chatAI } from './chatAI';
import { imageAnalysisAI } from './imageAnalysisAI';
import { generateImageDescription, parseImageContent, ImageAnalysisResult } from '../utils/imageParser';

// State management for the router
let currentMode: 'chat' | 'image' = 'chat';
let isBusy = false;
let lastImageContext: any = null;

/**
 * Router / Controller for Customer Care AI
 * Implements the all-in-one permanent solution
 */
export const customerCareRouter = {
  /**
   * Routes user requests to appropriate agents
   * @param message - The user's message
   * @param imageData - Optional image data for analysis
   * @returns The complete AI response
   */
  async processRequest(message: string, imageData?: string, imageDescription?: string): Promise<string> {
    // Check if router is busy
    if (isBusy) {
      return "Please wait a moment. I'm here to help.";
    }

    if (imageData && imageDescription) {
      // Set busy flag and mode
      isBusy = true;
      currentMode = 'image';

      let imageResult: string;
      try {
        // Run image agent with timeout protection
        imageResult = await this.runWithTimeout(
          imageAnalysisAI.analyzeImage(imageDescription, imageData),
          3000, // 3 seconds timeout
          "Image analysis timed out. Please try again."
        );

        // Save image result for context
        lastImageContext = imageResult;
      } catch (error) {
        console.error("Error in image analysis agent:", error);
        imageResult = "Support is busy right now. Please try again.";
        lastImageContext = imageResult;
      } finally {
        // ALWAYS reset to chat mode and clear busy flag
        currentMode = 'chat';
        isBusy = false;
      }

      // Return immediate response after image processing
      return "Image received and checked.";
    } else {
      // Set busy flag for chat processing
      isBusy = true;

      let response: string;
      try {
        // Go directly to CHAT AGENT (no shared promises, no blocking)
        // Include any previous image context if available
        let fullMessage = message;
        if (lastImageContext) {
          fullMessage = `${message}\n\nPrevious Image Context: ${lastImageContext}`;
        }

        // Run chat agent with timeout protection
        response = await this.runWithTimeout(
          chatAI.getResponse(fullMessage),
          3000, // 3 seconds timeout
          "Support is busy right now. Please try again."
        );
      } catch (error) {
        console.error("Error in chat agent during text processing:", error);
        response = "Support is busy right now. Please try again.";
      } finally {
        // ALWAYS clear busy flag
        isBusy = false;
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
    // Check if router is busy
    if (isBusy) {
      return "Please wait a moment. I'm here to help.";
    }

    // Set busy flag and mode
    isBusy = true;
    currentMode = 'image';

    let imageResult: string;
    try {
      // Run image agent with timeout protection
      imageResult = await this.runWithTimeout(
        imageAnalysisAI.analyzeImage(description, imageData),
        3000, // 3 seconds timeout
        "Image analysis timed out. Please try again."
      );

      // Save image result for context
      lastImageContext = imageResult;
    } catch (error) {
      console.error("Error in image analysis agent:", error);
      imageResult = "Support is busy right now. Please try again.";
      lastImageContext = imageResult;
    } finally {
      // ALWAYS reset to chat mode and clear busy flag
      currentMode = 'chat';
      isBusy = false;
    }

    // Return the image analysis result
    return imageResult;
  },

  /**
   * Helper function to run a promise with a timeout
   */
  async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
      }) as Promise<T>
    ]).catch(() => {
      // If the operation timed out, return the fallback value
      return fallbackValue;
    });
  },

  /**
   * Reset the router state to default
   */
  resetState(): void {
    currentMode = 'chat';
    isBusy = false;
    lastImageContext = null;
  },

  /**
   * Get the current mode
   */
  getCurrentMode(): 'chat' | 'image' {
    return currentMode;
  },

  /**
   * Get the busy status
   */
  getIsBusy(): boolean {
    return isBusy;
  },

  /**
   * Get the last image context
   */
  getLastImageContext(): any {
    return lastImageContext;
  }
};