/**
 * Customer Care AI Service
 * Handles customer inquiries using OpenRouter's AI models
 * Note: Requires VITE_OPENROUTER_API_KEY environment variable to be set
 */
export const customerCareAI = {
  /**
   * Sends a message to the Customer Care AI and returns a streaming response
   * @param message - The customer's inquiry message
   * @returns Async generator yielding response chunks
   */
  async *getResponseStream(message: string) {
    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error("OpenRouter API key is not set");
        yield "API key is not configured. Please contact the administrator.";
        return;
      }

      // Use fetch to call OpenRouter API directly since the SDK might not work in browser
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'User-Agent': 'Vixo-App/1.0'
        },
        body: JSON.stringify({
          model: "tngtech/deepseek-r1t2-chimera:free",
          messages: [
            {
              "role": "system",
              "content": `You are a customer care representative for VIXO investment platform.
              Your role is to assist users with their queries about investments, withdrawals,
              account management, and platform features. Be helpful, friendly, and professional.
              If a user asks about technical issues, guide them step-by-step.
              If they ask about investments, explain the benefits and risks clearly.
              If they need help with withdrawals, walk them through the process.
              Always prioritize user security and platform policies.`
            },
            {
              "role": "user",
              "content": message
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error(`HTTP error! status: ${response.status}`, errorMessage);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                console.error("API Error:", parsed.error);
                yield `Error: ${parsed.error.message || 'API request failed'}`;
                return;
              }

              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip malformed JSON but log the error
              console.warn("Failed to parse SSE data:", e, line);
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in customer care AI:", error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        yield "Connection slow. Please check your internet connection and try again.";
      } else {
        yield "I'm sorry, I'm having trouble connecting to the AI service. Please try again later.";
      }
    }
  },

  /**
   * Sends a message to the Customer Care AI and returns the complete response
   * @param message - The customer's inquiry message
   * @returns The complete AI response
   */
  async getResponse(message: string): Promise<string> {
    let fullResponse = '';
    
    try {
      for await (const chunk of this.getResponseStream(message)) {
        fullResponse += chunk;
      }
      
      return fullResponse;
    } catch (error) {
      console.error("Error getting customer care response:", error);
      return "I'm sorry, I encountered an error processing your request. Please try again later.";
    }
  }
};