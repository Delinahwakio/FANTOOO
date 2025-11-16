/**
 * Custom Error Classes
 * 
 * Defines application-specific errors for better error handling
 */

/**
 * Error thrown when a user has insufficient credits to send a message
 */
export class InsufficientCreditsError extends Error {
  constructor(
    public required: number,
    public available: number
  ) {
    super(`Insufficient credits: need ${required}, have ${available}`);
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Generic API error with status code and error code
 */
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Error thrown when a chat is not found
 */
export class ChatNotFoundError extends Error {
  constructor(chatId: string) {
    super(`Chat not found: ${chatId}`);
    this.name = 'ChatNotFoundError';
  }
}

/**
 * Error thrown when a user is not found
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Error thrown when a transaction fails
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Error thrown when a fictional user is not found
 */
export class FictionalUserNotFoundError extends Error {
  constructor(fictionalUserId: string) {
    super(`Fictional user not found: ${fictionalUserId}`);
    this.name = 'FictionalUserNotFoundError';
  }
}

/**
 * Error thrown when a user is not authorized to perform an action
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error thrown when a database operation fails
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
    
    // Include original error message if available
    if (originalError?.message) {
      this.message = `${message}: ${originalError.message}`;
    }
  }
}

/**
 * Error thrown when payment processing fails
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Error thrown when webhook signature verification fails
 */
export class WebhookVerificationError extends Error {
  constructor(message: string = 'Invalid webhook signature') {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

/**
 * Error thrown when a credit package is not found
 */
export class PackageNotFoundError extends Error {
  constructor(packageId: string) {
    super(`Credit package not found: ${packageId}`);
    this.name = 'PackageNotFoundError';
  }
}
