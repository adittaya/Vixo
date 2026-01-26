
import { GoogleGenAI } from "@google/genai";

export class PrimeIntelligence {
  // Fixed: Instantiating GoogleGenAI inside methods instead of constructor to comply with SDK guidelines
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzePortfolio(userBalance: number, investments: any[]) {
    const ai = this.getAI();
    const prompt = `
      As the Prime Drink Platform AI Analyst, analyze this user portfolio:
      - Current Balance: $${userBalance}
      - Active Investments: ${JSON.stringify(investments)}
      
      Provide a brief, professional summary of their yield health and suggest a strategy for maximizing returns using our industrial leasing model.
      Keep it under 150 words.
    `;

    try {
      // Fixed: Using gemini-3-pro-preview for complex reasoning/analysis task
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("AI Analysis failed:", error);
      return "Unable to perform AI analysis at this time. Please try again later.";
    }
  }

  async getFinancialAdvice(query: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      // Fixed: Using gemini-3-pro-preview for high-quality technical advice
      model: 'gemini-3-pro-preview',
      contents: query,
      config: {
        systemInstruction: "You are the Prime Intelligence assistant for the Prime Drink Platform. You help users understand industrial leasing investments, daily yields, and referral structures. You are professional, concise, and focused on platform ethics."
      }
    });
    return response.text;
  }
}

export const primeAI = new PrimeIntelligence();
