/**
 * Test the password response functionality
 */

import { customerCareAI } from './services/customerCareAI';

async function testPasswordResponse() {
    console.log('🔍 Testing password response functionality...\n');
    
    try {
        const response = await customerCareAI.getPasswordResponse();
        console.log('Password response length:', response.length);
        console.log('Password response preview:', response.substring(0, 200) + (response.length > 200 ? '...' : ''));
        console.log('');
        
        if (response && response.length > 0) {
            console.log('✅ Password response is dynamic and not empty');
        } else {
            console.log('❌ Password response is empty');
        }
        
    } catch (error) {
        console.error('❌ Error in password response:', error.message);
    }
    
    // Test with a user query that triggers password response
    console.log('\n--- Testing with password-related query ---');
    try {
        const userQueryResponse = await customerCareAI.getResponse("I forgot my password, can you help me reset it?", {
            name: 'Test User',
            mobile: '9876543210',
            balance: 500,
            withdrawableBalance: 200,
            totalInvested: 1000,
            totalWithdrawn: 500,
            vipLevel: 2,
            registrationDate: '2023-01-01',
            status: 'active'
        });
        
        console.log('Response to password query length:', userQueryResponse.length);
        console.log('Response to password query preview:', userQueryResponse.substring(0, 200) + (userQueryResponse.length > 200 ? '...' : ''));
        
        if (userQueryResponse && userQueryResponse.length > 0) {
            console.log('✅ Response to password query is dynamic and not empty');
        } else {
            console.log('❌ Response to password query is empty');
        }
    } catch (error) {
        console.error('❌ Error in password query response:', error.message);
    }
}

testPasswordResponse();