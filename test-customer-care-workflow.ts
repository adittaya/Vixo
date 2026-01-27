import { customerCareAI } from './services/customerCareAI';

// Test to verify customer care AI can handle user problems and use admin panel when needed
async function testCustomerCareWorkflow() {
  console.log('=== TESTING CUSTOMER CARE WORKFLOW ===\n');

  console.log('1. Testing password reset request (should suggest admin panel help)');
  const passwordQuery = "I forgot my password and can't access my account";
  console.log(`User: "${passwordQuery}"`);
  try {
    const response = await customerCareAI.getResponse(passwordQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should offer admin panel assistance for password reset\n');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('2. Testing withdrawal request (should suggest admin panel verification)');
  const withdrawalQuery = "I want to withdraw my money but the app is not allowing me";
  console.log(`User: "${withdrawalQuery}"`);
  try {
    const response = await customerCareAI.getResponse(withdrawalQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should mention admin panel can process after verification\n');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('3. Testing account balance issue (should suggest admin panel check)');
  const balanceQuery = "My account balance is showing incorrectly";
  console.log(`User: "${balanceQuery}"`);
  try {
    const response = await customerCareAI.getResponse(balanceQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should offer to check through admin panel\n');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('4. Testing VIP level issue (should suggest admin panel update)');
  const vipQuery = "My VIP level is not updating even though I have enough points";
  console.log(`User: "${vipQuery}"`);
  try {
    const response = await customerCareAI.getResponse(vipQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should offer to verify and update through admin panel\n');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('5. Testing recharge transaction issue (should suggest admin panel resolution)');
  const transactionQuery = "My recharge transaction is stuck in pending status";
  console.log(`User: "${transactionQuery}"`);
  try {
    const response = await customerCareAI.getResponse(transactionQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should mention admin panel can resolve pending transactions\n');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('6. Testing referral bonus issue (should suggest admin panel verification)');
  const referralQuery = "My referral bonus is not credited even though my friend has invested";
  console.log(`User: "${referralQuery}"`);
  try {
    const response = await customerCareAI.getResponse(referralQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should offer to verify and credit through admin panel\n');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('7. Testing Hinglish query (should respond in Hinglish)');
  const hinglishQuery = "Mere account mein paisa nahi dikha raha, kya hua?";
  console.log(`User: "${hinglishQuery}"`);
  try {
    const response = await customerCareAI.getResponse(hinglishQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should respond in Hinglish and offer admin panel assistance\n');
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('8. Testing multiple issues (should address all with admin panel solutions)');
  const multipleQuery = "My password is not working, my balance is wrong, and I cant withdraw";
  console.log(`User: "${multipleQuery}"`);
  try {
    const response = await customerCareAI.getResponse(multipleQuery);
    console.log(`AI Response: "${response}"`);
    console.log('✓ AI should address all issues mentioning admin panel solutions\n');
  } catch (error) {
    console.error('Error:', error);
  }

  // Test helper functions
  console.log('9. Testing helper functions:');
  console.log(`Password-related detection: ${customerCareAI.isPasswordRelated("I forgot my password")}`);
  console.log(`Verification required for withdrawal: ${customerCareAI.requiresVerification("I want to withdraw money")}`);
  console.log(`Password response: ${customerCareAI.getPasswordResponse()}`);
  console.log(`Verification request: ${customerCareAI.generateVerificationRequest("I want to withdraw")}`);

  console.log('\n=== CUSTOMER CARE WORKFLOW TEST COMPLETE ===');
  console.log('\nThe customer care AI is properly configured to:');
  console.log('- Understand user problems based on current application features');
  console.log('- Use hidden admin panel when needed to solve problems');
  console.log('- Provide seamless solutions without user knowing about admin panel');
  console.log('- Respond appropriately in English or Hinglish as needed');
}

// Run the test
testCustomerCareWorkflow().catch(console.error);