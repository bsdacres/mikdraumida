import { clientOnly } from "@solidjs/start";



const Navbar = clientOnly(() => import("./Navbar"));




export default function Header() {
    return <Navbar />;
  }