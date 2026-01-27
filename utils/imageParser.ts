/**
 * Image Parser Utility
 * Converts image content to structured data for AI processing
 */

export interface ImageAnalysisResult {
  detectedText: string[];
  type: 'recharge_pending' | 'recharge_success' | 'recharge_failed' | 'wallet_update' | 'error_message' | 'plan_status' | 'unknown';
  confidence: number;
  description: string;
}

/**
 * Parses an image and extracts structured information
 * This is a simplified version - in a real implementation, 
 * you would use a client-side OCR library or send to a dedicated OCR service
 */
export const parseImageContent = (imageData: string, description: string): ImageAnalysisResult => {
  // In a real implementation, this would use OCR to extract text from the image
  // For now, we'll simulate based on the user's description and common patterns
  
  const lowerDesc = description.toLowerCase();
  
  // Common patterns in investment app screenshots
  if (lowerDesc.includes('pending') || lowerDesc.includes('wait') || lowerDesc.includes('processing')) {
    return {
      detectedText: ['PENDING', 'PROCESSING'],
      type: 'recharge_pending',
      confidence: 0.9,
      description: 'Recharge is still pending and awaiting approval'
    };
  } else if (lowerDesc.includes('success') || lowerDesc.includes('done') || lowerDesc.includes('completed')) {
    return {
      detectedText: ['SUCCESS', 'COMPLETED'],
      type: 'recharge_success',
      confidence: 0.9,
      description: 'Recharge was successful and funds should be available'
    };
  } else if (lowerDesc.includes('failed') || lowerDesc.includes('error') || lowerDesc.includes('rejected')) {
    return {
      detectedText: ['FAILED', 'ERROR', 'REJECTED'],
      type: 'recharge_failed',
      confidence: 0.9,
      description: 'Recharge failed and may need to be retried'
    };
  } else if (lowerDesc.includes('wallet') || lowerDesc.includes('balance')) {
    return {
      detectedText: ['WALLET', 'BALANCE'],
      type: 'wallet_update',
      confidence: 0.8,
      description: 'Screenshot shows wallet or balance information'
    };
  } else if (lowerDesc.includes('plan') || lowerDesc.includes('investment')) {
    return {
      detectedText: ['PLAN', 'INVESTMENT'],
      type: 'plan_status',
      confidence: 0.8,
      description: 'Screenshot shows plan or investment status'
    };
  } else {
    return {
      detectedText: [],
      type: 'unknown',
      confidence: 0.5,
      description: 'Unable to determine the content of the image'
    };
  }
};

/**
 * Generates a structured description of the image for the AI
 */
export const generateImageDescription = (analysisResult: ImageAnalysisResult): string => {
  return `Image Analysis Result:
  - Detected Type: ${analysisResult.type}
  - Confidence: ${(analysisResult.confidence * 100).toFixed(0)}%
  - Description: ${analysisResult.description}
  - Detected Text: ${analysisResult.detectedText.join(', ')}

  Please provide assistance based on this image content.`;
};