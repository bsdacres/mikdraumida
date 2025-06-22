import component from "./styles/component.module.css"
import { Motion } from "solid-motionone"
import { createSignal, Show, createEffect, onCleanup, onMount} from "solid-js"




const [active, setActive] = createSignal<boolean>(true)

export default function Navbar(){
    onMount(() => {
        if (active()) {
          document.body.style.overflow = "hidden";
        } else {
          document.body.style.overflow = "";
        }
        });

    return(
        <>  
            <Show when={active()}>
                <MenuModal />
            </Show>
            <div class={component.navbar}>
                <a onclick={()=>setActive(!active())}>menu</a>
                <a href="/">
                    <img src="/logo.png" height={100}></img>
                </a>
                <a>bag</a>
            </div>
        </>
    )
}




const MenuModal = () => {
    return(
        <Motion.div class={component.nav_menu}> 
            <a onclick={() => setActive(!active())} href="/">Store</a>
            <a onclick={() => setActive(!active())} href="about">about</a>
            <a onclick={() => setActive(!active())} href="/">Store</a>
            <hr></hr>
            <a onclick={() => setActive(false)} href="/">exit</a>
        </Motion.div>
    )
}