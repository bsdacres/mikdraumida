import { useContext, createSignal, createEffect, For, Show, onMount } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { CartContext } from "~/context/cart"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "~/lib/medusa"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "solid-stripe"

const STRIPE_PUBLIC_KEY = "pk_live_cTcfR3gjqBCMEH9aErI2g3N3"
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

// Stripe Checkout Form Component
function StripeCheckoutForm(props: { clientSecret: string; cartId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [processing, setProcessing] = createSignal(false)
  const navigate = useNavigate()
  const context = useContext(CartContext)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    
    const stripeInstance = stripe()
    const elementsInstance = elements()
    
    if (!stripeInstance || !elementsInstance) {
      return
    }

    setProcessing(true)
    setErrorMessage(null)

    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elementsInstance.submit()
      if (submitError) {
        setErrorMessage(submitError.message || "Validation failed")
        setProcessing(false)
        return
      }

      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripeInstance.confirmPayment({
        elements: elementsInstance,
        clientSecret: props.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      })

      if (error) {
        // Payment failed - show error to customer
        setErrorMessage(error.message || "Payment failed")
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded - now complete the cart in Medusa
        try {
          const data = await sdk.store.cart.complete(props.cartId)
          
          if (data.type === "cart" && data.cart) {
            // Cart completion failed
            console.error("Cart completion error:", data.error)
            const errorMsg = typeof data.error === 'string' ? data.error : (data.error as any)?.message || "Failed to complete order. Please contact support."
            setErrorMessage(errorMsg)
            setProcessing(false)
          } else if (data.type === "order" && data.order) {
            // Order placed successfully!
            console.log("Order placed:", data.order)
            
            // Clear cart_id from localStorage since cart is no longer usable
            localStorage.removeItem("cart_id")
            
            // Refresh cart context to clear it
            context?.refreshCart()
            
            // Redirect to success page with order ID
            navigate(`/checkout/success?order_id=${data.order.id}`)
          }
        } catch (completeError) {
          console.error("Error completing order:", completeError)
          setErrorMessage("Payment received but order completion failed. Please contact support.")
          setProcessing(false)
        }
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        // Additional authentication required (3D Secure, etc.)
        // Stripe will handle the redirect automatically
        setErrorMessage("Additional authentication required. Please complete the verification.")
        setProcessing(false)
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred")
      setProcessing(false)
    }
  }

  return (
    <div class="stripe-checkout-container">
      <div class="stripe-form-wrapper">
        <div class="stripe-header">
          <div class="stripe-logo">
            <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="60" height="25">
              <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.48zm-3.67-3.07c0-1.5-.61-2.65-2.23-2.65-1.35 0-2.23 1.13-2.37 2.65h4.6zM24.35 5.3l-.07 3.57a5.15 5.15 0 0 0-1.42-.2c-2.06 0-3.3 1.13-3.3 4.33v7.23h-4.17V5.67h3.82l.13 2.14c.76-1.66 2.17-2.5 3.8-2.5.43 0 .86.04 1.21.1v-.1zM4.17 7.42c0-1.03.87-1.43 1.85-1.43.93 0 2.14.48 3.1 1.33V3.49c-1.1-.5-2.16-.73-3.1-.73C2.85 2.76 0 4.56 0 7.85c0 5.05 6.18 4.23 6.18 6.42 0 1.21-1.05 1.61-2.1 1.61-1.2 0-2.63-.63-3.8-1.48v3.97a8.2 8.2 0 0 0 3.8.93c3.28 0 6.3-1.36 6.3-4.92 0-5.44-6.2-4.47-6.2-6.55zM16.5 2.17v3.65h2.56v3.32H16.5v6.05c0 1.98 1.3 2.25 2.34 2.25.5 0 .87-.04 1.4-.16v3.45c-.53.18-1.26.31-2.11.31-3.45 0-5.8-2.3-5.8-5.85V9.14H9.66v-.1l3.98-4.3V2.17h2.86zm21.5 3.33v14.73h-3.82l-.13-1.66c-.95 1.37-2.4 2.02-4.12 2.02-3.76 0-6.63-3.05-6.63-7.56s2.87-7.7 6.63-7.7c1.55 0 2.94.56 3.84 1.66V5.5h4.23zm-4.06 7.24c0-2.54-1.45-4.15-3.41-4.15-1.96 0-3.43 1.65-3.43 4.24 0 2.57 1.47 4.15 3.43 4.15 1.96 0 3.41-1.66 3.41-4.24z"/>
            </svg>
          </div>
          <h2 class="stripe-title">Complete your payment</h2>
          <p class="stripe-subtitle">Secure payment powered by Stripe</p>
        </div>
        
        <form onSubmit={handleSubmit} class="stripe-form">
          <div class="payment-element-container">
            <PaymentElement />
          </div>
          
          <Show when={errorMessage()}>
            <div class="stripe-error">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>{errorMessage()}</span>
            </div>
          </Show>
          
          <button
            type="submit"
            disabled={!stripe() || !elements() || processing()}
            class="stripe-pay-button"
          >
            <Show when={processing()} fallback="Pay Now">
              <span class="spinner"></span>
              Processing...
            </Show>
          </button>
          
          <div class="stripe-secure-badge">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <span>Secured with SSL encryption</span>
          </div>
        </form>
      </div>
      
      <style>{`
        .stripe-checkout-container {
          max-width: 480px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        
        .stripe-form-wrapper {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(0, 0, 0, 0.05);
          padding: 2rem;
          border: 1px solid rgba(99, 91, 255, 0.1);
        }
        
        .stripe-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .stripe-logo {
          margin-bottom: 1rem;
        }
        
        .stripe-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 0.5rem 0;
        }
        
        .stripe-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }
        
        .stripe-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .payment-element-container {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }
        
        .stripe-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 0.875rem;
        }
        
        .stripe-pay-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99, 91, 255, 0.4);
        }
        
        .stripe-pay-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 91, 255, 0.5);
        }
        
        .stripe-pay-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .stripe-secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          color: #6b7280;
          font-size: 0.75rem;
        }
        
        .stripe-secure-badge svg {
          color: #10b981;
        }
      `}</style>
    </div>
  )
}

// Stripe Payment Wrapper with Elements Provider
function StripePaymentUI(props: { clientSecret: string; cartId: string; amount: number; currency: string }) {
  const options = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#635BFF",
        colorBackground: "#ffffff",
        colorText: "#1a1a2e",
        colorDanger: "#dc2626",
        fontFamily: "system-ui, -apple-system, sans-serif",
        borderRadius: "8px",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": {
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        },
        ".Input:focus": {
          border: "1px solid #635BFF",
          boxShadow: "0 0 0 3px rgba(99, 91, 255, 0.1)",
        },
        ".Label": {
          fontWeight: "500",
          color: "#374151",
        },
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm clientSecret={props.clientSecret} cartId={props.cartId} />
    </Elements>
  )
}

// Manual Payment Component with Place Order button
function ManualPaymentUI(props: { cartId: string }) {
  const [placingOrder, setPlacingOrder] = createSignal(false)
  const [orderError, setOrderError] = createSignal<string | null>(null)
  const navigate = useNavigate()
  const context = useContext(CartContext)

  const handlePlaceOrder = async (e: Event) => {
    e.preventDefault()
    if (!props.cartId) return

    setPlacingOrder(true)
    setOrderError(null)

    try {
      const data = await sdk.store.cart.complete(props.cartId)

      if (data.type === "cart" && data.cart) {
        // Cart completion failed
        console.error("Cart completion error:", data.error)
        const errorMsg = typeof data.error === 'string' ? data.error : (data.error as any)?.message || "Failed to complete order. Please try again."
        setOrderError(errorMsg)
        setPlacingOrder(false)
      } else if (data.type === "order" && data.order) {
        // Order placed successfully!
        console.log("Order placed:", data.order)

        // Clear cart_id from localStorage since cart is no longer usable
        localStorage.removeItem("cart_id")

        // Refresh cart context
        context?.refreshCart()

        // Redirect to success page with order ID
        navigate(`/checkout/success?order_id=${data.order.id}`)
      }
    } catch (err) {
      console.error("Error placing order:", err)
      setOrderError("An unexpected error occurred. Please try again.")
      setPlacingOrder(false)
    }
  }

  return (
    <div class="manual-payment-container">
      <div class="manual-payment-card">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#10b981">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <h3>Manual Payment Selected</h3>
        <p>Your order will be processed manually. Click below to place your order.</p>
        
        <Show when={orderError()}>
          <div class="manual-error">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{orderError()}</span>
          </div>
        </Show>
        
        <button
          onClick={handlePlaceOrder}
          disabled={placingOrder()}
          class="place-order-btn"
        >
          <Show when={placingOrder()} fallback="Place Order">
            <span class="btn-spinner"></span>
            Placing Order...
          </Show>
        </button>
      </div>
      <style>{`
        .manual-payment-container {
          max-width: 480px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        .manual-payment-card {
          background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #10b981;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
        }
        .manual-payment-card h3 {
          color: #065f46;
          margin: 1rem 0 0.5rem 0;
        }
        .manual-payment-card p {
          color: #047857;
          margin: 0 0 1.5rem 0;
        }
        .manual-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .place-order-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }
        .place-order-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
        }
        .place-order-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function CheckoutPaymentStep() {
  const context = useContext(CartContext)
  const navigate = useNavigate()
  const [paymentProviders, setPaymentProviders] = createSignal<
    HttpTypes.StorePaymentProvider[]
  >([])
  const [
    selectedPaymentProvider,
    setSelectedPaymentProvider,
  ] = createSignal<string | undefined>()
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [cartData, setCartData] = createSignal<any>(null)

  // Helper to get cart ID
  const getCartId = () => {
    const contextCart = context?.cart
    if (contextCart?.id) return contextCart.id
    return localStorage.getItem("cart_id")
  }

  // Load payment providers on mount
  onMount(async () => {
    // Wait a bit for context to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const cartId = getCartId()
    console.log("Payment page - Cart ID:", cartId)
    
    if (!cartId) {
      setError("No cart found. Please add items to your cart first.")
      setLoading(false)
      return
    }

    try {
      // First retrieve the cart to get region_id
      const { cart } = await sdk.store.cart.retrieve(cartId)
      setCartData(cart)
      console.log("Cart data:", cart)
      
      if (!cart.region_id) {
        setError("Cart region not set. Please go back and set your address.")
        setLoading(false)
        return
      }

      // Get payment providers for this region
      const { payment_providers } = await sdk.store.payment.listPaymentProviders({
        region_id: cart.region_id,
      })
      console.log("Payment providers:", payment_providers)
      setPaymentProviders(payment_providers)
      
      // Check if there's already a payment session
      if (cart.payment_collection?.payment_sessions?.[0]?.provider_id) {
        setSelectedPaymentProvider(cart.payment_collection.payment_sessions[0].provider_id)
      }
    } catch (err) {
      console.error("Error loading payment providers:", err)
      setError("Failed to load payment options. Please try again.")
    } finally {
      setLoading(false)
    }
  })

  const handleSelectProvider = async (e: Event) => {
    e.preventDefault()
    const cartId = getCartId()
    const providerId = selectedPaymentProvider()
    
    if (!cartId || !providerId) {
      setError("Please select a payment method")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Initialize payment session with the selected provider
      await sdk.store.payment.initiatePaymentSession(cartData() as any, {
        provider_id: providerId,
      })

      // Re-fetch cart to get payment session data (including client_secret for Stripe)
      const { cart: updatedCart } = await sdk.store.cart.retrieve(cartId)
      setCartData(updatedCart)
      
      // Update context if available
      if (context?.setCart) {
        context.setCart(updatedCart)
      }
      
      console.log("Payment session initialized:", updatedCart.payment_collection)
    } catch (err) {
      console.error("Error initializing payment:", err)
      setError("Failed to initialize payment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Get the active payment session
  const activePaymentSession = () => {
    return cartData()?.payment_collection?.payment_sessions?.[0]
  }

  const getPaymentUi = () => {
    const session = activePaymentSession()
    const cart = cartData()
    if (!session) {
      return null
    }

    if (session.provider_id.startsWith("pp_stripe_") || session.provider_id === "stripe") {
      const clientSecret = session.data?.client_secret as string
      if (!clientSecret) {
        return (
          <div class="stripe-error-container">
            <span>Stripe payment session is initializing...</span>
          </div>
        )
      }
      return (
        <StripePaymentUI 
          clientSecret={clientSecret} 
          cartId={cart?.id || ""}
          amount={cart?.total || 0}
          currency={cart?.currency_code || "usd"}
        />
      )
    }
    
    if (session.provider_id.startsWith("pp_system_default")) {
      return (
        <ManualPaymentUI cartId={cart?.id || ""} />
      )
    }
    
    return (
      <div class="dev-payment-container">
        <div class="dev-payment-card">
          <span>You chose <strong>{session.provider_id}</strong> which is in development.</span>
        </div>
        <style>{`
          .dev-payment-container {
            max-width: 480px;
            margin: 2rem auto;
            padding: 0 1rem;
          }
          .dev-payment-card {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            color: #92400e;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div class="payment-page">
      <Show when={loading()}>
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <span>Loading payment options...</span>
        </div>
      </Show>

      <Show when={error()}>
        <div class="error-container">
          <span>{error()}</span>
          <button onClick={() => navigate("/checkout/shipping")}>Back to Shipping</button>
        </div>
      </Show>
      
      <Show when={!loading() && !error() && !activePaymentSession()}>
        <div class="payment-selection-container">
          <div class="payment-selection-card">
            <h2>Select Payment Method</h2>
            <p class="selection-subtitle">Choose how you'd like to pay</p>
            
            <form onSubmit={handleSelectProvider} class="payment-form">
              <div class="payment-options">
                <For each={paymentProviders()}>
                  {(provider) => (
                    <label 
                      class={`payment-option ${selectedPaymentProvider() === provider.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="payment-provider"
                        value={provider.id}
                        checked={selectedPaymentProvider() === provider.id}
                        onChange={(e) => setSelectedPaymentProvider(e.currentTarget.value)}
                      />
                      <div class="option-content">
                        <Show when={provider.id.includes("stripe")} fallback={
                          <div class="option-icon default">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                            </svg>
                          </div>
                        }>
                          <div class="option-icon stripe">
                            <svg viewBox="0 0 60 25" width="40" height="17">
                              <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.48zm-3.67-3.07c0-1.5-.61-2.65-2.23-2.65-1.35 0-2.23 1.13-2.37 2.65h4.6zM24.35 5.3l-.07 3.57a5.15 5.15 0 0 0-1.42-.2c-2.06 0-3.3 1.13-3.3 4.33v7.23h-4.17V5.67h3.82l.13 2.14c.76-1.66 2.17-2.5 3.8-2.5.43 0 .86.04 1.21.1v-.1zM4.17 7.42c0-1.03.87-1.43 1.85-1.43.93 0 2.14.48 3.1 1.33V3.49c-1.1-.5-2.16-.73-3.1-.73C2.85 2.76 0 4.56 0 7.85c0 5.05 6.18 4.23 6.18 6.42 0 1.21-1.05 1.61-2.1 1.61-1.2 0-2.63-.63-3.8-1.48v3.97a8.2 8.2 0 0 0 3.8.93c3.28 0 6.3-1.36 6.3-4.92 0-5.44-6.2-4.47-6.2-6.55zM16.5 2.17v3.65h2.56v3.32H16.5v6.05c0 1.98 1.3 2.25 2.34 2.25.5 0 .87-.04 1.4-.16v3.45c-.53.18-1.26.31-2.11.31-3.45 0-5.8-2.3-5.8-5.85V9.14H9.66v-.1l3.98-4.3V2.17h2.86zm21.5 3.33v14.73h-3.82l-.13-1.66c-.95 1.37-2.4 2.02-4.12 2.02-3.76 0-6.63-3.05-6.63-7.56s2.87-7.7 6.63-7.7c1.55 0 2.94.56 3.84 1.66V5.5h4.23zm-4.06 7.24c0-2.54-1.45-4.15-3.41-4.15-1.96 0-3.43 1.65-3.43 4.24 0 2.57 1.47 4.15 3.43 4.15 1.96 0 3.41-1.66 3.41-4.24z"/>
                            </svg>
                          </div>
                        </Show>
                        <div class="option-details">
                          <span class="option-name">
                            {provider.id.includes("stripe") ? "Credit/Debit Card" : 
                             provider.id.includes("system_default") ? "Manual Payment" : 
                             provider.id}
                          </span>
                          <span class="option-description">
                            {provider.id.includes("stripe") ? "Pay securely with Stripe" : 
                             provider.id.includes("system_default") ? "Pay later / Cash on delivery" : 
                             "Alternative payment method"}
                          </span>
                        </div>
                      </div>
                      <div class="option-check">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    </label>
                  )}
                </For>
              </div>
              
              <button
                type="submit"
                disabled={loading() || !cartData()?.id || !selectedPaymentProvider()}
                class="continue-button"
              >
                <Show when={loading()} fallback="Continue to Payment">
                  <span class="btn-spinner"></span>
                  Processing...
                </Show>
              </button>
            </form>
          </div>
        </div>
      </Show>
      
      {getPaymentUi()}
      
      <style>{`
        .payment-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          padding: 2rem 0;
        }
        
        .loading-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 4rem;
          color: #6b7280;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #635BFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .error-container {
          text-align: center;
          padding: 3rem;
          max-width: 520px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          color: #dc2626;
        }
        
        .error-container button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #1a1a2e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .payment-selection-container {
          max-width: 520px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .payment-selection-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          padding: 2.5rem;
        }
        
        .payment-selection-card h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 0.5rem 0;
          text-align: center;
        }
        
        .selection-subtitle {
          color: #6b7280;
          text-align: center;
          margin: 0 0 2rem 0;
        }
        
        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .payment-option {
          display: flex;
          align-items: center;
          padding: 1rem 1.25rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }
        
        .payment-option:hover {
          border-color: #c7d2fe;
          background: #f8fafc;
        }
        
        .payment-option.selected {
          border-color: #635BFF;
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
        }
        
        .payment-option input {
          display: none;
        }
        
        .option-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }
        
        .option-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }
        
        .option-icon.stripe {
          background: linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%);
          padding: 0.5rem;
        }
        
        .option-icon.stripe svg path {
          fill: white;
        }
        
        .option-icon.default {
          background: #f3f4f6;
          color: #6b7280;
        }
        
        .option-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .option-name {
          font-weight: 600;
          color: #1a1a2e;
        }
        
        .option-description {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .option-check {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: white;
          flex-shrink: 0;
        }
        
        .payment-option.selected .option-check {
          background: #635BFF;
          border-color: #635BFF;
        }
        
        .payment-option:not(.selected) .option-check svg {
          display: none;
        }
        
        .continue-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }
        
        .continue-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26, 26, 46, 0.3);
        }
        
        .continue-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
