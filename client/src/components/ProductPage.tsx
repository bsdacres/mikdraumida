import { createEffect, createResource, createSignal, For, Match, onMount, Show, Switch } from "solid-js";
import { Motion } from "solid-motionone";
import component from "./styles/component.module.css"
import { sdk } from "~/context/medusa";
import { formatPrice } from "./ProductCard";


const [thumbnail, setThumbnail] = createSignal<string | any>()
const [menu, setMenu] = createSignal<string>("lore")

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
        <div class={component.product_page}>
          <div class={component.product_preview_container}>
            <Show when={products()?.images}>
                <For each={products()?.images}>
                    {(image) => <ImageViewer {...image} />}
                </For>
            </Show>
          </div>
          <Motion.img 
            animate={{opacity: [0, 1]}}
            transition={{duration: 1, easing: "ease-in-out"}}
            class={component.product_thumbnail} src={thumbnail()} 
          />
          <div class={component.product_info}>
            {products()?.title}
            {formatPrice(products()?.variants?.[0].calculated_price?.calculated_amount)}
            <div class={component.add_to_cart_buttons}>
              <Show when={products()?.variants?.length}>
                <select
                  id="variant"
                  onChange={(e) => setSelectedVariant(e.currentTarget.value)}
                >  
                  <option value="" disabled selected>size</option>
                  <For each={products()?.variants}>
                    {(variant) => (
                      <option value={variant.id}>{variant.title}</option>
                    )}
                  </For>
                </select>
              </Show>
              <button>Add to cart</button>
            </div>
            <div>

              <div class={component.tabs}>
                <div>Product Details</div>
                <div>Lore</div>
                <div>Shipping/Returns</div>
              </div>
            <div class={component.product_info_tabs}>
              <Switch>
                  <Match when={menu()==="description"}>
                    {products()?.subtitle}
                  </Match>
                  <Match when={menu()==="lore"}>
                    {products()?.description}
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
    <Motion class={component.product_preview}
      animate={{opacity: [0, 1]}}
      transition={{duration: 1, easing: "ease-in-out"}}
    >
      <img onclick={() => setThumbnail(props.url)} src={props.url ?? undefined} />
    </Motion>
  )
}