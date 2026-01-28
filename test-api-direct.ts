/**
 * Simple test to verify the pollinations service works
 */

import { pollinationsService } from './services/pollinationsService';

async function testPollinationsService() {
    console.log('Testing Pollinations Service...\n');
    
    try {
        const response = await pollinationsService.queryText("Hello, this is a test. Please respond with 'API Test Successful'");
        console.log('✅ API Test Successful:');
        console.log(response);
    } catch (error) {
        console.log('❌ API Test Failed:');
        console.log(error.message);
    }
}

testPollinationsService();