import { Show, createEffect } from "solid-js";
import { useCart } from "~/context/cart";

export default function CartNotification() {
  const cartContext = useCart();

  const isVisible = () => cartContext?.notification?.visible === true;
  const status = () => cartContext?.notification?.status;
  const itemName = () => cartContext?.notification?.itemName || 'Item';

  return (
    <div 
      class={`cart-notification ${isVisible() ? 'cart-notification--visible' : ''}`}
    >
      <div class="cart-notification-content">
        <Show when={status() === 'adding'}>
          <div class="cart-notification-spinner"></div>
          <span>Adding to cart...</span>
        </Show>
        <Show when={status() === 'added'}>
          <svg class="cart-notification-check" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Added "{itemName()}" to cart</span>
        </Show>
      </div>
    </div>
  );
}
