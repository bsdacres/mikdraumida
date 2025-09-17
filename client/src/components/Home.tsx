import { Meta, Title } from "@solidjs/meta";
import { For, Show, createResource } from "solid-js";
import { sdk } from "~/lib/medusa";
import { ProductCard } from "./ProductCard";
import component from "./styles/component.module.css"



export default function HomePage() {

  async function fetchProducts (){
    const data = await sdk.store.product.list({
      fields: `*variants.calculated_price`
    });
    console.log(data)
    return data.products;
  }
  
  const [products] = createResource(fetchProducts)

  return (
    <main>
      <Title>Hello World</Title>
      <div class={component.hero}>
        <img class={component.hero_img} src="https://www.maisonmargiela.com/dw/image/v2/AAPK_PRD/on/demandware.static/-/Library-Sites-margiela-shared/default/dw5b0f53c6/MM/040325Update/MM_HOMEPAGE_REFRESHES_DRESS-AGE_HERO_BANNER_02_DESKTOP.jpg?sw=3000" />
        <div class={component.hero_text_container}>
          <div class={component.hero_title}>Canto I: Abyssal Hymns</div>
          <div class={component.hero_desc}> Forlorn, lost woven into perfection</div>
          <a href="/index" class={component.hero_link}>Explore More</a>
        </div>
      </div>
      <div class={component.product_container}>
        <Show  when={products()}>
          <For each ={products()}  fallback={<div>Loading...</div>}>
            {(item) => <ProductCard {...item} />}
          </For>
        </Show>
      </div>
    </main>
  );
}