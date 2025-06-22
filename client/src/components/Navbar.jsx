import { createSignal } from "solid-js";
import "./Navbar.css"

export default function Navbar(){
    return(
        <nav class="navbar">
            <ul>
                <li><a>Store</a></li>
                <li><a>item</a></li>
                <li><a>item</a></li>
            </ul>
            <h1>Mik Draumida</h1>
            <ul>
                <li><a>Search</a></li>
                <li><a>Web3</a></li>
                <li><a>Bag</a></li>
            </ul>
        </nav>
    );
}