import { Show } from "solid-js";

interface LoreCardProps {
  id: string;
  title: string;
  quote: string;
  item?: string | null;
}

export default function LoreCard(props: LoreCardProps) {
  return (
    <article class="lore-card">
      <Show when={props.item}>
        <div class="lore-card-image">
          <img 
            src={props.item!} 
            alt={props.title} 
            loading="lazy"
            decoding="async"
          />
        </div>
      </Show>
      <div class="lore-card-content">
        <h2 class="lore-card-title">{props.title}</h2>
        <blockquote class="lore-card-quote">
          "{props.quote}"
        </blockquote>
      </div>
    </article>
  );
}
