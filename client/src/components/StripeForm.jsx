import { createSignal } from 'solid-js';
import { loadStripe } from '@stripe/stripe-js';
import { useContext } from "solid-js"
import { CartContext } from "~/context/cart"
import { sdk } from '~/lib/medusa';

import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from 'solid-stripe';



const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const cartContext = useContext(CartContext);
  const cart = cartContext?.cart;
  console.log("cart in stripeform", cart)
  console.log(cart?.payment_collection?.payment_sessions?.[0].data.client_secret)

sdk.store.payment.initiatePaymentSession(
  cart?.id, // assuming you already have the cart object.
  {
    provider_id: "stripe",
    data: {
      // any data relevant for the provider.
    }
  }
)
.then(({ payment_collection }) => {
  console.log(payment_collection)
})



  const [errorMessage, setErrorMessage] = createSignal(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (elements() === null) {
      return;
    }

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements().submit();
    if (submitError) {
      // Show error to your customer
      setErrorMessage(submitError.message);
      return;
    }

    // Create the PaymentIntent and obtain clientSecret from your server endpoint

   const clientSecret = cart?.payment_collection?.payment_sessions?.[0].data.client_secret


    await stripe()?.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements: elements() ?? undefined,
      clientSecret: cart?.payment_collection?.payment_sessions?.[0].data.client_secret,
      confirmParams: {
        return_url: 'https://localhost:3000/home',
      },
    });

    if (error) {
      // This point will only be reached if there is an immediate error when
      // confirming the payment. Show error to your customer (for example, payment
      // details incomplete)
      setErrorMessage(error.message);
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe() || !elements()}>
        Pay
      </button>
      {/* Show error message to your customers */}
      {errorMessage() && <div>{errorMessage()}</div>}
    </form>
  );
};

const options = {
  mode: 'payment',
  amount: 1099,
  currency: 'usd',
  // Fully customizable with appearance API.
  appearance: {
     theme: 'night',
     labels: 'floating'
  },
};

export default function stripeForm() {
  const stripePromise = loadStripe('pk_live_cTcfR3gjqBCMEH9aErI2g3N3');

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  )
};

