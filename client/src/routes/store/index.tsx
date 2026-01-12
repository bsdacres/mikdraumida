import { For, Show, createResource } from "solid-js";
import { Title } from "@solidjs/meta";
import { sdk } from "~/lib/medusa";
import { ProductCard } from "~/components/ProductCard";
import styles from "~/components/styles/component.module.scss";

export default function StorePage() {
  async function fetchProducts() {
    const data = await sdk.store.product.list({
      fields: `*variants.calculated_price`,
    });
    return data.products;
  }

  const [products] = createResource(fetchProducts);

  return (
    <main class="store-page">
      <Title>Store | Mik Draumida</Title>
      
      <div class="store-header">
        <h1 class="store-title">All Products</h1>
        <p class="store-subtitle">Explore our complete collection</p>
      </div>

      <div class={styles.product_container}>
        <Show
          when={products()}
          fallback={
            <div class="store-loading">Loading products...</div>
          }
        >
          <For each={products()}>
            {(item) => <ProductCard {...item} />}
          </For>
        </Show>
      </div>
    </main>
  );
}
