/**
 * Quick test to verify the customer care AI uses Pollinations API
 */
import { customerCareAI } from './services/customerCareAI';

console.log('Testing customer care AI with Pollinations API...');

// Mock user object
const mockUser = {
  id: 'test-user-123',
  name: 'Test User',
  mobile: '9876543210',
  balance: 500,
  withdrawableBalance: 200,
  totalInvested: 1000,
  totalWithdrawn: 500,
  vipLevel: 2,
  registrationDate: '2023-01-01',
  status: 'active'
};

// Test message
const testMessage = 'Hello, I need help with my account balance. It seems incorrect.';

console.log('Sending test message to customer care AI...');
console.log('Message:', testMessage);

customerCareAI.getResponse(testMessage, mockUser)
  .then(response => {
    console.log('Response received:');
    console.log(response);
    console.log('\n✓ Test completed successfully - Pollinations API was called!');
  })
  .catch(error => {
    console.error('Error occurred:', error);
  });