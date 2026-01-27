/**
 * Debug test to check API response format
 */

import { pollinationsService } from './services/pollinationsService';

async function debugApiCall() {
    console.log('🔍 Debugging API response format...\n');
    
    try {
        const testPrompt = "Hello, this is a test. Please respond with 'API Test Successful'";
        console.log('Sending test prompt:', testPrompt);
        
        const response = await pollinationsService.queryText(testPrompt);
        console.log('Received response:', response);
        console.log('Response type:', typeof response);
        console.log('Response length:', response.length);
        
    } catch (error) {
        console.error('API Error:', error.message);
        
        // Let's try the simpler text endpoint to compare
        console.log('\nTrying alternative endpoint format...');
        const simpleUrl = `https://gen.pollinations.ai/text/${encodeURIComponent("Hello, this is a test. Please respond with 'Simple API Test Successful'")}?key=sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr`;
        
        try {
            const simpleResponse = await fetch(simpleUrl);
            const simpleText = await simpleResponse.text();
            console.log('Simple endpoint response:', simpleText);
        } catch (simpleError) {
            console.error('Simple endpoint error:', simpleError.message);
        }
    }
}

debugApiCall();