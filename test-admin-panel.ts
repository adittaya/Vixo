/**
 * Test the admin panel access functionality
 */

import { customerCareAI } from './services/customerCareAI';

async function testAdminPanelAccess() {
    console.log('🔍 Testing admin panel access functionality...\n');
    
    const testUser = {
        id: 'test-user-' + Date.now(),
        name: 'Test User',
        mobile: '9876543210',
        balance: 500,
        withdrawableBalance: 200,
        totalInvested: 1000,
        totalWithdrawn: 500,
        vipLevel: 1,
        registrationDate: '2023-01-01',
        status: 'active'
    };

    console.log('Test User:', testUser.name, `(ID: ${testUser.id})`);
    console.log('Initial Balance: ₹' + testUser.balance);
    console.log('');
    
    // Test 1: Query that should trigger admin action (balance issue)
    console.log('Test 1: Balance-related query that might trigger admin action...');
    try {
        const response1 = await customerCareAI.getResponse("My balance seems incorrect, can you check and fix it?", testUser);
        console.log('Response length:', response1.length);
        console.log('Response preview:', response1.substring(0, 200) + (response1.length > 200 ? '...' : ''));
        console.log('');
    } catch (error) {
        console.error('❌ Error in test 1:', error.message);
    }
    
    // Test 2: Withdrawal-related query
    console.log('Test 2: Withdrawal-related query...');
    try {
        const response2 = await customerCareAI.getResponse("I want to withdraw my funds, please process it", testUser);
        console.log('Response length:', response2.length);
        console.log('Response preview:', response2.substring(0, 200) + (response2.length > 200 ? '...' : ''));
        console.log('');
    } catch (error) {
        console.error('❌ Error in test 2:', error.message);
    }
    
    // Test 3: Password-related query
    console.log('Test 3: Password-related query...');
    try {
        const response3 = await customerCareAI.getResponse("I forgot my password, please help me reset it", testUser);
        console.log('Response length:', response3.length);
        console.log('Response preview:', response3.substring(0, 200) + (response3.length > 200 ? '...' : ''));
        console.log('');
    } catch (error) {
        console.error('❌ Error in test 3:', error.message);
    }
    
    console.log('✅ Admin panel access functionality test completed');
    console.log('The AI should now automatically detect problems and access admin panel to fix them behind the scenes.');
}

testAdminPanelAccess();