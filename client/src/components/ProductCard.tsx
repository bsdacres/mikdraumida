import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { useCart } from "~/context/cart";
import { sdk } from "~/lib/medusa";
import styles from "./styles/component.module.scss";

export const formatPrice = (amount: number | any): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export function ProductCard(props: any) {
  const cartContext = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = createSignal(false);

  const handleQuickAdd = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    if (!cartContext || !props.variants?.[0]?.id) return;

    setIsAdding(true);
    try {
      const cartId = cartContext.cart?.id || localStorage.getItem("cart_id");
      if (!cartId) return;

      const response = await sdk.store.cart.createLineItem(cartId, {
        variant_id: props.variants[0].id,
        quantity: 1,
      });

      cartContext.setCart(response.cart);
      navigate("/checkout");
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div class={styles.product_card}>
      <a href={`/store/${props.handle}`} class={styles.product_image_link}>
        <img src={props.thumbnail} alt={props.title} />
      </a>
      <div class={styles.product_info}>
        <div class={styles.product_title}>{props.title}</div>
        <div class={styles.product_price}>
          {formatPrice(props.variants[0]?.calculated_price?.calculated_amount)}
        </div>
      </div>
      <div class={styles.product_actions}>
        <button
          class={styles.quick_add_btn}
          onClick={handleQuickAdd}
          disabled={isAdding()}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {isAdding() ? "Adding..." : "Quick Add"}
        </button>
      </div>
    </div>
  );
}