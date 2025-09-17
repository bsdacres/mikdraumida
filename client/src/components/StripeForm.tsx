// components/StripeForm.tsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripeForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const card = elements?.getElement(CardElement);
    if (!stripe || !card) return;

    // You should retrieve the clientSecret from your backend or props
    const clientSecret = ""; // TODO: Replace with actual client secret value

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: {
          name: 'Customer Name',
        },
      },
    });

    if (result.error) {
      console.error(result.error.message);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">Pay</button>
    </form>
  );
}