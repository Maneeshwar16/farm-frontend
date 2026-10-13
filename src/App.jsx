/*import {useEffect,useState}from 'react'
import './App.css'
 

function App() {
  const[message,setMessage]=useState('');
  useEffect(() => {
  fetch(import.meta.env.VITE_API_URL + "/hello")
    .then((res) => res.text())
    .then((data) => setMessage(data));
}, []);

  return (
    <div>
      <h1><b>Hello from farm management system,This is frontend from vs</b></h1>
      <h2>{message}</h2>
    </div>
  )
}

export default App   */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RegisterPage from "./Pages/RegisterPage";
import LoginPage from "./Pages/LoginPage";
import HomePage from "./Pages/HomePage";
import LogoutButton from "./Pages/LogoutButton";
import FarmerPage from "./Pages/FarmerPage";
import CustomerPage from "./Pages/CustomerPage";
import MyHarvest from "./Pages/FarmerPages/MyHarvest";
import MyFarm from "./Pages/FarmerPages/MyFarm";
import MyExpense from "./Pages/FarmerPages/MyExpense";
import MyCrop from "./Pages/FarmerPages/MyCrop";
import CurrentHarvests from "./Pages/FarmerPages/My Harvest Pages/CurrentHarvests";
import PastHarvests from "./Pages/FarmerPages/My Harvest Pages/PastHarvests";
import Farm1 from "./Pages/FarmerPages/My Farm Pages/Farm1";
import Farm2 from "./Pages/FarmerPages/My Farm Pages/Farm2";
import Crop1 from "./Pages/FarmerPages/My Crop Pages/Crop1";
import Crop2 from "./Pages/FarmerPages/My Crop Pages/Crop2";
import CustomerProfile from "./Pages/CustomerPages/CustomerProfile";
import Cart from "./Pages/CustomerPages/Cart";
import ProductDetails from "./Pages/CustomerPages/ProductDetails";
import MyOrders from "./Pages/CustomerPages/MyOrders";
import Checkout from "./Pages/CustomerPages/Checkout";
import Products from "./Pages/FarmerPages/My Product Pages/Products";
import Profile from "./Pages/FarmerPages/My Product Pages/Profile";
import Marketplace from "./Pages/FarmerPages/Marketplace";
import FarmerOrders from "./Pages/FarmerPages/FarmerOrders";
import FarmerExpenses from "./Pages/FarmerPages/FarmerExpenses";
import FarmerProfile from "./Pages/CustomerPages/FarmerProfile";



function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={
          <div id="homepage-button">
            <h1>Welcome to the Farm Management System</h1>
            <h2>
              Please <a href="/login">login</a> or{" "}
              <a href="/register">register</a> to continue.
            </h2>
          </div>
        } />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/logout" element={<LogoutButton />} />
        <Route path="/farmer" element={<FarmerPage />} />
        <Route path="/customer" element={<CustomerPage />} />
                  /*Farmer routes after Login*/
        <Route path="/farmer/myharvest" element={<MyHarvest />} />
        <Route path="/farmer/myfarm" element={<MyFarm />} />
        <Route path="/farmer/myexpense" element={<FarmerExpenses />} />
        <Route path="/farmer/mycrop" element={<MyCrop />} />
        <Route path="/farmer/myharvest/currentharvest" element={<CurrentHarvests />} />
        <Route path="/farmer/myharvest/pastharvest" element={<PastHarvests />} />
        <Route path="/farmer/myfarm/farm1" element={<Farm1 />} />
        <Route path="/farmer/myfarm/farm2" element={<Farm2 />} />
        <Route path="/farmer/mycrop/crop1" element={<Crop1 />} />
        <Route path="/farmer/mycrop/crop2" element={<Crop2 />} />
        <Route path="/farmer/products" element={<Products />} />
        <Route path="/farmer/profile" element={<Profile />} />
        <Route path="/farmer/orders" element={<FarmerOrders />}></Route>
                  /*User Routes after login */
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/products" element={<ProductDetails />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/orders" element={<MyOrders />} />
        <Route path="/customer/marketplace" element={<Marketplace />} />
        <Route path="/customer/farmer/:farmerId" element={<FarmerProfile />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;