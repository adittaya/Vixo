import { FREE_MODEL_LISTS, UNIQUE_FREE_MODELS } from './constants/freeModels';

console.log('Testing model list import...\n');

console.log('TEXT_MODELS:', FREE_MODEL_LISTS.TEXT_MODELS);
console.log('VISION_MODELS:', FREE_MODEL_LISTS.VISION_MODELS);
console.log('HIGH_PERFORMANCE_MODELS:', FREE_MODEL_LISTS.HIGH_PERFORMANCE_MODELS);
console.log('FALLBACK_MODELS:', FREE_MODEL_LISTS.FALLBACK_MODELS);

console.log('\nTotal unique models available:', UNIQUE_FREE_MODELS.length);

console.log('\n✅ Model lists imported successfully!');
console.log('Note: Actual model availability depends on OpenRouter\'s current offerings.');
console.log('The model lists have been updated with currently available free models.');