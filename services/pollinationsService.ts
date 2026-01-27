/**
 * Pollinations Image Generation Service
 * Browser-based image generation using Pollinations API
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
      throw new Error("Image generation failed. Please try again.");
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
      throw new Error("Image generation failed. Please try again.");
    }
  }
};