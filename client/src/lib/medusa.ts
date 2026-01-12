import Medusa from "@medusajs/js-sdk";


let MEDUSA_BACKEND_URL = "http://localhost:9000"


export const sdk = new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: true,
    publishableKey: "pk_422e96cc7738d1db30b5cf7a9ad5718aad2b9faeb4924285a81dbb293f4b9c05",
})
  