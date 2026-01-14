import Medusa from "@medusajs/js-sdk";


let MEDUSA_BACKEND_URL = "https://mikdraumida.medusajs.app"
const key ="pk_be7897e58bd0d0b903d8f87ac97327b95beb51dfc2970ac382c0b437f3073a43"

export const sdk = new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: true,
    publishableKey: key,
})