import { createSignal, Show, For, onMount, onCleanup } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useCart } from "~/context/cart";
import { removeFromCart } from "./addToCart";

// Store logo URL in a variable for easy changing
const logoUrl = "/logo.png"; // Change this to your logo URL

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false);
  const [isCartOpen, setIsCartOpen] = createSignal(false);
  const [isHidden, setIsHidden] = createSignal(false);
  const [isScrolled, setIsScrolled] = createSignal(false);
  const [removingItemId, setRemovingItemId] = createSignal<string | null>(null);
  const cartContext = useCart();
  const location = useLocation();
  let lastScrollY = 0;
  let cartDropdownRef: HTMLDivElement | undefined;

  // Check if we're on the home page
  const isHomePage = () => location.pathname === "/";

  // Close cart dropdown when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (cartDropdownRef && !cartDropdownRef.contains(e.target as Node)) {
      setIsCartOpen(false);
    }
  };

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // Show/hide based on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down & past threshold - hide navbar
      setIsHidden(true);
    } else {
      // Scrolling up - show navbar
      setIsHidden(false);
    }
    
    // Add background when scrolled
    setIsScrolled(currentScrollY > 50);
    
    lastScrollY = currentScrollY;
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("mousedown", handleClickOutside);
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen());
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen());
  };

  // Calculate cart total
  const getCartTotal = () => {
    const cart = cartContext?.cart;
    if (!cart?.total) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cart.currency_code?.toUpperCase() || "USD",
    }).format(cart.total);
  };

  // Get cart items
  const getCartItems = () => {
    return cartContext?.cart?.items || [];
  };

  // Handle removing item from cart
  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    try {
      const updatedCart = await removeFromCart(itemId);
      if (updatedCart && cartContext?.setCart) {
        cartContext.setCart(updatedCart);
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setRemovingItemId(null);
    }
  };

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Store", href: "/store" },
    { label: "Lore", href: "/lore" },
  ];

  return (
    <header 
      class={`navbar-container ${isHomePage() ? "navbar-overlay" : ""} ${isHidden() ? "hidden" : ""} ${isScrolled() ? "scrolled" : ""}`}
    >
      <nav class="navbar">
        {/* Left side - Menu items (desktop) / Hamburger (mobile) */}
        <div class="navbar-left">
          {/* Hamburger menu button - visible on mobile */}
          <button
            class="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen()}
          >
            <Show
              when={!isMobileMenuOpen()}
              fallback={
                <svg
                  class="hamburger-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
            >
              <svg
                class="hamburger-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Show>
          </button>

          {/* Desktop menu items */}
          <ul class="desktop-menu">
            {menuItems.map((item) => (
              <li>
                <A href={item.href} class="menu-link">
                  {item.label}
                </A>
              </li>
            ))}
          </ul>
        </div>

        {/* Center - Logo */}
        <div class="navbar-center">
          <A href="/" class="logo-link">
            <Show
              when={logoUrl}
              fallback={<span class="logo-text">LOGO</span>}
            >
              <img src={logoUrl} alt="Logo" class="logo-img" />
            </Show>
          </A>
        </div>

        {/* Right side - Cart icon with dropdown */}
        <div class="navbar-right">
          <div class="cart-wrapper" ref={cartDropdownRef}>
            <button
              class="cart-btn"
              aria-label="Shopping cart"
              onClick={toggleCart}
            >
              <svg
                class="cart-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>

            {/* Cart Dropdown */}
            <Show when={isCartOpen()}>
              <div class="cart-dropdown">
                <div class="cart-dropdown-header">
                  <h3 class="cart-dropdown-title">Your Cart</h3>
                  <span class="cart-dropdown-total">{getCartTotal()}</span>
                </div>
                
                <div class="cart-dropdown-items">
                  <Show
                    when={getCartItems().length > 0}
                    fallback={<p class="cart-empty">Your cart is empty</p>}
                  >
                    <For each={getCartItems()}>
                      {(item) => (
                        <div class="cart-item">
                          <img
                            src={item.thumbnail || "/placeholder.png"}
                            alt={item.title}
                            class="cart-item-image"
                          />
                          <div class="cart-item-details">
                            <span class="cart-item-name">{item.title}</span>
                            <span class="cart-item-variant">
                              {item.variant?.title} × {item.quantity}
                            </span>
                            <span class="cart-item-price">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: cartContext?.cart?.currency_code?.toUpperCase() || "USD",
                              }).format(item.unit_price * item.quantity)}
                            </span>
                          </div>
                          <button
                            class="cart-item-remove"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removingItemId() === item.id}
                            aria-label="Remove item"
                          >
                            <Show
                              when={removingItemId() !== item.id}
                              fallback={<span class="cart-item-removing">...</span>}
                            >
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Show>
                          </button>
                        </div>
                      )}
                    </For>
                  </Show>
                </div>

                <A
                  href="/checkout"
                  class="cart-checkout-btn"
                  onClick={() => setIsCartOpen(false)}
                >
                  Checkout
                </A>
              </div>
            </Show>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      <Show when={isMobileMenuOpen()}>
        <div class="mobile-menu">
          <ul class="mobile-menu-list">
            {menuItems.map((item) => (
              <li>
                <A
                  href={item.href}
                  class="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </A>
              </li>
            ))}
          </ul>
        </div>
      </Show>
    </header>
  );
}