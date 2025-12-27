import axios from 'axios';

// Configure axios instance for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create Stripe payment intent for a challenge
 * @param {string} userId - User's Firebase UID
 * @param {number} challengeId - Challenge ID
 * @param {number} amount - Amount in USD (will be converted to cents)
 * @param {string} idempotencyKey - Unique key to prevent duplicate charges
 * @returns {Promise} Payment intent data with clientSecret
 */
export const createPaymentIntent = async (userId, challengeId, amount, idempotencyKey) => {
  try {
    const response = await apiClient.post('/payments/create-intent', {
      userId,
      challengeId,
      amount: Math.round(amount * 100), // Convert to cents
      idempotencyKey: idempotencyKey || `${userId}_${challengeId}_${Date.now()}`,
    });

    if (!response.data || !response.data.clientSecret) {
      throw new Error('Invalid response from payment server');
    }

    return response.data;
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to create payment intent'
    );
  }
};

/**
 * Confirm payment with Stripe
 * @param {object} stripe - Stripe instance
 * @param {string} clientSecret - Payment intent client secret
 * @param {object} elements - Stripe Elements instance
 * @returns {Promise} Confirmation result
 */
export const confirmPayment = async (stripe, clientSecret, elements) => {
  try {
    const cardElement = elements.getElement('card');

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          // Add billing details if needed
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  } catch (error) {
    console.error('Confirm payment error:', error);
    throw error;
  }
};

/**
 * Get user's subscription status
 * @param {string} userId - User's Firebase UID
 * @returns {Promise} Subscription data
 */
export const getSubscription = async (userId) => {
  try {
    const response = await apiClient.get(`/subscriptions/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get subscription error:', error);
    return null;
  }
};

/**
 * Update user's subscription plan
 * @param {string} userId - User's Firebase UID
 * @param {string} planId - Stripe plan ID
 * @returns {Promise} Updated subscription
 */
export const updateSubscription = async (userId, planId) => {
  try {
    const response = await apiClient.post('/subscriptions/update', {
      userId,
      planId,
    });
    return response.data;
  } catch (error) {
    console.error('Update subscription error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to update subscription'
    );
  }
};

/**
 * Cancel user's subscription
 * @param {string} userId - User's Firebase UID
 * @returns {Promise}
 */
export const cancelSubscription = async (userId) => {
  try {
    await apiClient.post('/subscriptions/cancel', { userId });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to cancel subscription'
    );
  }
};

/**
 * Get payment history
 * @param {string} userId - User's Firebase UID
 * @returns {Promise} Array of transactions
 */
export const getPaymentHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/payments/history/${userId}`);
    return response.data || [];
  } catch (error) {
    console.error('Get payment history error:', error);
    return [];
  }
};

/**
 * Verify payment completion (for local testing)
 * Simulates successful payment without Stripe
 * @param {number} amount - Amount in USD
 * @returns {Promise} Success indicator
 */
export const simulatePayment = async (amount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        amount,
        transactionId: `sim_${Date.now()}`,
      });
    }, 1500);
  });
};