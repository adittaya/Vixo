// Simple test to check if the OpenRouter API is working
import { customerCareAI } from './services/customerCareAI';

async function testAIConnection() {
  console.log("Testing OpenRouter API connection...");
  
  try {
    // Test with a simple message
    const response = await customerCareAI.getResponse("Hello, are you working?");
    console.log("API Response:", response);
    
    if (response && !response.includes("having trouble")) {
      console.log("✅ AI connection is working properly!");
      return true;
    } else {
      console.log("❌ AI connection failed with response:", response);
      return false;
    }
  } catch (error) {
    console.error("❌ Error testing AI connection:", error);
    return false;
  }
}

// Run the test
testAIConnection();