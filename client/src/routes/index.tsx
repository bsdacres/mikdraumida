import { Title } from "@solidjs/meta";
import { For, Show, createResource } from "solid-js";
import { sdk } from "~/context/medusa";
import { ProductCard } from "~/components/ProductCard";
import { clientOnly } from "@solidjs/start";
import HomePage from "../components/Home";


export default function Home() {
  const ClientOnlyComp = clientOnly(() => import("../components/Home"));

  return (
    <main>
      <HomePage />
    </main>
  );
}
