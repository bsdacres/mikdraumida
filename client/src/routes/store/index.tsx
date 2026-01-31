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
          <script
              innerHTML={`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '1462735488401118');
                fbq('track', 'PageView');
                fbq('track', 'AddToCart');
              `}
            />
      
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
