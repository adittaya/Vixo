import { customAIAgent } from './customAIAgent';
import { requestManager, generateRequestId } from '../utils/requestManager';

/**
 * Router / Controller for Customer Care AI
 * Implements the ultimate fail-safe stateless solution with Pollinations-only processing
 */
export const customerCareRouter = {
  /**
   * Routes user requests to appropriate agents
   * @param message - The user's message
   * @param imageData - Optional image data for analysis
   * @returns The complete AI response
   */
  async processRequest(message: string, imageData?: string, imageDescription?: string): Promise<string> {
    // Generate a unique request ID for this message
    const requestId = generateRequestId();

    // HARD KILL SWITCH: Cancel all pending requests
    requestManager.cancelAllRequests();

    // Add this request to the pending list
    const controller = requestManager.addRequest(requestId);

    try {
      // Check if this message contains an image
      if (imageData && imageDescription) {
        // Run image analysis with OCR + Pollinations
        const imageResult = await this.runWithTimeoutAndAbort(
          customAIAgent.processUserInput({ text: imageDescription, imageUrl: imageData }),
          3000, // 3 seconds timeout
          "Image analysis timed out. Please try again.",
          controller.signal
        );

        // Return immediate response after image processing
        return imageResult;
      } else {
        // Run chat with Pollinations
        const response = await this.runWithTimeoutAndAbort(
          customAIAgent.processUserInput({ text: message }),
          3000, // 3 seconds timeout
          "Support is busy right now. Please try again.",
          controller.signal
        );

        return response;
      }
    } catch (error) {
      console.error("Error in processRequest:", error);
      return "I'm here, but things are a bit busy right now. Please try again in a moment.";
    } finally {
      // Remove the request from pending list
      requestManager.removeRequest(requestId);
    }
  },

  /**
   * Process an image-only request
   * @param imageData - The image data
   * @param description - User's description of the image
   * @returns The AI response based on image analysis
   */
  async processImageRequest(description: string, imageData: string): Promise<string> {
    // Generate a unique request ID for this message
    const requestId = generateRequestId();

    // HARD KILL SWITCH: Cancel all pending requests
    requestManager.cancelAllRequests();

    // Add this request to the pending list
    const controller = requestManager.addRequest(requestId);

    try {
      // Run image analysis with OCR + Pollinations
      const imageResult = await this.runWithTimeoutAndAbort(
        customAIAgent.processUserInput({ text: description, imageUrl: imageData }),
        3000, // 3 seconds timeout
        "Image analysis timed out. Please try again.",
        controller.signal
      );

      return imageResult;
    } catch (error) {
      console.error("Error in processImageRequest:", error);
      return "I'm here, but things are a bit busy right now. Please try again in a moment.";
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
    fallbackValue: T,
    signal?: AbortSignal
  ): Promise<T> {
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
  },

  /**
   * Reset the router (not needed in stateless architecture, but kept for compatibility)
   */
  resetState(): void {
    // Cancel all pending requests
    requestManager.cancelAllRequests();
  },

  /**
   * Get the number of pending requests (for monitoring)
   */
  getPendingRequestCount(): number {
    // This is just for monitoring; in a stateless system we don't rely on this
    return 0; // We don't track state, so always return 0
  }
};