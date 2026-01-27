/**
 * Detailed test to check customer care AI response
 */

import { customerCareAI } from './services/customerCareAI';

async function detailedIntegrationTest() {
    console.log('🔍 Detailed customer care AI integration test...\n');
    
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

    console.log('User data:', testUser);
    console.log('Query: "Can you help me understand my account status?"');
    console.log('');
    
    try {
        const startTime = Date.now();
        const response = await customerCareAI.getResponse("Can you help me understand my account status?", testUser);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('Response received in', responseTime, 'ms');
        console.log('Response length:', response.length);
        console.log('Response preview:', response.substring(0, 200) + (response.length > 200 ? '...' : ''));
        console.log('');
        
        // Check if response contains user-specific information
        const hasUserName = response.includes(testUser.name);
        const hasUserBalance = response.includes('₹' + testUser.balance.toString());
        console.log('Contains user name:', hasUserName);
        console.log('Contains user balance:', hasUserBalance);
        
        if (response && response.length > 0) {
            console.log('✅ Response is not empty');
        } else {
            console.log('❌ Response is empty');
        }
        
    } catch (error) {
        console.error('❌ Error occurred:', error.message);
    }
}

detailedIntegrationTest();