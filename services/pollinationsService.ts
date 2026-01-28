/**
 * Pollinations Service
 * Browser-based AI processing using Pollinations API
 * No API key required - distributed users = distributed load
 */

export const pollinationsService = {
  /**
   * Generate an image using Pollinations
   * @param prompt - The image generation prompt
   * @returns The URL to the generated image
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Construct the Pollinations URL
      // Format: https://pollinations.ai/p/{prompt}
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://pollinations.ai/p/${encodedPrompt}`;

      // Return the image URL - the actual generation happens on Pollinations servers
      return imageUrl;
    } catch (error) {
      console.error("Error generating image with Pollinations:", error);
      throw error;
    }
  },

  /**
   * Query Pollinations text endpoint
   * @param prompt - The text query
   * @returns The text response
   */
  /**
   * Query Pollinations chat completions endpoint with full conversation history
   * @param messages - Array of conversation messages with role and content
   * @returns The text response
   */
  async queryChat(messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>): Promise<string> {
    // Attempt direct API call using the proper chat completions endpoint
    console.log("Attempting direct API call to external service using chat completions endpoint");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const requestBody = {
        model: "openai",
        temperature: 0.2,
        max_tokens: 300,  // Reduced to prevent full reasoning consumption
        messages: messages
      };

      // Use the API key from environment variable if available, otherwise use the hardcoded one
      const apiKey = process.env.POLLINATIONS_API_KEY || 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr'; // Provided API key
      const url = `https://gen.pollinations.ai/v1/chat/completions?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Check for specific error statuses based on API spec
        if (response.status === 401) {
          throw new Error(`Authentication required. Please provide a valid API key. Status: ${response.status}`);
        } else if (response.status === 402) {
          throw new Error(`Insufficient pollen balance or API key budget exhausted. Status: ${response.status}`);
        } else if (response.status === 403) {
          throw new Error(`Access denied - insufficient permissions. Status: ${response.status}`);
        } else {
          throw new Error(`Pollinations API responded with status ${response.status}`);
        }
      }

      const responseData = await response.json();
      console.log("Successfully received response from external API");

      // Handle different response formats
      let responseText = '';

      // Check if response has the expected OpenAI format
      if (responseData.choices && responseData.choices[0]) {
        const firstChoice = responseData.choices[0];

        if (firstChoice.message && typeof firstChoice.message.content === 'string') {
          responseText = firstChoice.message.content;
        }
        // Some APIs might have the content in a different structure
        else if (firstChoice.delta && typeof firstChoice.delta.content === 'string') {
          responseText = firstChoice.delta.content;
        }
        else if (firstChoice.text && typeof firstChoice.text === 'string') {
          responseText = firstChoice.text;
        }
      }
      // If not in OpenAI format, check if it's in our server's format { text: '...' }
      else if (typeof responseData.text === 'string') {
        responseText = responseData.text;
      }
      // Fallback: try to get content from other possible fields
      else if (responseData.content) {
        responseText = responseData.content;
      }

      // If still no response, throw an error
      if (!responseText) {
        console.error("Unexpected response format:", responseData);
        throw new Error("Invalid response format from AI service");
      }

      return responseText;
    } catch (directApiError) {
      console.error("Direct API call failed:", directApiError.message);
      throw directApiError;
    }
  },

  /**
   * Query Pollinations text endpoint (wrapper for backward compatibility)
   * @param prompt - The text query
   * @returns The text response
   */
  async queryText(prompt: string): Promise<string> {
    // For backward compatibility, convert the single prompt to a conversation with system message
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful assistant. Respond to the user\'s query directly and concisely.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    return await this.queryChat(messages);
  },

  /**
   * Generate an image with additional parameters
   * @param prompt - The image generation prompt
   * @param width - Image width (default 512)
   * @param height - Image height (default 512)
   * @param seed - Random seed for reproducible results
   * @returns The URL to the generated image
   */
  async generateImageAdvanced(
    prompt: string,
    width: number = 512,
    height: number = 512,
    seed?: number
  ): Promise<string> {
    try {
      // Construct the Pollinations URL with parameters
      let imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}`;

      if (seed !== undefined) {
        imageUrl += `&seed=${seed}`;
      }

      // Return the image URL
      return imageUrl;
    } catch (error) {
      console.error("Error generating image with Pollinations:", error);
      throw error;
    }
  }
};