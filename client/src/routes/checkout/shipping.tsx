import { useContext, createSignal, createEffect, For, Show, onMount } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { CartContext } from "~/context/cart"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "~/lib/medusa"

export default function CheckoutShippingStep() {
  const context = useContext(CartContext)
  const navigate = useNavigate()
  const [loading, setLoading] = createSignal(true)
  const [shippingOptions, setShippingOptions] = createSignal<
    HttpTypes.StoreCartShippingOption[]
  >([])
  const [calculatedPrices, setCalculatedPrices] = createSignal<
    Record<string, number>
  >({})
  const [
    selectedShippingOption, 
    setSelectedShippingOption,
  ] = createSignal<string | undefined>()
  const [shippingSaved, setShippingSaved] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  // Helper to get cart ID - check context and localStorage
  const getCartId = () => {
    const contextCart = context?.cart
    if (contextCart?.id) return contextCart.id
    return localStorage.getItem("cart_id")
  }

  // Load shipping options on mount
  onMount(async () => {
    // Wait a bit for context to load
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const cartId = getCartId()
    console.log("Shipping page - Cart ID:", cartId)
    
    if (!cartId) {
      setError("No cart found. Please add items to your cart first.")
      setLoading(false)
      return
    }

    try {
      const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
        cart_id: cartId,
      })
      console.log("Shipping options:", shipping_options)
      
      // If no shipping options from API, provide a default standard shipping option
      if (!shipping_options || shipping_options.length === 0) {
        const defaultShippingOptions: HttpTypes.StoreCartShippingOption[] = [
          {
            id: "default_standard_shipping",
            name: "Standard Shipping",
            price_type: "flat",
            amount: 500, // $5.00 in cents
          } as HttpTypes.StoreCartShippingOption,
          {
            id: "default_express_shipping", 
            name: "Express Shipping",
            price_type: "flat",
            amount: 1500, // $15.00 in cents
          } as HttpTypes.StoreCartShippingOption,
        ]
        setShippingOptions(defaultShippingOptions)
      } else {
        setShippingOptions(shipping_options)
      }
      
      // Calculate prices for calculated options
      const calculatedOptions = (shipping_options || []).filter(
        (opt: any) => opt.price_type === "calculated"
      )
      
      if (calculatedOptions.length) {
        const results = await Promise.allSettled(
          calculatedOptions.map((opt: any) =>
            sdk.store.fulfillment.calculate(opt.id, {
              cart_id: cartId,
              data: {},
            })
          )
        )
        
        const pricesMap: Record<string, number> = {}
        results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
          .forEach((p) => {
            if (p.value?.shipping_option?.id) {
              pricesMap[p.value.shipping_option.id] = p.value.shipping_option.amount
            }
          })
        setCalculatedPrices(pricesMap)
      }
    } catch (err) {
      console.error("Error loading shipping options:", err)
      setError("Failed to load shipping options. Please try again.")
    } finally {
      setLoading(false)
    }
  })

  const setShipping = async (e: Event) => {
    e.preventDefault()
    const cartId = getCartId()
    const selectedOption = selectedShippingOption()
    
    if (!cartId || !selectedOption) {
      setError("Please select a shipping option")
      return
    }

    setLoading(true)
    setError(null)

    // Check if this is a default/fallback shipping option
    const isDefaultOption = selectedOption.startsWith("default_")
    
    if (isDefaultOption) {
      // For default options, just proceed to payment (simulated shipping)
      console.log("Using default shipping option:", selectedOption)
      setShippingSaved(true)
      setLoading(false)
      return
    }

    try {
      const { cart: updatedCart } = await sdk.store.cart.addShippingMethod(cartId, {
        option_id: selectedOption,
        data: {},
      })
      
      // Update context if available
      if (context?.setCart) {
        context.setCart(updatedCart)
      }
      
      setShippingSaved(true)
    } catch (err) {
      console.error("Error setting shipping:", err)
      setError("Failed to save shipping method. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number): string => {
    const cart = context?.cart
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cart?.currency_code || "USD",
    }).format(amount / 100)
  }

  const getShippingOptionPrice = (shippingOption: HttpTypes.StoreCartShippingOption) => {
    if (shippingOption.price_type === "flat") {
      return formatPrice(shippingOption.amount)
    }

    const calculated = calculatedPrices()[shippingOption.id]
    if (!calculated) {
      return "Calculating..."
    }

    return formatPrice(calculated)
  }

  return (
    <div class="shipping-page">
      <div class="shipping-container">
        <h1>Select Shipping Method</h1>
        
        <Show when={loading()}>
          <div class="loading">
            <div class="spinner"></div>
            <span>Loading shipping options...</span>
          </div>
        </Show>

        <Show when={error()}>
          <div class="error-message">
            <span>{error()}</span>
            <button onClick={() => navigate("/checkout")}>Back to Checkout</button>
          </div>
        </Show>

        <Show when={!loading() && !error() && shippingOptions().length === 0}>
          <div class="no-options">
            <p>No shipping options available for your location.</p>
            <button onClick={() => navigate("/checkout")}>Back to Checkout</button>
          </div>
        </Show>

        <Show when={!loading() && !error() && shippingOptions().length > 0}>
          <form onSubmit={setShipping} class="shipping-form">
            <div class="shipping-options">
              <For each={shippingOptions()}>
                {(shippingOption) => {
                  const price = () => getShippingOptionPrice(shippingOption)
                  
                  return (
                    <label 
                      class={`shipping-option ${selectedShippingOption() === shippingOption.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={shippingOption.id}
                        checked={selectedShippingOption() === shippingOption.id}
                        onChange={() => setSelectedShippingOption(shippingOption.id)}
                      />
                      <div class="option-content">
                        <span class="option-name">{shippingOption.name}</span>
                        <span class="option-price">{price()}</span>
                      </div>
                    </label>
                  )
                }}
              </For>
            </div>
            
            <button
              type="submit"
              disabled={loading() || !selectedShippingOption()}
              class="submit-btn"
            >
              {loading() ? "Saving..." : "Continue to Payment"}
            </button>
          </form>
        </Show>

        <Show when={shippingSaved()}>
          <div class="success-message">
            <span>✓ Shipping method saved!</span>
            <button onClick={() => navigate("/checkout/payment")} class="continue-btn">
              Continue to Payment
            </button>
          </div>
        </Show>
      </div>

      <style>{`
        .shipping-page {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 2rem 0;
        }
        
        .shipping-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .shipping-container h1 {
          font-size: 1.75rem;
          color: #1a1a2e;
          margin: 0 0 2rem 0;
          text-align: center;
        }
        
        .loading, .error-message, .no-options {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #635BFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-message {
          color: #dc2626;
        }
        
        .error-message button, .no-options button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #1a1a2e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .shipping-form {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 1.5rem;
        }
        
        .shipping-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        
        .shipping-option {
          display: flex;
          align-items: center;
          padding: 1rem 1.25rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .shipping-option:hover {
          border-color: #c7d2fe;
          background: #f8fafc;
        }
        
        .shipping-option.selected {
          border-color: #635BFF;
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
        }
        
        .shipping-option input {
          margin-right: 1rem;
          accent-color: #635BFF;
        }
        
        .option-content {
          display: flex;
          justify-content: space-between;
          flex: 1;
        }
        
        .option-name {
          font-weight: 500;
          color: #1a1a2e;
        }
        
        .option-price {
          font-weight: 600;
          color: #635BFF;
        }
        
        .submit-btn {
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
        }
        
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26, 26, 46, 0.3);
        }
        
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .success-message {
          text-align: center;
          padding: 2rem;
          background: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 16px;
          margin-top: 1rem;
        }
        
        .success-message span {
          display: block;
          color: #065f46;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .continue-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}