import component from "./styles/component.module.css"

export const formatPrice = (amount: number | any): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

export function ProductCard(props: any){
    return(
        <a href={`/store/${props.handle}`} class={component.product_card}>
            <img src={props.thumbnail} />
            <div>{props.title}</div>
            <div>{formatPrice(props.variants[0].calculated_price.calculated_amount)}</div>
        </a>
    )
}