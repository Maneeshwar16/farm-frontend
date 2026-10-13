import React from 'react'
import { useLocation } from 'react-router-dom'
import LogoutButton from '../LogoutButton';
const MyExpense = () => {
    const location = useLocation();
    const user = location.state?.user;
    return (
        <div>
            <div id="logouths"> <LogoutButton /> </div>
            <div style={{ textAlign: "center", marginLeft: "30vw" }}>
                <h1>Hey {user?.name} 🌾</h1>
                <h1>Your expenses will appear here</h1>
            </div>
        </div>
    )
}

export default MyExpense
