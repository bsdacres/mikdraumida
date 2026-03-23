import { sdk } from "~/lib/medusa"

export const addToCart = async (variant_id: string): Promise<any> => { 
  const cartId = localStorage.getItem("cart_id")

  if (!cartId) {
    return null
  }

  const { cart } = await sdk.store.cart.createLineItem(cartId, {
    variant_id,
    quantity: 1,
  })
  
  console.log("Item added to cart:", cart)
  return cart
}


export const removeFromCart = async (itemId: string): Promise<any> => {
  const cartId = localStorage.getItem("cart_id")

  if (!cartId) {
    return null
  }

  const { parent: cart } = await sdk.store.cart.deleteLineItem(cartId, itemId)
  console.log("Item removed from cart:", cart)
  return cart
}