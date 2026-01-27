/**
 * Test the password change functionality through customer care AI
 */

import { customerCareAI } from './services/customerCareAI';

async function testPasswordChange() {
    console.log('🔍 Testing password change functionality through customer care AI...\n');
    
    // Simulate a user with the provided credentials
    const testUser = {
        id: 'test-user-7047571829',
        name: 'Test User',
        mobile: '7047571829',
        password: '111111',  // Current password
        balance: 1000,
        withdrawableBalance: 500,
        totalInvested: 2000,
        totalWithdrawn: 1000,
        vipLevel: 2,
        registrationDate: '2023-01-01',
        status: 'active'
    };

    console.log('Test User:', testUser.name);
    console.log('Mobile:', testUser.mobile);
    console.log('Current Password: ' + testUser.password);
    console.log('');
    
    // Test 1: Request to change password
    console.log('Test 1: Requesting password change from "111111" to "222222"...\n');
    console.log('User Query: "I want to change my password from 111111 to 222222"');
    console.log('');
    
    try {
        const response1 = await customerCareAI.getResponse("I want to change my password from 111111 to 222222", testUser);
        console.log('AI Response:');
        console.log(response1);
        console.log('');
    } catch (error) {
        console.error('❌ Error in test 1:', error.message);
    }
    
    // Test 2: Alternative query for password change
    console.log('Test 2: Alternative password change request...\n');
    console.log('User Query: "Please help me update my password to 222222, my current password is 111111"');
    console.log('');
    
    try {
        const response2 = await customerCareAI.getResponse("Please help me update my password to 222222, my current password is 111111", testUser);
        console.log('AI Response:');
        console.log(response2);
        console.log('');
    } catch (error) {
        console.error('❌ Error in test 2:', error.message);
    }
    
    // Test 3: Password reset request
    console.log('Test 3: Password reset request...\n');
    console.log('User Query: "I need to reset my password, can you help me change it to 222222?"');
    console.log('');
    
    try {
        const response3 = await customerCareAI.getResponse("I need to reset my password, can you help me change it to 222222?", testUser);
        console.log('AI Response:');
        console.log(response3);
        console.log('');
    } catch (error) {
        console.error('❌ Error in test 3:', error.message);
    }
    
    // Test 4: Forgot password scenario
    console.log('Test 4: Forgot password scenario...\n');
    console.log('User Query: "I forgot my password, please help me set it to 222222"');
    console.log('');
    
    try {
        const response4 = await customerCareAI.getResponse("I forgot my password, please help me set it to 222222", testUser);
        console.log('AI Response:');
        console.log(response4);
        console.log('');
    } catch (error) {
        console.error('❌ Error in test 4:', error.message);
    }
    
    console.log('✅ Password change functionality test completed');
    console.log('The AI should recognize password change requests and handle them appropriately.');
    console.log('In a real environment, the AI would access the admin panel to change the password.');
}

testPasswordChange();