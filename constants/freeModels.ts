/**
 * OpenRouter free models as specified in the system prompt
 */

export const FREE_MODEL_LISTS = {
  // TEXT_MODELS as specified
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

  // VISION_MODELS as specified
  VISION_MODELS: [
    "google/gemini-pro-vision:free",
    "google/gemini-2.0-flash-exp:free",
    "microsoft/phi-3-vision-128k-instruct:free",
    "llava-hf/llava-1.5-7b-hf:free",
    "llava-hf/llava-1.5-13b-hf:free",
    "llava-hf/bakllava-1-hf:free"
  ],

  // HIGH_PERFORMANCE_MODELS as specified
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

  // FALLBACK_MODELS as specified
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