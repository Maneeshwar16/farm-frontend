
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

export default App
*/

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
        <Route
          path="/"
          element={
            <main className="farm-landing-page">
              <header className="farm-landing-navbar">
                <a href="/" className="farm-landing-brand">
                  <span className="farm-landing-logo">🌿</span>
                  <span className="farm-landing-brand-text">
                    <strong>FarmingManagement</strong>
                    <small>Smart Farming Management</small>
                  </span>
                </a>

                <nav className="farm-landing-nav">
                  <a href="#features">Features</a>
                  <a href="#about">About</a>
                  <a className="farm-landing-login" href="/login">
                    Login
                  </a>
                  <a className="farm-landing-register" href="/register">
                    Get Started <span>→</span>
                  </a>
                </nav>
              </header>

              <section className="farm-landing-hero">
                <div className="farm-landing-copy">
                  <span className="farm-landing-badge">
                    🌱 SMARTER FARMING, BETTER FUTURES
                  </span>

                  <h1>
                    Grow Better.
                    <br />
                    Farm <span>Smarter.</span>
                  </h1>

                  <p>
                    Manage your farms, monitor crop growth, record expenses,
                    track harvests and bring agricultural products closer
                    to customers — all in one place.
                  </p>

                  <div className="farm-landing-actions">
                    <a href="/register" className="farm-landing-primary">
                      Create Your Account <span>→</span>
                    </a>
                    <a href="/login" className="farm-landing-secondary">
                      Sign In
                    </a>
                  </div>

                  <div className="farm-landing-highlights">
                    <div>
                      <span>🚜</span>
                      <strong>Farm Management</strong>
                      <small>Organize your farms</small>
                    </div>
                    <div>
                      <span>🌱</span>
                      <strong>Crop Tracking</strong>
                      <small>Monitor crop progress</small>
                    </div>
                    <div>
                      <span>🧺</span>
                      <strong>Farm Marketplace</strong>
                      <small>Connect with customers</small>
                    </div>
                  </div>
                </div>

                <div className="farm-landing-visual">
                  <div className="farm-landing-orbit farm-landing-orbit-one" />
                  <div className="farm-landing-orbit farm-landing-orbit-two" />

                  <div className="farm-landing-plant">🌾</div>

                  <div className="farm-landing-floating farm-landing-floating-top">
                    <span>🌱</span>
                    <div>
                      <strong>Growing sustainably</strong>
                      <small>Organized farming activities</small>
                    </div>
                  </div>

                  <div className="farm-landing-floating farm-landing-floating-bottom">
                    <span>🧺</span>
                    <div>
                      <strong>Farm to customer</strong>
                      <small>A connected marketplace</small>
                    </div>
                  </div>

                  <div className="farm-landing-visual-caption">
                    <span>🌿</span>
                    <div>
                      <strong>FarmingManagement</strong>
                      <p>Supporting smarter, sustainable farming.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="farm-landing-features" id="features">
                <div className="farm-landing-section-heading">
                  <span>YOUR FARMING WORKSPACE</span>
                  <h2>Everything in one place.</h2>
                  <p>
                    Practical tools to organize everyday farming activities
                    and agricultural shopping.
                  </p>
                </div>

                <div className="farm-landing-feature-grid">
                  <article>
                    <span>🚜</span>
                    <h3>Farm Management</h3>
                    <p>
                      Keep farm details organized and accessible.
                    </p>
                  </article>

                  <article>
                    <span>🌱</span>
                    <h3>Crop & Harvest Records</h3>
                    <p>
                      Maintain crop information and completed harvest records.
                    </p>
                  </article>

                  <article>
                    <span>💰</span>
                    <h3>Expense Tracking</h3>
                    <p>
                      Record farming expenses and review your records.
                    </p>
                  </article>

                  <article>
                    <span>🛒</span>
                    <h3>Agricultural Marketplace</h3>
                    <p>
                      Browse products and manage agricultural orders.
                    </p>
                  </article>
                </div>
              </section>

              <section className="farm-landing-cta" id="about">
                <div>
                  <span>START YOUR FARMING JOURNEY</span>
                  <h2>Make farming activities easier to organize.</h2>
                  <p>
                    Create an account and explore FarmingManagement.
                  </p>
                </div>

                <a href="/register">Get Started →</a>
              </section>

              <footer className="farm-landing-footer">
                <strong>🌿 FarmingManagement</strong>
                <span>
                  Supporting smarter and more sustainable farming.
                </span>
              </footer>
            </main>
          }
        />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/logout" element={<LogoutButton />} />
        <Route path="/farmer" element={<FarmerPage />} />
        <Route path="/customer" element={<CustomerPage />} />

        {/* Farmer routes after login */}
        <Route path="/farmer/myharvest" element={<MyHarvest />} />
        <Route path="/farmer/myfarm" element={<MyFarm />} />
        <Route path="/farmer/myexpense" element={<FarmerExpenses />} />
        <Route path="/farmer/mycrop" element={<MyCrop />} />
        <Route
          path="/farmer/myharvest/currentharvest"
          element={<CurrentHarvests />}
        />
        <Route
          path="/farmer/myharvest/pastharvest"
          element={<PastHarvests />}
        />
        <Route path="/farmer/myfarm/farm1" element={<Farm1 />} />
        <Route path="/farmer/myfarm/farm2" element={<Farm2 />} />
        <Route path="/farmer/mycrop/crop1" element={<Crop1 />} />
        <Route path="/farmer/mycrop/crop2" element={<Crop2 />} />
        <Route path="/farmer/products" element={<Products />} />
        <Route path="/farmer/profile" element={<Profile />} />
        <Route path="/farmer/orders" element={<FarmerOrders />} />

        {/* User routes after login */}
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/products" element={<ProductDetails />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/orders" element={<MyOrders />} />
        <Route path="/customer/marketplace" element={<Marketplace />} />
        <Route
          path="/customer/farmer/:farmerId"
          element={<FarmerProfile />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
