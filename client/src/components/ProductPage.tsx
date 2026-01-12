import { createEffect, createResource, createSignal, For, Match, onMount, Show, Switch } from "solid-js";
import { Motion } from "solid-motionone";
import styles from "./styles/component.module.scss";
import { sdk } from "~/lib/medusa";
import { formatPrice } from "./ProductCard";
import { addToCart } from "./addToCart";

// Size order mapping for sorting
const sizeOrder: Record<string, number> = {
  'xxs': 1, 'xs': 2, 's': 3, 'm': 4, 'l': 5, 'xl': 6, 'xxl': 7, '2xl': 7, 'xxxl': 8, '3xl': 8,
  'small': 3, 'medium': 4, 'large': 5, 'extra large': 6,
};

const getSizeOrder = (title: string): number => {
  const normalized = title.toLowerCase().trim();
  return sizeOrder[normalized] ?? 999;
};

const sortVariantsBySize = (variants: any[]) => {
  return [...variants].sort((a, b) => getSizeOrder(a.title) - getSizeOrder(b.title));
};

const [thumbnail, setThumbnail] = createSignal<string | any>()
const [activeTab, setActiveTab] = createSignal<string>("lore")

export default function ProductPage(props: any) {
     
  async function fetchProducts (){
    const data = await sdk.store.product.list({
      fields: `*variants.calculated_price`,
      handle: `${props.handle}`
    });
    console.log(data)
    console.log("fetch was a sucess")
    
    return data.products[0];
  }
  
  const [products] = createResource(fetchProducts)
  const [selectedVariant, setSelectedVariant] = createSignal<string>();
   
  
  onMount(() =>{
    setThumbnail(products()?.thumbnail)
  })

    return(
        <div class={styles.product_page}>
          <div class={styles.product_gallery}>
            <div class={styles.product_preview_container}>
              <Show when={products()?.images}>
                  <For each={products()?.images}>
                      {(image) => <ImageViewer {...image} />}
                  </For>
              </Show>
            </div>
            <Motion.img 
              animate={{opacity: [0, 1]}}
              transition={{duration: 1, easing: "ease-in-out"}}
              class={styles.product_thumbnail} src={thumbnail()} 
            />
          </div>
          <div class={styles.product_details}>
            <div class={styles.product_header}>
              <h1 class={styles.product_name}>{products()?.title}</h1>
              <div class={styles.product_price_display}>
                {formatPrice(products()?.variants?.[0].calculated_price?.calculated_amount)}
              </div>
            </div>
            
            <div class={styles.product_purchase}>
              <Show when={products()?.variants?.length}>
                <div class={styles.variant_selector}>
                  <label for="variant">Select Size</label>
                  <select
                    id="variant"
                    onChange={(e) => setSelectedVariant(e.currentTarget.value)}
                  >  
                    <option value="" disabled selected>Choose an option</option>
                    <For each={sortVariantsBySize(products()?.variants || [])}>
                      {(variant) => (
                        <option value={variant.id}>{variant.title}</option>
                      )}
                    </For>
                  </select>
                </div>
              </Show>
              <button
                class={styles.add_to_cart_btn}
                onclick={() => selectedVariant() && addToCart(selectedVariant()!)}
                disabled={!selectedVariant()}
              >
                Add to Cart
              </button>
            </div>

            <div class={styles.product_tabs_section}>
              <div class={styles.tabs_header}>
                <button 
                  class={`${styles.tab_btn} ${activeTab() === "lore" ? styles.tab_active : ""}`}
                  onClick={() => setActiveTab("lore")}
                >
                  Lore
                </button>
                <button 
                  class={`${styles.tab_btn} ${activeTab() === "details" ? styles.tab_active : ""}`}
                  onClick={() => setActiveTab("details")}
                >
                  Product Details
                </button>
                <button 
                  class={`${styles.tab_btn} ${activeTab() === "shipping" ? styles.tab_active : ""}`}
                  onClick={() => setActiveTab("shipping")}
                >
                  Shipping & Returns
                </button>
              </div>
              <div class={styles.tab_content}>
                <Switch>
                  <Match when={activeTab() === "lore"}>
                    <p>{products()?.description || "The essence of this piece transcends mere fabric and form. Born from the shadows of forgotten dreams, it carries within it the weight of untold stories."}</p>
                  </Match>
                  <Match when={activeTab() === "details"}>
                    <p>{products()?.subtitle || "Crafted with meticulous attention to detail."}</p>
                    <ul>
                      <li>Premium materials</li>
                      <li>Handcrafted construction</li>
                      <li>Made in limited quantities</li>
                    </ul>
                  </Match>
                  <Match when={activeTab() === "shipping"}>
                    <p><strong>Shipping:</strong> Free worldwide shipping on all orders. Delivery within 5-10 business days.</p>
                    <p><strong>Returns:</strong> We accept returns within 14 days of delivery. Items must be unworn with original tags attached.</p>
                  </Match>
                </Switch>
              </div>
            </div>
          </div>
        </div>
        
    ) 
}




export const ImageViewer = (props: any) =>  {
  
  return(
    <Motion class={styles.product_preview}
      animate={{opacity: [0, 1]}}
      transition={{duration: 1, easing: "ease-in-out"}}
    >
      <img onclick={() => setThumbnail(props.url)} src={props.url ?? undefined} />
    </Motion>
  )
}