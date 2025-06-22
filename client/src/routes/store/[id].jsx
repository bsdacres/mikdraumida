import { useParams } from "@solidjs/router";
import ProductPage from "~/components/ProductPage";



export default function StorePage() {
    const params = useParams();
    return <ProductPage handle={params.id} />;
}