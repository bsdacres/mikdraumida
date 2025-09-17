// src/components/CartProvider.tsx
import { createContext, useContext, onMount, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import { clientOnly } from "@solidjs/start";
import { sdk } from "~/lib/medusa"
import type { StoreCart } from "@medusajs/types"

export const CartContext = createContext<{
  cart: Partial<StoreCart>
  setCart: (value: Partial<StoreCart>) => void
}>()

export default function CartProviderClient(props: { children: any }) {
  const [cart, setCart] = createStore<Partial<StoreCart>>({})

  onMount(async () => {
    const cartId = localStorage.getItem("cart_id")
    const response = cartId
      ? await sdk.store.cart.retrieve(cartId)
      : await sdk.store.cart.create({ region_id: "reg_01K2ZVZQHKQRYN8AD60MJFWSHG" })

    const data = response.cart
    localStorage.setItem("cart_id", data.id)
    setCart(data)
    console.log("Cart initialized:", data)
  })

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {props.children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}