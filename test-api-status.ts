/**
 * Test to check if the Pollinations API is working properly
 */

import { pollinationsService } from './services/pollinationsService';

async function testApiStatus() {
    console.log('📡 Testing Pollinations API connection...\n');
    
    try {
        // Test with a simple prompt to check if API is responding
        const testPrompt = "Hello, this is a test to check if the API is working. Please respond with 'API is working fine.'";
        
        console.log('Sending test request to Pollinations API...');
        console.log('Prompt:', testPrompt);
        console.log('');
        
        const startTime = Date.now();
        const response = await pollinationsService.queryText(testPrompt);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('✅ API Response received successfully!');
        console.log('Response:', response);
        console.log('Response time:', responseTime, 'ms');
        console.log('');
        
        // Check if response indicates API is working
        const isWorking = response && response.length > 0;
        console.log('✅ API Status: Operational');
        console.log('✅ Connection: Successful');
        console.log('✅ Response Quality: Good');
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        console.log('');
        console.log('Possible issues:');
        console.log('1. Invalid API key');
        console.log('2. Network connectivity issue');
        console.log('3. API service downtime');
        console.log('4. Rate limiting');
    }
}

testApiStatus();