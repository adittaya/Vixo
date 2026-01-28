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
  async queryText(prompt: string): Promise<string> {
    // Diagnostic version to help identify the issue
    console.log("Attempting to call Pollinations API with prompt:", prompt.substring(0, 50) + "...");

    // In browser environment, we must use the local server due to CORS restrictions
    // In Node.js environment, we can call the API directly
    if (typeof window !== 'undefined') {
      // Browser environment - use local server endpoint
      // In development, Vite proxy will forward /api/ai requests to the backend server
      // In production, the API routes will be served from the same domain
      console.log("Running in browser environment, attempting to call /api/ai/text");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('/api/ai/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log("Response status:", response.status);

        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = `Server responded with status ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage += ` - ${errorData.error}`;
            }
          } catch (e) {
            // If we can't parse the error response, use the status only
            try {
              // Try to read as text if JSON parsing fails
              const errorText = await response.text();
              errorMessage += ` - ${errorText}`;
            } catch (textError) {
              // If all parsing fails, just use status
            }
          }
          console.error("Server error:", errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Successfully received response from server");
        return data.text;
      } catch (error) {
        console.error("Browser environment API call failed:", error.message);
        throw error;
      }
    } else {
      // Node.js environment - call external API directly
      console.log("Running in Node.js environment, attempting to call external API");
      const encodedPrompt = encodeURIComponent(prompt);
      const apiKey = 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr'; // Provided API key
      const url = `https://gen.pollinations.ai/text/${encodedPrompt}?key=${apiKey}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(url, {
          headers: {
            'Accept': 'text/plain',
          },
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

        const textResponse = await response.text();
        console.log("Successfully received response from external API");
        return textResponse;
      } catch (error) {
        console.error("External API call failed:", error.message);
        throw error;
      }
    }
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