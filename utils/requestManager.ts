/**
 * Unique request ID generator
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Request manager to handle pending requests
 */
class RequestManager {
  private pendingRequests: Map<string, AbortController> = new Map();

  /**
   * Add a request to the pending list
   */
  addRequest(requestId: string): AbortController {
    // Cancel any existing request with the same ID
    this.cancelRequest(requestId);
    
    const controller = new AbortController();
    this.pendingRequests.set(requestId, controller);
    return controller;
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(requestId: string): void {
    const controller = this.pendingRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    for (const [requestId, controller] of this.pendingRequests) {
      controller.abort();
    }
    this.pendingRequests.clear();
  }

  /**
   * Get abort signal for a request
   */
  getSignal(requestId: string): AbortSignal | null {
    const controller = this.pendingRequests.get(requestId);
    return controller ? controller.signal : null;
  }

  /**
   * Remove a completed request
   */
  removeRequest(requestId: string): void {
    this.pendingRequests.delete(requestId);
  }
}

export const requestManager = new RequestManager();