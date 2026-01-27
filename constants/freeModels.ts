/**
 * Comprehensive list of OpenRouter free models
 * Updated to include the most reliable free models
 */

export const FREE_MODEL_LISTS = {
  // Best free models for text-based conversations
  TEXT_MODELS: [
    "google/gemma-2-9b-it:free",
    "google/gemma-2-27b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "meta-llama/llama-3.2-1b-instruct:free",
    "nousresearch/hermes-2-pro-llama-3-8b:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "microsoft/phi-3-medium-128k-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "mistralai/mixtral-8x7b-instruct:free",
    "cognitivecomputations/dolphin-mixtral-8x7b:free",
    "teknium/openhermes-2.5-mistral-7b:free",
    "undi95/toppy-m-7b:free",
    "austism/chronos-hermes-13b:free",
    "neversleep/noromaid-20b:free",
    "gryphe/mythomax-l2-13b:free",
    "openchat/openchat-7b:free",
    "anthracite-org/magnum-v2-72b:free",
    "jondurbin/airoboros-l2-70b:free",
    "lizpreciatior/ngc-megatron-gpt3-175b:free"
  ],

  // Models with vision/image capabilities (limited free options)
  VISION_MODELS: [
    "google/gemini-pro-vision:free",  // Note: May have limited availability
    "google/gemini-2.0-flash-exp:free",  // Experimental, may have vision capabilities
    "microsoft/phi-3-vision-128k-instruct:free",  // Vision-enabled
    "llava-hf/llava-1.5-7b-hf:free",  // Vision-language model
    "llava-hf/llava-1.5-13b-hf:free",  // Higher capacity vision model
    "llava-hf/bakllava-1-hf:free"  // Alternative vision model
  ],

  // High-performance free models
  HIGH_PERFORMANCE: [
    "meta-llama/llama-3.1-70b-instruct:free",
    "mistralai/mistral-large:free",
    "cohere/command-r-plus:free",
    "qwen/qwen-2-72b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "qwen/qwen-2-7b-instruct:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "deepseek-ai/deepseek-coder-33b-instruct:free",
    "deepseek-ai/deepseek-coder-67b-instruct:free",
    "openchat/openchat-7b:free"
  ],

  // Reliable fallback models
  FALLBACK_MODELS: [
    "google/gemma-2-9b-it:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "openchat/openchat-7b:free",
    "teknium/openhermes-2.5-mistral-7b:free",
    "nousresearch/hermes-2-pro-llama-3-8b:free",
    "undi95/toppy-m-7b:free",
    "microsoft/phi-3-medium-128k-instruct:free",
    "google/gemma-2-27b-it:free"
  ]
};

// Combined list of all free models
export const ALL_FREE_MODELS = [
  ...FREE_MODEL_LISTS.TEXT_MODELS,
  ...FREE_MODEL_LISTS.VISION_MODELS,
  ...FREE_MODEL_LISTS.HIGH_PERFORMANCE,
  ...FREE_MODEL_LISTS.FALLBACK_MODELS
];

// Remove duplicates
export const UNIQUE_FREE_MODELS = [...new Set(ALL_FREE_MODELS)];