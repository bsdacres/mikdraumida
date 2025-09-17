import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { clientOnly } from "@solidjs/start";
import "./app.css";
import Header from "./components/Header";


const CartProviderClient = clientOnly(() => import("./context/cart"));

function CartProvider(props: { children: any }) {
  return <CartProviderClient>{props.children}</CartProviderClient>;
}


export default function App() {
  
  return (
    <CartProvider>
      <Router
        root={props => (
          <MetaProvider>
            <Title>SolidStart - Basic</Title>
           <Suspense>{props.children}</Suspense>
          </MetaProvider>
        )}
        >
        <FileRoutes />
      </Router>
    </CartProvider>
  );
}
