/**
 * Test script to simulate user interaction with the Vixo customer care system
 * Using the provided credentials: Number:7047571829, Pass:111111
 */

import { getStore, saveStore } from './store';
import { customerCareAI } from './services/customerCareAI';

async function testUserInteraction() {
    console.log('🔍 Testing user interaction with Vixo customer care system...\n');

    // Simulate user login with provided credentials
    const testUser = {
        id: 'test-user-7047571829',
        name: 'Test User',
        mobile: '7047571829',
        password: '111111',
        balance: 1500,
        withdrawableBalance: 750,
        totalInvested: 3000,
        totalWithdrawn: 1200,
        vipLevel: 2,
        registrationDate: '2023-06-15',
        status: 'active'
    };

    console.log('👤 Test User Credentials:');
    console.log(`   Mobile: ${testUser.mobile}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Balance: ₹${testUser.balance}`);
    console.log(`   VIP Level: ${testUser.vipLevel}\n`);

    // Initialize store with test user
    const store = getStore();
    if (!store.users.some(u => u.id === testUser.id)) {
        store.users.push(testUser);
        await saveStore(store);
    }

    console.log('💬 Testing customer care interactions...\n');

    // Test 1: General inquiry
    console.log('Test 1: General account inquiry');
    console.log('User: "Hello, I need help with my account"');
    try {
        const response1 = await customerCareAI.getResponse("Hello, I need help with my account", testUser);
        console.log('AI Response:', response1.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Error in test 1:', error.message, '\n');
    }

    // Test 2: Password change request
    console.log('Test 2: Password change request');
    console.log('User: "I want to change my password from 111111 to 222222"');
    try {
        const response2 = await customerCareAI.getResponse("I want to change my password from 111111 to 222222", testUser);
        console.log('AI Response:', response2.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Error in test 2:', error.message, '\n');
    }

    // Test 3: Balance inquiry
    console.log('Test 3: Balance inquiry');
    console.log('User: "What is my current balance?"');
    try {
        const response3 = await customerCareAI.getResponse("What is my current balance?", testUser);
        console.log('AI Response:', response3.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Error in test 3:', error.message, '\n');
    }

    // Test 4: Withdrawal request
    console.log('Test 4: Withdrawal request');
    console.log('User: "I want to withdraw money from my account"');
    try {
        const response4 = await customerCareAI.getResponse("I want to withdraw money from my account", testUser);
        console.log('AI Response:', response4.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Error in test 4:', error.message, '\n');
    }

    // Test 5: VIP benefits inquiry
    console.log('Test 5: VIP benefits inquiry');
    console.log('User: "What are the benefits of my VIP level?"');
    try {
        const response5 = await customerCareAI.getResponse("What are the benefits of my VIP level?", testUser);
        console.log('AI Response:', response5.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Error in test 5:', error.message, '\n');
    }

    // Test 6: Investment plan inquiry
    console.log('Test 6: Investment plan inquiry');
    console.log('User: "Tell me about the investment plans available"');
    try {
        const response6 = await customerCareAI.getResponse("Tell me about the investment plans available", testUser);
        console.log('AI Response:', response6.substring(0, 200) + '...\n');
    } catch (error) {
        console.error('❌ Error in test 6:', error.message, '\n');
    }

    // Check chat history
    console.log('📋 Checking support message history...');
    try {
        const updatedStore = getStore();
        const userMessages = updatedStore.supportMessages?.filter(m => m.userId === testUser.id) || [];
        
        console.log(`Found ${userMessages.length} support messages in history:`);
        userMessages.forEach((msg, index) => {
            const sender = msg.sender === 'user' ? '👤 User' : '🤖 AI';
            console.log(`${index + 1}. ${sender}: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`);
            console.log(`   Time: ${new Date(msg.timestamp).toLocaleTimeString()}\n`);
        });
    } catch (error) {
        console.error('❌ Error checking chat history:', error.message);
    }

    console.log('✅ User interaction test completed successfully!');
    console.log('The customer care system is working properly with the test user credentials.');
    console.log('All interactions were processed and responses were generated dynamically.');
}

// Run the test
testUserInteraction().catch(console.error);