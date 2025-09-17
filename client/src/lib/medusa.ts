import Medusa from "@medusajs/js-sdk";


let MEDUSA_BACKEND_URL = "http://localhost:9000"


export const sdk = new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: true,
    publishableKey: "pk_0f84791c1ae582d6a500b629a09e06be86144b25739217b02ffd56dd1c0cac3f",
})
  