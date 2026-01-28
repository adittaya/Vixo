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
    try {
      // Check if we're in a Node.js environment (for tests) or browser
      if (typeof window === 'undefined') {
        // In Node.js environment, use the external API directly
        // Using the original working format from server-ai.js
        const encodedPrompt = encodeURIComponent(prompt);
        const apiKey = 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr'; // Provided API key
        const url = `https://gen.pollinations.ai/text/${encodedPrompt}?key=${apiKey}`;

        const response = await fetch(url, {
          headers: {
            'Accept': 'text/plain',
          }
        });

        if (!response.ok) {
          throw new Error(`Pollinations API responded with status ${response.status}`);
        }

        const textResponse = await response.text();
        return textResponse;
      } else {
        // In browser environment, use the local server endpoint
        const response = await fetch('/api/ai/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data.text;
      }
    } catch (error) {
      console.error("Error querying Pollinations text endpoint:", error);
      // Don't throw an error, just re-throw it so the calling function can handle it
      throw error;
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