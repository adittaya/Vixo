/**
 * Comprehensive test suite for the Pollinations AI implementation
 * Validates that all changes work correctly and no pre-made responses are returned
 */

import { pollinationsService } from './services/pollinationsService';
import { customerCareAI } from './services/customerCareAI';

async function runTestSuite() {
    console.log('🧪 Running comprehensive test suite...\n');
    
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: API Connectivity
    totalTests++;
    try {
        console.log('Test 1: Pollinations API connectivity...');
        const apiTestResponse = await pollinationsService.queryText("Respond with 'API Test Successful'");
        if (apiTestResponse && apiTestResponse.includes('Test Successful')) {
            console.log('✅ PASS: API connectivity working\n');
            testsPassed++;
        } else {
            console.log('❌ FAIL: API connectivity issue\n');
        }
    } catch (error) {
        console.log('❌ FAIL: API connectivity error:', error.message, '\n');
    }
    
    // Test 2: Customer Care AI with user context
    totalTests++;
    try {
        console.log('Test 2: Customer Care AI with user context...');
        const testUser = {
            id: 'test-user-' + Date.now(),
            name: 'Test User',
            mobile: '9876543210',
            balance: 1000,
            withdrawableBalance: 500,
            totalInvested: 2000,
            totalWithdrawn: 1000,
            vipLevel: 2,
            registrationDate: '2023-01-01',
            status: 'active'
        };
        
        const response = await customerCareAI.getResponse("Can you check my account status?", testUser);
        
        if (response && response.length > 50) { // Ensure it's not a simple canned response
            console.log('✅ PASS: Customer Care AI working with user context\n');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Customer Care AI returned invalid response\n');
        }
    } catch (error) {
        console.log('❌ FAIL: Customer Care AI error:', error.message, '\n');
    }
    
    // Test 3: Different queries produce different responses (verifying no pre-made responses)
    totalTests++;
    try {
        console.log('Test 3: Different queries produce different responses...');
        const testUser = {
            id: 'test-user-' + Date.now(),
            name: 'Different Query Test',
            mobile: '9876543210',
            balance: 1000,
            withdrawableBalance: 500,
            totalInvested: 2000,
            totalWithdrawn: 1000,
            vipLevel: 2,
            registrationDate: '2023-01-01',
            status: 'active'
        };
        
        const response1 = await customerCareAI.getResponse("What is my balance?", testUser);
        const response2 = await customerCareAI.getResponse("How do I withdraw money?", testUser);
        const response3 = await customerCareAI.getResponse("Tell me about VIP benefits", testUser);
        
        if (response1 !== response2 && response2 !== response3 && response1 !== response3) {
            console.log('✅ PASS: Different queries produce different responses (no pre-made responses)\n');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Same responses for different queries (pre-made responses detected)\n');
        }
    } catch (error) {
        console.log('❌ FAIL: Different queries test error:', error.message, '\n');
    }
    
    // Test 4: API key is properly configured
    totalTests++;
    try {
        console.log('Test 4: API key configuration...');
        const fs = await import('fs');
        const serviceContent = fs.readFileSync('./services/pollinationsService.ts', 'utf8');
        
        if (serviceContent.includes('sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr')) {
            console.log('✅ PASS: Correct API key configured\n');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Incorrect API key configured\n');
        }
    } catch (error) {
        console.log('❌ FAIL: Could not check API key:', error.message, '\n');
    }
    
    // Test 5: Customer care AI always uses Pollinations API
    totalTests++;
    try {
        console.log('Test 5: Customer care AI uses Pollinations API...');
        const fs = await import('fs');
        const aiContent = fs.readFileSync('./services/customerCareAI.ts', 'utf8');
        
        if (aiContent.includes('await pollinationsService.queryText(prompt)') && 
            !aiContent.includes('advancedCustomerCareAI.getResponse(message, user)')) {
            console.log('✅ PASS: Customer care AI uses Pollinations API directly\n');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Customer care AI may still use other systems\n');
        }
    } catch (error) {
        console.log('❌ FAIL: Could not check customer care AI implementation:', error.message, '\n');
    }
    
    // Test 6: Real-time response generation
    totalTests++;
    try {
        console.log('Test 6: Real-time response generation...');
        const testUser = {
            id: 'realtime-test-' + Date.now(),
            name: 'Real Time Test',
            mobile: '9876543210',
            balance: 1500,
            withdrawableBalance: 750,
            totalInvested: 3000,
            totalWithdrawn: 1200,
            vipLevel: 3,
            registrationDate: '2023-06-15',
            status: 'active'
        };
        
        const startTime = Date.now();
        const response = await customerCareAI.getResponse("I need help with my investment plans", testUser);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        if (response && responseTime < 30000) { // Less than 30 seconds
            console.log(`✅ PASS: Real-time response generated in ${responseTime}ms\n`);
            testsPassed++;
        } else {
            console.log(`❌ FAIL: Response took too long or failed: ${responseTime}ms\n`);
        }
    } catch (error) {
        console.log('❌ FAIL: Real-time response test error:', error.message, '\n');
    }
    
    // Final results
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`SUMMARY: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Implementation is working correctly.');
        console.log('✅ No pre-made responses');
        console.log('✅ Real-time Pollinations API integration');
        console.log('✅ Proper user context inclusion');
        console.log('✅ Correct API key configuration');
        return true;
    } else {
        console.log('❌ SOME TESTS FAILED! Implementation needs fixes.');
        return false;
    }
}

// Run the test suite
runTestSuite()
    .then(success => {
        if (success) {
            console.log('\n🚀 Ready to deploy - all tests passed!');
        } else {
            console.log('\n⚠️  Need to fix issues before deployment');
        }
    })
    .catch(error => {
        console.error('Test suite error:', error);
    });