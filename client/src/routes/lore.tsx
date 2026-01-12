import { For } from "solid-js";
import { Title } from "@solidjs/meta";
import LoreCard from "~/components/LoreCard";
import loreData from "~/data/lore.json";

export default function LorePage() {
  return (
    <main class="lore-page">
      <Title>Lore | Mik Draumida</Title>

      <div class="lore-header">
        <h1 class="lore-title">The Lore</h1>
        <p class="lore-subtitle">Cantus I: Abyssal Hymns</p>
      </div>

      <div class="lore-container">
        <For each={loreData.entries}>
          {(entry) => (
            <LoreCard
              id={entry.id}
              title={entry.title}
              quote={entry.quote}
              item={entry.item}
            />
          )}
        </For>
      </div>
      <div class="lore-scroll-indicator">
        Scroll to explore <span>→</span>
      </div>
    </main>
  );
}
