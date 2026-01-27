/**
 * Test script to verify Pollinations API integration
 */
import { pollinationsService } from './services/pollinationsService';

async function testPollinationsIntegration() {
  console.log('Testing Pollinations API integration...');
  
  try {
    // Test text generation
    console.log('1. Testing text generation...');
    const textResponse = await pollinationsService.queryText('Hello, this is a test message to verify the Pollinations API is working correctly.');
    console.log('✓ Text generation successful:', textResponse.substring(0, 100) + '...');
    
    // Test image generation
    console.log('\n2. Testing image generation...');
    const imageUrl = await pollinationsService.generateImage('A colorful landscape with mountains and a lake');
    console.log('✓ Image generation successful:', imageUrl);
    
    console.log('\n✓ All tests passed! Pollinations API integration is working correctly.');
  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}

// Run the test
testPollinationsIntegration();