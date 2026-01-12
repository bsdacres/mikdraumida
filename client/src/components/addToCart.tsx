import { sdk } from "~/lib/medusa"
import { useCart } from "~/context/cart"

type CartContextType = {
  cart: any; // Replace 'any' with the actual cart type if available
};

export const addToCart = (variant_id: string) => { 
  const cartId = localStorage.getItem("cart_id")

  if (!cartId) {
    return
  }

  sdk.store.cart.createLineItem(cartId, {
    variant_id,
    quantity: 1,
  })
  .then(({ cart }) => {
    // use cart
    console.log(cart)
    alert("Product added to cart")
  })
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