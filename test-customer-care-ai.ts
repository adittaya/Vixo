import { customerCareAI } from './services/customerCareAI';

// Test the Customer Care AI implementation
async function testCustomerCareAI() {
  console.log('Testing Customer Care AI...\n');
  
  const testMessage = "Hello, I need help with my investment account. How can I increase my daily returns?";
  
  console.log('Sending message:', testMessage);
  console.log('\nStreaming response:\n');
  
  try {
    // Test streaming response
    for await (const chunk of customerCareAI.getResponseStream(testMessage)) {
      process.stdout.write(chunk);
    }
    
    console.log('\n\n---\n');
    
    // Test complete response
    console.log('\nGetting complete response:\n');
    const completeResponse = await customerCareAI.getResponse(testMessage);
    console.log(completeResponse);
    
    console.log('\n\nTest completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Also create a simple test for a basic query
async function testBasicQuery() {
  console.log('\n---\nTesting basic query...\n');
  
  const basicMessage = "What is the meaning of life?";
  
  console.log('Sending message:', basicMessage);
  const response = await customerCareAI.getResponse(basicMessage);
  console.log('Response:', response);
}

// Run tests
testCustomerCareAI();
setTimeout(testBasicQuery, 2000); // Delay to avoid rate limits