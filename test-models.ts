import { OpenRouter } from "@openrouter/sdk";
import { FREE_MODEL_LISTS } from './constants/freeModels';

// Use the API key provided by the user
const API_KEY = "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";

if (!API_KEY) {
  console.error("OpenRouter API key is not set.");
  process.exit(1);
}

const openrouter = new OpenRouter({
  apiKey: API_KEY
});

// Test message for all models
const TEST_MESSAGE = "Hello, this is a quick test. Respond with 'Model is working' in 2 words only.";

/**
 * Test a single model with a simple message
 */
async function testModel(model: string): Promise<boolean> {
  try {
    console.log(`Testing model: ${model}`);

    const response = await openrouter.chat.send({
      model: model,
      messages: [
        {
          "role": "user",
          "content": TEST_MESSAGE
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const content = response.choices?.[0]?.message?.content;
    if (content && typeof content === 'string') {
      console.log(`✅ Model ${model} is working`);
      return true;
    } else {
      console.log(`❌ Model ${model} returned invalid response`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Model ${model} failed: ${error.message || error}`);
    return false;
  }
}

/**
 * Test all models in a category
 */
async function testModelCategory(models: string[], categoryName: string): Promise<string[]> {
  console.log(`\n=== Testing ${categoryName} (${models.length} models) ===`);

  const workingModels: string[] = [];

  for (const model of models) {
    const isWorking = await testModel(model);
    if (isWorking) {
      workingModels.push(model);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${categoryName} - Working: ${workingModels.length}/${models.length}`);
  console.log(`Working models:`, workingModels);

  return workingModels;
}

/**
 * Main function to test all model categories
 */
async function testAllModels() {
  console.log("Testing all OpenRouter free models with the provided API key...\n");

  // Test each category separately
  const workingTextModels = await testModelCategory(FREE_MODEL_LISTS.TEXT_MODELS, "TEXT_MODELS");
  const workingVisionModels = await testModelCategory(FREE_MODEL_LISTS.VISION_MODELS, "VISION_MODELS");
  const workingHighPerformanceModels = await testModelCategory(FREE_MODEL_LISTS.HIGH_PERFORMANCE_MODELS, "HIGH_PERFORMANCE_MODELS");
  const workingFallbackModels = await testModelCategory(FREE_MODEL_LISTS.FALLBACK_MODELS, "FALLBACK_MODELS");

  // Display summary
  console.log("\n=== FINAL SUMMARY ===");
  console.log(`TEXT_MODELS: ${workingTextModels.length}/${FREE_MODEL_LISTS.TEXT_MODELS.length} working`);
  console.log(`VISION_MODELS: ${workingVisionModels.length}/${FREE_MODEL_LISTS.VISION_MODELS.length} working`);
  console.log(`HIGH_PERFORMANCE_MODELS: ${workingHighPerformanceModels.length}/${FREE_MODEL_LISTS.HIGH_PERFORMANCE_MODELS.length} working`);
  console.log(`FALLBACK_MODELS: ${workingFallbackModels.length}/${FREE_MODEL_LISTS.FALLBACK_MODELS.length} working`);

  // Generate updated constants file content with actually working models
  console.log("\n=== ACTUALLY WORKING MODELS - UPDATE YOUR CONSTANTS FILE ===");
  console.log("// Copy this content to constants/freeModels.ts:\n");
  console.log("export const FREE_MODEL_LISTS = {");
  console.log("  TEXT_MODELS: [");
  workingTextModels.forEach(model => console.log(`    \"${model}\",`));
  console.log("  ],\n");
  console.log("  VISION_MODELS: [");
  workingVisionModels.forEach(model => console.log(`    \"${model}\",`));
  console.log("  ],\n");
  console.log("  HIGH_PERFORMANCE_MODELS: [");
  workingHighPerformanceModels.forEach(model => console.log(`    \"${model}\",`));
  console.log("  ],\n");
  console.log("  FALLBACK_MODELS: [");
  workingFallbackModels.forEach(model => console.log(`    \"${model}\",`));
  console.log("  ]");
  console.log("};\n");

  // Combined list of all free models
  const allWorkingModels = [
    ...workingTextModels,
    ...workingVisionModels,
    ...workingHighPerformanceModels,
    ...workingFallbackModels
  ];

  // Remove duplicates
  const uniqueWorkingModels = [...new Set(allWorkingModels)];

  console.log("// Combined list of all working free models");
  console.log("export const ALL_FREE_MODELS = [");
  uniqueWorkingModels.forEach(model => console.log(`  \"${model}\",`));
  console.log("];\n");

  console.log("// Remove duplicates");
  console.log("export const UNIQUE_FREE_MODELS = [...new Set(ALL_FREE_MODELS)];");

  console.log("\n🎉 Testing completed! Use the above model lists to update your constants/freeModels.ts file.");
}

// Run the test
testAllModels().catch(error => {
  console.error("Error running model tests:", error);
});