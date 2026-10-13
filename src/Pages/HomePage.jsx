import { useLocation } from "react-router-dom";
import LogoutButton from "./LogoutButton";
function HomePage() {

    const location = useLocation();
    const user = location.state?.user;

    return (
        <>
        <div id="logouths"> <LogoutButton/> </div>
        <div style={{ textAlign: "center",marginLeft: "40vw" }}>
            <h1>Hey {user?.name}</h1>
            <h2>Welcome to HOME PAGE!</h2>
        </div>
        </>
    );
}

export default HomePage;