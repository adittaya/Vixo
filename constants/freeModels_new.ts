/**
 * OpenRouter free models as specified in the system prompt
 * Updated with currently available free models as of January 2026
 */

export const FREE_MODEL_LISTS = {
  // TEXT_MODELS - Currently available free models
  TEXT_MODELS: [
    "huggingfaceh4/zephyr-7b-beta:free",
    "microsoft/rewardmodel-llama-70b:free",
    "google/gemma-2-9b-it:free", // May have limited availability
    "undi95/remm-slerp-13b:free",
    "cognitivecomputations/dolphincoder:free",
    "nousresearch/noushermes-2-mixtral-8x7b-dpo:free"
  ],

  // VISION_MODELS - Currently available free models with vision capabilities
  VISION_MODELS: [
    "google/gemini-2.0-flash-exp:free", // Limited daily usage
    "microsoft/phi-3.5-vision-instruct:free"
  ],

  // HIGH_PERFORMANCE_MODELS - Currently available higher-performance free models
  HIGH_PERFORMANCE_MODELS: [
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free"
  ],

  // FALLBACK_MODELS - Reliable fallback options
  FALLBACK_MODELS: [
    "google/gemma-2-9b-it:free",
    "microsoft/phi-3-medium-128k-instruct:free",
    "undi95/remm-slerp-13b:free"
  ]
};

// Combined list of all free models
export const ALL_FREE_MODELS = [
  ...FREE_MODEL_LISTS.TEXT_MODELS,
  ...FREE_MODEL_LISTS.VISION_MODELS,
  ...FREE_MODEL_LISTS.HIGH_PERFORMANCE_MODELS,
  ...FREE_MODEL_LISTS.FALLBACK_MODELS
];

// Remove duplicates
export const UNIQUE_FREE_MODELS = [...new Set(ALL_FREE_MODELS)];