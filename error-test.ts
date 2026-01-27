/**
 * Error-handling test for customer care AI
 */

import { customerCareAI } from './services/customerCareAI';

async function errorHandlingTest() {
    console.log('🔍 Testing customer care AI with error handling...\n');
    
    const testUser = {
        id: 'test-user-' + Date.now(),
        name: 'John Doe',
        mobile: '9876543210',
        balance: 500,
        withdrawableBalance: 200,
        totalInvested: 1000,
        totalWithdrawn: 500,
        vipLevel: 2,
        registrationDate: '2023-01-01',
        status: 'active'
    };

    console.log('Query: "Can you help me understand my account status?"');
    console.log('');
    
    try {
        const response = await customerCareAI.getResponse("Can you help me understand my account status?", testUser);
        console.log('Direct response length:', response.length);
        console.log('Direct response:', response ? `'${response}'` : 'null');
    } catch (error) {
        console.error('Caught error in getResponse:', error.message);
    }
    
    // Let's also test with a simple prompt to see if it's prompt-specific
    console.log('\n--- Testing with simple prompt ---');
    try {
        const simpleResponse = await customerCareAI.getResponse("Hello", testUser);
        console.log('Simple response length:', simpleResponse.length);
        console.log('Simple response:', simpleResponse ? `'${simpleResponse}'` : 'null');
    } catch (error) {
        console.error('Caught error in simple getResponse:', error.message);
    }
    
    // Let's test without user context
    console.log('\n--- Testing without user context ---');
    try {
        const noUserResponse = await customerCareAI.getResponse("Hello");
        console.log('No user response length:', noUserResponse.length);
        console.log('No user response:', noUserResponse ? `'${noUserResponse}'` : 'null');
    } catch (error) {
        console.error('Caught error in no-user getResponse:', error.message);
    }
}

errorHandlingTest();