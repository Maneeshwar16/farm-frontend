import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {

    const navigate = useNavigate();

    const logout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

export default LogoutButton;