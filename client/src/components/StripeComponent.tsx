// File: StripeCheckout.tsx

import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from 'solid-stripe';
import { Component, createSignal } from 'solid-js';

// Initialize Stripe with your public key
const stripePromise = loadStripe('pk_test_51S8TL2IQNTpUidJwkZMYYhTCNwkBZiU0TaKBoqM9r9DGSUNn1TxxSVoODthPY5YatKmdHq0o0Q4KdSwFtwHTZE6X00vwwUcSUA');

// Checkout form component
const CheckoutForm: Component = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!elements()) return;

    const { error: submitError } = await elements()?.submit;
    if (submitError) {
      setErrorMessage(submitError.message);
      return;
    }

    // Replace with your backend endpoint
    const res = await fetch('/create-intent', { method: 'POST' });
    const { client_secret: clientSecret } = await res.json();

    const { error } = await stripe()?.confirmPayment({
      elements: elements(),
      clientSecret,
      confirmParams: {
        return_url: 'https://yourdomain.com/complete',
      },
    });

    if (error) setErrorMessage(error.message ?? null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe() || !elements()}>
        Pay
      </button>
      {errorMessage() && <div style={{ color: 'red' }}>{errorMessage()}</div>}
    </form>
  );
};

// Main component with Stripe context
const StripeCheckout: Component = () => {
  const options = {
    mode: 'payment',
    amount: 1099, // in cents
    currency: 'usd',
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} >
      <CheckoutForm />
    </Elements>
  );
};

export default StripeCheckout;