import { customerCareAI } from './services/customerCareAI';

// Comprehensive test for customer care AI with admin panel access
async function testComprehensiveCustomerCare() {
  console.log('=== COMPREHENSIVE CUSTOMER CARE AI TEST ===\n');

  // Test 1: Password reset request
  console.log('1. PASSWORD RESET REQUEST');
  console.log('User: "I forgot my password and cannot access my account."');
  try {
    const response = await customerCareAI.getResponse("I forgot my password and cannot access my account.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should offer to help through admin panel with verification\n');

  // Test 2: Account access issue
  console.log('2. ACCOUNT ACCESS ISSUE');
  console.log('User: "My account is locked and I need help accessing it."');
  try {
    const response = await customerCareAI.getResponse("My account is locked and I need help accessing it.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should offer admin panel assistance\n');

  // Test 3: Withdrawal issue
  console.log('3. WITHDRAWAL REQUEST');
  console.log('User: "I want to withdraw money but the app is not letting me."');
  try {
    const response = await customerCareAI.getResponse("I want to withdraw money but the app is not letting me.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should mention admin panel can process after verification\n');

  // Test 4: Balance discrepancy
  console.log('4. BALANCE DISCREPANCY');
  console.log('User: "My balance shows wrong amount, please check."');
  try {
    const response = await customerCareAI.getResponse("My balance shows wrong amount, please check.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should offer to check through admin panel\n');

  // Test 5: VIP level issue
  console.log('5. VIP LEVEL ISSUE');
  console.log('User: "I should have VIP level 3 but it shows VIP level 1."');
  try {
    const response = await customerCareAI.getResponse("I should have VIP level 3 but it shows VIP level 1.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should offer to verify and update through admin panel\n');

  // Test 6: Transaction issue
  console.log('6. TRANSACTION ISSUE');
  console.log('User: "My recharge transaction is stuck in pending status."');
  try {
    const response = await customerCareAI.getResponse("My recharge transaction is stuck in pending status.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should mention admin panel can resolve pending transactions\n');

  // Test 7: Referral issue
  console.log('7. REFERRAL ISSUE');
  console.log('User: "My referral bonus is not credited even though my friend has invested."');
  try {
    const response = await customerCareAI.getResponse("My referral bonus is not credited even though my friend has invested.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should offer to verify and credit through admin panel\n');

  // Test 8: Investment plan issue
  console.log('8. INVESTMENT PLAN ISSUE');
  console.log('User: "My investment plan is not showing returns as promised."');
  try {
    const response = await customerCareAI.getResponse("My investment plan is not showing returns as promised.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should offer to check plan status through admin panel\n');

  // Test 9: Hinglish query
  console.log('9. HINGLISH QUERY');
  console.log('User: "Mere account mein paisa nahi dikha raha, kya hua?"');
  try {
    const response = await customerCareAI.getResponse("Mere account mein paisa nahi dikha raha, kya hua?");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should respond in Hinglish and offer admin panel assistance\n');

  // Test 10: Multiple issues
  console.log('10. MULTIPLE ISSUES');
  console.log('User: "My password is not working, my balance is wrong, and I cant withdraw."');
  try {
    const response = await customerCareAI.getResponse("My password is not working, my balance is wrong, and I cant withdraw.");
    console.log('AI Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
  console.log('Expected: AI should address all issues mentioning admin panel solutions\n');

  // Test password detection
  console.log('\n11. PASSWORD DETECTION TEST');
  console.log('Password-related query detected:', customerCareAI.isPasswordRelated("I forgot my password"));
  console.log('Non-password query detected:', customerCareAI.isPasswordRelated("How are you?"));
  
  // Test verification detection
  console.log('\n12. VERIFICATION DETECTION TEST');
  console.log('Withdrawal requires verification:', customerCareAI.requiresVerification("I want to withdraw"));
  console.log('General query requires verification:', customerCareAI.requiresVerification("How are you?"));

  // Test admin panel access check
  console.log('\n13. ADMIN PANEL ACCESS TEST');
  const mockUser = { id: '123', name: 'Test User', role: 'admin' };
  console.log('Mock admin user has admin access:', customerCareAI.isAdmin(mockUser));
  const mockRegularUser = { id: '456', name: 'Regular User', role: 'user' };
  console.log('Mock regular user has admin access:', customerCareAI.isAdmin(mockRegularUser));

  console.log('\n=== COMPREHENSIVE TEST COMPLETE ===');
}

// Run the comprehensive test
testComprehensiveCustomerCare().catch(console.error);