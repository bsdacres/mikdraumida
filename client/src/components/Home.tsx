import { Meta, Title } from "@solidjs/meta";
import { For, Show, createResource } from "solid-js";
import { sdk } from "~/lib/medusa";
import { ProductCard } from "./ProductCard";
import styles from "./styles/component.module.scss";



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
      <div class={styles.hero}>
        <img class={styles.hero_img} src="/hero.webp" />
        <div class={styles.hero_text_container}>
          <div class={styles.hero_title}>Cantus I: Abyssal Hymns</div>
          <div class={styles.hero_desc}> Forlorn, lost woven into perfection</div>
          <a href="/index" class={styles.hero_link}>Explore More</a>
        </div>
      </div>
      <div class={styles.product_container}>
        <Show  when={products()}>
          <For each ={products()}  fallback={<div>Loading...</div>}>
            {(item) => <ProductCard {...item} />}
          </For>
        </Show>
      </div>
    </main>
  );
}