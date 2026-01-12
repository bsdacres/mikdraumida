import { useNavigate } from "@solidjs/router"
import { Show, useContext, createSignal, onMount, For } from "solid-js"
import { CartContext } from "~/context/cart"
import { sdk } from "~/lib/medusa"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "solid-stripe"

const STRIPE_PUBLIC_KEY = "pk_live_cTcfR3gjqBCMEH9aErI2g3N3"
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

// Stripe Checkout Form
function StripeCheckoutForm(props: { 
  cartId: string
  clientSecret: string
  onSuccess: (orderId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
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
      const { error: submitError } = await elementsInstance.submit()
      if (submitError) {
        setErrorMessage(submitError.message || "Validation failed")
        setProcessing(false)
        return
      }

      const { error, paymentIntent } = await stripeInstance.confirmPayment({
        elements: elementsInstance,
        clientSecret: props.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      })

      if (error) {
        setErrorMessage(error.message || "Payment failed")
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        try {
          const data = await sdk.store.cart.complete(props.cartId)
          
          if (data.type === "order" && data.order) {
            localStorage.removeItem("cart_id")
            context?.refreshCart()
            props.onSuccess(data.order.id)
          } else {
            setErrorMessage("Payment received but order completion failed.")
            setProcessing(false)
          }
        } catch (err) {
          console.error("Error completing order:", err)
          setErrorMessage("Payment received but order completion failed.")
          setProcessing(false)
        }
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred")
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} class="stripe-form">
      <div class="form-section">
        <label class="section-label">Payment Details</label>
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <Show when={errorMessage()}>
        <div class="error-message">
          <span>{errorMessage()}</span>
        </div>
      </Show>

      <button
        type="submit"
        disabled={!stripe() || !elements() || processing()}
        class="pay-button"
      >
        <Show when={processing()} fallback="Pay Now">
          <span class="spinner"></span>
          Processing...
        </Show>
      </button>

      <div class="secure-badge">
        <span>Powered by Stripe - Secured with SSL</span>
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const context = useContext(CartContext)
  const navigate = useNavigate()
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [cartData, setCartData] = createSignal<any>(null)
  const [clientSecret, setClientSecret] = createSignal<string | null>(null)
  const [orderComplete, setOrderComplete] = createSignal(false)
  const [orderId, setOrderId] = createSignal<string | null>(null)

  const getCartId = () => {
    const contextCart = context?.cart
    if (contextCart?.id) return contextCart.id
    return localStorage.getItem("cart_id")
  }

  onMount(async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const cartId = getCartId()
    console.log("Checkout - Cart ID:", cartId)
    
    if (!cartId) {
      setError("No cart found. Please add items to your cart first.")
      setLoading(false)
      return
    }

    try {
      const { cart } = await sdk.store.cart.retrieve(cartId)
      console.log("Cart:", cart)
      setCartData(cart)

      let workingCart = cart
      if (!cart.region_id) {
        try {
          const { regions } = await sdk.store.region.list()
          if (regions && regions.length > 0) {
            const { cart: updatedCart } = await sdk.store.cart.update(cartId, {
              region_id: regions[0].id,
            })
            workingCart = updatedCart
            setCartData(updatedCart)
          }
        } catch (regionErr) {
          console.error("Failed to set region:", regionErr)
        }
      }

      if (!workingCart.region_id) {
        setError("Please set your shipping region first.")
        setLoading(false)
        return
      }

      const { payment_providers } = await sdk.store.payment.listPaymentProviders({
        region_id: workingCart.region_id,
      })
      console.log("Payment providers:", payment_providers)

      const stripeProvider = payment_providers.find(
        (p: any) => p.id.includes("stripe") || p.id.includes("pp_stripe")
      )

      if (!stripeProvider) {
        console.log("No Stripe provider found, available:", payment_providers)
        setError("Stripe payment not available. Check Medusa admin to add Stripe to your region.")
        setLoading(false)
        return
      }

      try {
        console.log("Initializing payment with provider:", stripeProvider.id)
        await sdk.store.payment.initiatePaymentSession(workingCart as any, {
          provider_id: stripeProvider.id,
        })

        const { cart: updatedCart } = await sdk.store.cart.retrieve(cartId)
        setCartData(updatedCart)
        console.log("Payment collection:", updatedCart.payment_collection)
        
        const secret = updatedCart.payment_collection?.payment_sessions?.[0]?.data?.client_secret as string
        if (secret) {
          setClientSecret(secret)
          console.log("Got client secret")
        } else {
          console.log("No client secret found")
        }
      } catch (paymentErr: any) {
        console.error("Payment init error:", paymentErr)
        setError(`Payment setup failed: ${paymentErr?.message || "Unknown error"}`)
      }

    } catch (err: any) {
      console.error("Error loading checkout:", err)
      setError(`Failed to load checkout: ${err?.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  })

  const handleSuccess = (newOrderId: string) => {
    setOrderId(newOrderId)
    setOrderComplete(true)
  }

  const formatPrice = (amount: number | undefined | null, currency: string = "usd") => {
    if (amount === undefined || amount === null) return "$0.00"
    const value = amount > 1000 ? amount / 100 : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value)
  }

  const stripeOptions = () => {
    const secret = clientSecret()
    if (!secret) return null
    return {
      clientSecret: secret,
      appearance: {
        theme: "night" as const,
        variables: {
          colorPrimary: "#8B5CF6",
          colorBackground: "#1e1e2e",
          colorText: "#f4f4f5",
          colorDanger: "#ef4444",
          fontFamily: "system-ui, -apple-system, sans-serif",
          borderRadius: "8px",
        },
      },
    }
  }

  if (orderComplete()) {
    return (
      <div class="checkout-page">
        <div class="success-container">
          <div class="success-icon">✓</div>
          <h1>Thank you for your order!</h1>
          <p>Your order has been placed successfully.</p>
          <Show when={orderId()}>
            <p class="order-id">Order ID: {orderId()}</p>
          </Show>
          <button onClick={() => navigate("/")} class="continue-btn">
            Continue Shopping
          </button>
        </div>
        <style>{checkoutStyles}</style>
      </div>
    )
  }

  return (
    <div class="checkout-page">
      <div class="checkout-container">
        <div class="checkout-header">
          <h1>Checkout</h1>
          <Show when={cartData()}>
            <div class="cart-summary-badge">
              {cartData()?.items?.length || 0} items - {formatPrice(cartData()?.total, cartData()?.currency_code)}
            </div>
          </Show>
        </div>

        <Show when={loading()}>
          <div class="loading-container">
            <div class="spinner large"></div>
            <span>Loading checkout...</span>
          </div>
        </Show>

        <Show when={error()}>
          <div class="error-container">
            <span>{error()}</span>
            <button onClick={() => navigate("/store")}>Back to Store</button>
          </div>
        </Show>

        <Show when={!loading() && !error()}>
          <div class="checkout-layout">
            <div class="checkout-main">
              <Show when={clientSecret() && stripeOptions()}>
                <Elements stripe={stripePromise} options={stripeOptions()!}>
                  <StripeCheckoutForm 
                    cartId={getCartId() || ""}
                    clientSecret={clientSecret()!}
                    onSuccess={handleSuccess}
                  />
                </Elements>
              </Show>

              <Show when={!clientSecret()}>
                <div class="manual-checkout">
                  <p>Stripe payment is not available for this cart.</p>
                  <p class="hint">Make sure your Medusa backend has Stripe configured and the cart has items.</p>
                  <button onClick={() => navigate("/store")}>Back to Store</button>
                </div>
              </Show>
            </div>

            <div class="checkout-sidebar">
              <div class="order-summary">
                <h3>Order Summary</h3>
                
                <div class="summary-items">
                  <For each={cartData()?.items || []}>
                    {(item: any) => (
                      <div class="summary-item">
                        <div class="item-image">
                          <Show when={item.thumbnail} fallback={<div class="placeholder-image">IMG</div>}>
                            <img src={item.thumbnail} alt={item.title} />
                          </Show>
                          <span class="item-qty-badge">{item.quantity}</span>
                        </div>
                        <div class="item-details">
                          <span class="item-title">{item.title || item.product_title}</span>
                          <span class="item-variant">{item.variant?.title || item.variant_title}</span>
                          <span class="item-unit-price">
                            {formatPrice(item.unit_price, cartData()?.currency_code)} each
                          </span>
                        </div>
                        <div class="item-price">
                          {formatPrice(item.unit_price * item.quantity, cartData()?.currency_code)}
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                <Show when={!cartData()?.items?.length}>
                  <div class="empty-cart-msg">No items in cart</div>
                </Show>

                <div class="summary-totals">
                  <div class="total-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartData()?.subtotal, cartData()?.currency_code)}</span>
                  </div>
                  <Show when={cartData()?.shipping_total}>
                    <div class="total-row">
                      <span>Shipping</span>
                      <span>{formatPrice(cartData()?.shipping_total, cartData()?.currency_code)}</span>
                    </div>
                  </Show>
                  <Show when={cartData()?.tax_total}>
                    <div class="total-row">
                      <span>Tax</span>
                      <span>{formatPrice(cartData()?.tax_total, cartData()?.currency_code)}</span>
                    </div>
                  </Show>
                  <div class="total-row grand-total">
                    <span>Total</span>
                    <span>{formatPrice(cartData()?.total, cartData()?.currency_code)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
      <style>{checkoutStyles}</style>
    </div>
  )
}

const checkoutStyles = `
  .checkout-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
    padding: 2rem 0;
  }

  .checkout-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .checkout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .checkout-header h1 {
    font-size: 2rem;
    color: #f4f4f5;
    margin: 0;
  }

  .cart-summary-badge {
    background: #8B5CF6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .checkout-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;
    align-items: start;
  }

  @media (max-width: 968px) {
    .checkout-layout {
      grid-template-columns: 1fr;
    }
    .checkout-sidebar {
      order: -1;
    }
  }

  .checkout-main {
    background: #1e1e2e;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    padding: 2rem;
    border: 1px solid #2d2d3d;
  }

  .stripe-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-label {
    font-size: 1rem;
    font-weight: 600;
    color: #f4f4f5;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #f87171;
    font-size: 0.875rem;
  }

  .pay-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%);
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(99, 91, 255, 0.4);
    margin-top: 0.5rem;
  }

  .pay-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 91, 255, 0.5);
  }

  .pay-button:disabled {
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

  .spinner.large {
    width: 40px;
    height: 40px;
    border-width: 3px;
    border-color: #3d3d4d;
    border-top-color: #8B5CF6;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .secure-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #a1a1aa;
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }

  .checkout-sidebar {
    position: sticky;
    top: 2rem;
  }

  .order-summary {
    background: #1e1e2e;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    padding: 1.5rem;
    border: 1px solid #2d2d3d;
  }

  .order-summary h3 {
    font-size: 1.25rem;
    color: #f4f4f5;
    margin: 0 0 1rem 0;
    padding-bottom: 1rem;
    border-bottom: 1px solid #3d3d4d;
  }

  .summary-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .summary-item {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .item-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: #2d2d3d;
    position: relative;
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-qty-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #8B5CF6;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #1e1e2e;
  }

  .placeholder-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #71717a;
    font-size: 0.75rem;
  }

  .item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item-title {
    font-weight: 600;
    color: #f4f4f5;
    font-size: 0.875rem;
    line-height: 1.3;
  }

  .item-variant {
    font-size: 0.75rem;
    color: #a1a1aa;
  }

  .item-unit-price {
    font-size: 0.75rem;
    color: #71717a;
    font-style: italic;
  }

  .item-price {
    font-weight: 700;
    color: #f4f4f5;
    font-size: 0.9rem;
    text-align: right;
  }

  .empty-cart-msg {
    text-align: center;
    padding: 2rem;
    color: #71717a;
    font-style: italic;
  }

  .summary-totals {
    border-top: 1px solid #3d3d4d;
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #a1a1aa;
  }

  .total-row.grand-total {
    font-size: 1.125rem;
    font-weight: 700;
    color: #f4f4f5;
    padding-top: 0.5rem;
    border-top: 1px solid #3d3d4d;
    margin-top: 0.5rem;
  }

  .loading-container, .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    gap: 1rem;
    background: #1e1e2e;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid #2d2d3d;
    color: #f4f4f5;
  }

  .error-container {
    color: #f87171;
  }

  .error-container button, .manual-checkout button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #8B5CF6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .error-container button:hover, .manual-checkout button:hover {
    background: #7c3aed;
  }

  .manual-checkout {
    text-align: center;
    padding: 2rem;
    color: #a1a1aa;
  }

  .manual-checkout .hint {
    font-size: 0.875rem;
    color: #71717a;
    margin-top: 0.5rem;
  }

  .success-container {
    max-width: 500px;
    margin: 0 auto;
    text-align: center;
    padding: 3rem;
    background: #1e1e2e;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid #2d2d3d;
  }

  .success-icon {
    width: 64px;
    height: 64px;
    background: #10b981;
    color: white;
    font-size: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .success-container h1 {
    font-size: 1.75rem;
    color: #34d399;
    margin: 0 0 0.5rem 0;
  }

  .success-container p {
    color: #a1a1aa;
    margin: 0 0 1rem 0;
  }

  .order-id {
    font-family: monospace;
    background: #2d2d3d;
    color: #f4f4f5;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .continue-btn {
    margin-top: 1.5rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .continue-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
`
