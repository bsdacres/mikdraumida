import { useContext } from "solid-js"
import { CartContext } from "~/context/cart"


export default function CartTotals() {
  console.log(CartContext);
  const cartContext = useContext(CartContext);
  const cart = cartContext?.cart;
  console.log(cart);

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cart?.region?.currency_code || "USD",
    })
    .format(amount)
  }

  return (
    <div>
      {!cart && <span>Loading...</span>}
      {cart && (
        <ul>
          <li>
            <span>Subtotal (excl. taxes)</span>
            <span>{formatPrice(cart.subtotal ?? 0)}</span>
          </li>
          <li>
            <span>Discounts</span>
            <span>{formatPrice(cart.discount_total ?? 0)}</span>
          </li>
          <li>
            <span>Shipping</span>
            <span>{formatPrice(cart.shipping_total ?? 0)}</span>
          </li>
          <li>
            <span>Taxes</span>
            <span>{formatPrice(cart.tax_total ?? 0)}</span>
          </li>
          <li>
            <span>Total</span>
            <span>{formatPrice(cart.total ?? 0)}</span>
          </li>
        </ul>
        
      )}
    </div>
  )
}