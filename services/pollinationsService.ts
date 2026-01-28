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
    // Multiple fallback approach for API connectivity
    console.log("Attempting to call Pollinations API with conversation history:", messages.length, "messages");

    // Method 1: Try local server endpoint (for development and properly deployed apps)
    if (typeof window !== 'undefined') {
      console.log("Running in browser environment, attempting to call /api/ai/text with chat format");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('/api/ai/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            model: "openai",
            temperature: 0.2,
            presence_penalty: 0.6,
            frequency_penalty: 0.6,
            max_tokens: 500
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log("Local server response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Successfully received response from local server");
          return data.text || data.choices?.[0]?.message?.content;
        } else {
          // Local server responded but with an error
          let errorMessage = `Local server responded with status ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage += ` - ${errorData.error}`;
            }
          } catch (e) {
            try {
              const errorText = await response.text();
              errorMessage += ` - ${errorText}`;
            } catch (textError) {
              // Use status only
            }
          }
          console.warn("Local server error, will try direct API call:", errorMessage);
        }
      } catch (localError) {
        console.warn("Local server call failed, will try direct API call:", localError.message);
      }
    }

    // Method 2: Try direct API call using the proper chat completions endpoint (may fail due to CORS in browsers, but works in Node.js)
    console.log("Attempting direct API call to external service using chat completions endpoint");
    const apiKey = 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr'; // Provided API key
    const url = `https://gen.pollinations.ai/v1/chat/completions?key=${apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const requestBody = {
        model: "openai",
        temperature: 0.2,
        max_tokens: 300,  // Reduced to prevent full reasoning consumption
        messages: messages
      };

      // Extract the API key from the URL and use it in the Authorization header
      const apiKey = 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr'; // Provided API key

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`  // Use Authorization header instead of query parameter
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
      return responseData.choices[0].message.content;
    } catch (directApiError) {
      console.error("Direct API call failed:", directApiError.message);
      // If we're in browser and both methods failed, we propagate the error
      // which will result in "Customer Care busy" as designed
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