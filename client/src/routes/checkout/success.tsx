import { createSignal, createEffect, Show, useContext } from "solid-js"
import { useSearchParams, useNavigate } from "@solidjs/router"
import { sdk } from "~/lib/medusa"
import { HttpTypes } from "@medusajs/types"

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [order, setOrder] = createSignal<HttpTypes.StoreOrder | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  createEffect(() => {
    const orderId = searchParams.order_id
    
    if (!orderId || Array.isArray(orderId)) {
      setLoading(false)
      return
    }

    sdk.store.order.retrieve(orderId as string)
      .then(({ order: fetchedOrder }) => {
        setOrder(fetchedOrder)
      })
      .catch((err) => {
        console.error("Error fetching order:", err)
        setError("Could not load order details")
      })
      .finally(() => setLoading(false))
  })

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount / 100)
  }

  return (
    <div class="success-page">
      <Show when={loading()}>
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <span>Loading order details...</span>
        </div>
      </Show>

      <Show when={!loading() && error()}>
        <div class="error-container">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="#dc2626">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <h2>Something went wrong</h2>
          <p>{error()}</p>
          <button onClick={() => navigate("/")}>Return to Store</button>
        </div>
      </Show>

      <Show when={!loading() && !error()}>
        <div class="success-container">
          <div class="success-card">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="#10b981">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            
            <h1>Thank you for your order!</h1>
            <p class="success-message">Your order has been placed successfully.</p>
            
            <Show when={order()}>
              <div class="order-details">
                <div class="order-header">
                  <span class="order-label">Order Number</span>
                  <span class="order-number">{order()?.display_id || order()?.id}</span>
                </div>
                
                <div class="order-info">
                  <div class="info-row">
                    <span>Email</span>
                    <span>{order()?.email}</span>
                  </div>
                  <Show when={order()?.total}>
                    <div class="info-row">
                      <span>Total</span>
                      <span class="total-amount">
                        {formatPrice(order()?.total || 0, order()?.currency_code || "usd")}
                      </span>
                    </div>
                  </Show>
                </div>

                <Show when={order()?.items && (order()?.items?.length ?? 0) > 0}>
                  <div class="order-items">
                    <h3>Order Items</h3>
                    {order()?.items?.map((item) => (
                      <div class="item-row">
                        <div class="item-info">
                          <span class="item-title">{item.title}</span>
                          <span class="item-variant">{item.variant_title}</span>
                        </div>
                        <div class="item-quantity">x{item.quantity}</div>
                        <div class="item-price">
                          {formatPrice(item.unit_price * item.quantity, order()?.currency_code || "usd")}
                        </div>
                      </div>
                    ))}
                  </div>
                </Show>

                <Show when={order()?.shipping_address}>
                  <div class="shipping-info">
                    <h3>Shipping Address</h3>
                    <p>
                      {order()?.shipping_address?.first_name} {order()?.shipping_address?.last_name}<br />
                      {order()?.shipping_address?.address_1}<br />
                      <Show when={order()?.shipping_address?.address_2}>
                        {order()?.shipping_address?.address_2}<br />
                      </Show>
                      {order()?.shipping_address?.city}, {order()?.shipping_address?.province} {order()?.shipping_address?.postal_code}<br />
                      {order()?.shipping_address?.country_code?.toUpperCase()}
                    </p>
                  </div>
                </Show>
              </div>
            </Show>

            <Show when={!order()}>
              <p class="no-order-message">
                Your order was placed successfully. Check your email for confirmation.
              </p>
            </Show>
            
            <div class="action-buttons">
              <button onClick={() => navigate("/")} class="primary-btn">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </Show>

      <style>{`
        .success-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 2rem 0;
        }
        
        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          text-align: center;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-container h2 {
          color: #dc2626;
          margin: 0;
        }
        
        .error-container p {
          color: #6b7280;
          margin: 0;
        }
        
        .error-container button {
          padding: 0.75rem 1.5rem;
          background: #1a1a2e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        .success-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .success-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          padding: 3rem 2rem;
          text-align: center;
        }
        
        .success-icon {
          margin-bottom: 1.5rem;
          animation: scaleIn 0.5s ease;
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .success-card h1 {
          font-size: 1.75rem;
          color: #065f46;
          margin: 0 0 0.5rem 0;
        }
        
        .success-message {
          color: #6b7280;
          margin: 0 0 2rem 0;
        }
        
        .no-order-message {
          color: #6b7280;
          margin: 0 0 2rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .order-details {
          text-align: left;
          margin-bottom: 2rem;
        }
        
        .order-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        
        .order-label {
          font-size: 0.875rem;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .order-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #065f46;
        }
        
        .order-info {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-row span:first-child {
          color: #6b7280;
        }
        
        .total-amount {
          font-weight: 600;
          color: #1a1a2e;
        }
        
        .order-items {
          margin-bottom: 1.5rem;
        }
        
        .order-items h3,
        .shipping-info h3 {
          font-size: 1rem;
          color: #374151;
          margin: 0 0 1rem 0;
        }
        
        .item-row {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 0.5rem;
        }
        
        .item-info {
          flex: 1;
        }
        
        .item-title {
          display: block;
          font-weight: 500;
          color: #1a1a2e;
        }
        
        .item-variant {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .item-quantity {
          padding: 0 1rem;
          color: #6b7280;
        }
        
        .item-price {
          font-weight: 500;
          color: #1a1a2e;
        }
        
        .shipping-info p {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          margin: 0;
          line-height: 1.6;
          color: #374151;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .primary-btn {
          padding: 1rem 2rem;
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
        
        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  )
}
