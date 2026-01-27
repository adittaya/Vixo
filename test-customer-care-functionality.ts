import { customerCareAI } from './services/customerCareAI';

// Test the Customer Care AI implementation
async function testCustomerCareAI() {
  console.log('Testing Customer Care AI...\n');

  // Test 1: Password-related query
  console.log('=== Test 1: Password-related query ===');
  const passwordMessage = "I forgot my password, please help me reset it.";
  console.log('Sending message:', passwordMessage);
  try {
    const response = await customerCareAI.getResponse(passwordMessage);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n---\n');

  // Test 2: Withdrawal query (should trigger verification)
  console.log('=== Test 2: Withdrawal query ===');
  const withdrawalMessage = "I want to withdraw money from my account.";
  console.log('Sending message:', withdrawalMessage);
  try {
    const response = await customerCareAI.getResponse(withdrawalMessage);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n---\n');

  // Test 3: General investment query
  console.log('=== Test 3: General investment query ===');
  const investmentMessage = "How can I increase my daily returns?";
  console.log('Sending message:', investmentMessage);
  try {
    const response = await customerCareAI.getResponse(investmentMessage);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n---\n');

  // Test 4: Hinglish query
  console.log('=== Test 4: Hinglish query ===');
  const hinglishMessage = "Mujhe apne account ka balance pata karna hai aur kaise recharge karna hai ye bhi batado.";
  console.log('Sending message:', hinglishMessage);
  try {
    const response = await customerCareAI.getResponse(hinglishMessage);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n---\n');

  // Test 5: Check if password-related
  console.log('=== Test 5: Password-related detection ===');
  const testMessage1 = "I forgot my password";
  const testMessage2 = "My password is not working";
  const testMessage3 = "How to invest money?";
  
  console.log(`${testMessage1} -> isPasswordRelated: ${customerCareAI.isPasswordRelated(testMessage1)}`);
  console.log(`${testMessage2} -> isPasswordRelated: ${customerCareAI.isPasswordRelated(testMessage2)}`);
  console.log(`${testMessage3} -> isPasswordRelated: ${customerCareAI.isPasswordRelated(testMessage3)}`);

  console.log('\n---\n');

  // Test 6: Check if verification required
  console.log('=== Test 6: Verification detection ===');
  const testMessage4 = "I want to withdraw money";
  const testMessage5 = "How to check my balance?";
  const testMessage6 = "I need to transfer funds";
  
  console.log(`${testMessage4} -> requiresVerification: ${customerCareAI.requiresVerification(testMessage4)}`);
  console.log(`${testMessage5} -> requiresVerification: ${customerCareAI.requiresVerification(testMessage5)}`);
  console.log(`${testMessage6} -> requiresVerification: ${customerCareAI.requiresVerification(testMessage6)}`);

  console.log('\n---\n');

  // Test 7: Password response
  console.log('=== Test 7: Password response ===');
  console.log('Password response:', customerCareAI.getPasswordResponse());

  console.log('\n---\n');

  // Test 8: Verification request
  console.log('=== Test 8: Verification request ===');
  console.log('Verification request for withdrawal:', customerCareAI.generateVerificationRequest("I want to withdraw money"));

  console.log('\n\nAll tests completed successfully!');
}

// Run the test
testCustomerCareAI().catch(console.error);