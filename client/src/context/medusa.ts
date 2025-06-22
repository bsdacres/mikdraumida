import Medusa from "@medusajs/js-sdk";


let MEDUSA_BACKEND_URL = "http://localhost:9000"


export const sdk = new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: true,
    publishableKey: "pk_28cac67251020d3b4d92b76bcf2555966438d841af8e1883687cacbf3c91e46a",
})
  