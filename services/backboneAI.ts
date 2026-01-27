import { customerCareRouter } from './customerCareRouter';
import { pollinationsService } from './pollinationsService';
import { requestManager, generateRequestId } from '../utils/requestManager';

/**
 * Backbone AI Service
 * Implements the stateless processing system with Pollinations integration
 */
export const backboneAI = {
  /**
   * Process a user request independently
   * @param message - The user's message
   * @param imageData - Optional image data for analysis
   * @param imageDescription - Optional description of the image
   * @param isImageGenerationRequest - Whether this is an image generation request
   * @returns The AI response
   */
  async processRequest(
    message: string, 
    imageData?: string, 
    imageDescription?: string,
    isImageGenerationRequest: boolean = false
  ): Promise<any> {
    // Generate a unique request ID for this message
    const requestId = generateRequestId();
    
    // HARD KILL SWITCH: Cancel all pending requests
    requestManager.cancelAllRequests();
    
    // Add this request to the pending list
    const controller = requestManager.addRequest(requestId);
    
    try {
      // Decide action ONLY from current message
      if (isImageGenerationRequest) {
        // Use Pollinations image endpoint directly from browser
        const imageUrl = await this.runWithTimeoutAndAbort(
          pollinationsService.generateImage(message),
          3000, // 3 seconds timeout
          null,
          controller.signal
        );
        
        if (!imageUrl) {
          return { type: 'text', content: "Image generation failed. Please try again." };
        }
        
        return { type: 'image', content: imageUrl, prompt: message };
      } 
      else if (imageData && imageDescription) {
        // Run image analysis ONE TIME
        const result = await customerCareRouter.processImageRequest(imageDescription, imageData);
        
        // Return result immediately
        // Do NOT trigger chat automatically
        return { type: 'text', content: result };
      } 
      else {
        // Run chat executor with free models
        const response = await this.runWithTimeoutAndAbort(
          customerCareRouter.processRequest(message),
          3000, // 3 seconds timeout
          "Support is busy right now. Please try again in a moment.",
          controller.signal
        );
        
        return { type: 'text', content: response };
      }
    } catch (error) {
      console.error("Error in backboneAI processRequest:", error);
      return { type: 'text', content: "Support is busy right now. Please try again in a moment." };
    } finally {
      // Remove the request from pending list
      requestManager.removeRequest(requestId);
    }
  },

  /**
   * Helper function to run a promise with a timeout and abort signal
   */
  async runWithTimeoutAndAbort<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    fallbackValue: T | null,
    signal?: AbortSignal
  ): Promise<T | null> {
    // Create a timeout promise
    const timeoutPromise = new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, timeoutMs);
    
      // If the signal is aborted, reject the promise
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Operation was aborted'));
        });
      }
    }) as Promise<T>;
    
    try {
      // Race the actual promise against the timeout and abort signal
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } catch (error) {
      // If the operation timed out or was aborted, return the fallback value
      console.warn("Request timed out or was aborted:", error);
      return fallbackValue;
    }
  }
};