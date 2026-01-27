/**
 * CUSTOM AI AGENT BACKBONE
 * Pollinations-only implementation for image analysis and customer care
 * 
 * Implements the exact flow:
 * - OCR for image analysis
 * - Pollinations for text processing
 * - Stateless processing
 * - Always reply guarantee
 */

import { pollinationsService } from '../services/pollinationsService';
import { extractTextFromImage } from '../utils/ocrUtils';
import { requestManager, generateRequestId } from '../utils/requestManager';

interface UserInput {
  text: string;
  imageUrl?: string;
}

export const customAIAgent = {
  /**
   * Process user input according to the specified flow
   * @param input - User input with optional image
   * @returns AI response
   */
  async processUserInput(input: UserInput): Promise<string> {
    // Generate a unique request ID for this message
    const requestId = generateRequestId();

    // HARD KILL SWITCH: Cancel all pending requests
    requestManager.cancelAllRequests();

    // Add this request to the pending list
    const controller = requestManager.addRequest(requestId);

    try {
      // Abort previous request (stateless processing)
      // This is handled by cancelAllRequests() above

      if (input.imageUrl) {
        // IMAGE ANALYSIS FLOW
        return await this.handleImageAnalysis(input.imageUrl, input.text, controller);
      } else {
        // TEXT CHAT FLOW
        return await this.handleTextChat(input.text, controller);
      }
    } catch (error) {
      console.error("Error in customAIAgent processUserInput:", error);
      return "I'm here, but things are a bit busy right now. Please try again in a moment.";
    } finally {
      // Remove the request from pending list
      requestManager.removeRequest(requestId);
    }
  },

  /**
   * Handle image analysis flow: OCR -> Text -> Pollinations
   */
  async handleImageAnalysis(imageUrl: string, description: string, controller: AbortController): Promise<string> {
    try {
      // STEP 1: Extract text from image using OCR
      const ocrText = await this.runWithTimeoutAndAbort(
        extractTextFromImage(imageUrl),
        5000, // 5 seconds for OCR
        "Unable to extract text from image. Please try again.",
        controller.signal
      );

      // STEP 2: Send to Pollinations with context
      const prompt = `Explain this screenshot to the user in simple language: ${ocrText}`;
      
      const response = await this.runWithTimeoutAndAbort(
        pollinationsService.generateImage(prompt), // Using generateImage as it connects to Pollinations
        3000, // 3 seconds timeout
        "Image analysis is taking longer than usual. Please try again.",
        controller.signal
      );

      // STEP 3: Return response
      return response;
    } catch (error) {
      console.error("Image analysis failed:", error);
      return "I'm here, but things are a bit busy right now. Please try again in a moment.";
    }
  },

  /**
   * Handle text chat flow with Pollinations
   */
  async handleTextChat(text: string, controller: AbortController): Promise<string> {
    try {
      // Check if this is a customer care request and enhance the prompt accordingly
      if (text.toLowerCase().includes('customer care') ||
          text.toLowerCase().includes('support') ||
          text.toLowerCase().includes('vixo') ||
          text.toLowerCase().includes('account') ||
          text.toLowerCase().includes('balance') ||
          text.toLowerCase().includes('withdraw') ||
          text.toLowerCase().includes('investment') ||
          text.toLowerCase().includes('refund') ||
          text.toLowerCase().includes('problem') ||
          text.toLowerCase().includes('issue') ||
          text.toLowerCase().includes('help')) {
        // Enhance the prompt for customer care scenarios
        const enhancedPrompt = `As a customer care assistant for VIXO investment platform, provide helpful and empathetic support.
        Address the user's concerns professionally and offer solutions when possible.
        Be patient, understanding, and provide clear instructions.
        If the user has a specific issue, acknowledge it and guide them toward resolution.
        If the user needs help with their account, investments, withdrawals, or anything else, provide clear guidance.

        User's request: ${text}`;

        const response = await this.runWithTimeoutAndAbort(
          pollinationsService.queryText(enhancedPrompt),
          5000, // 5 seconds timeout for more complex queries
          "I'm here, but things are a bit busy right now. Please try again in a moment.",
          controller.signal
        );

        return response;
      } else {
        // Send to Pollinations text endpoint for general queries
        const response = await this.runWithTimeoutAndAbort(
          pollinationsService.queryText(text),
          3000, // 3 seconds timeout
          "I'm here, but things are a bit busy right now. Please try again in a moment.",
          controller.signal
        );

        return response;
      }
    } catch (error) {
      console.error("Text chat failed:", error);
      return "I'm here, but things are a bit busy right now. Please try again in a moment.";
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
  }
};