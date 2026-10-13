
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "../../LogoutButton";


const BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const API_URL = `${BASE_URL}/products`;

function getSavedUser() {
    try {
        return (
            JSON.parse(sessionStorage.getItem("user") || "null") ||
            JSON.parse(localStorage.getItem("user") || "null")
        );
    } catch {
        return null;
    }
}

const initialProduct = {
    productName: "",
    category: "",
    quantity: "",
    price: "",
    description: ""
};

const Products = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user || getSavedUser();

    const [showForm, setShowForm] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [product, setProduct] = useState(initialProduct);

    const totalProducts = products.length;

    const lowStockProducts = products.filter(
        item => Number(item.quantity) <= 10
    );

    const totalInventoryValue = products.reduce(
        (total, item) =>
            total + Number(item.quantity || 0) * Number(item.price || 0),
        0
    );

    const fetchProducts = useCallback(async () => {
        if (!user?.id) {
            setProducts([]);
            setError("Farmer details not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setError("");

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Unable to fetch products.");
            }

            const data = await response.json();

            const farmerProducts = data.filter(
                item => Number(item.farmerId) === Number(user.id)
            );

            setProducts(farmerProducts);
        } catch (err) {
            setError(err.message || "Unable to load products.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchProducts();

        const refreshProducts = () => {
            if (!document.hidden) {
                fetchProducts();
            }
        };

        window.addEventListener("focus", refreshProducts);
        document.addEventListener("visibilitychange", refreshProducts);

        const intervalId = setInterval(() => {
            if (!document.hidden) {
                fetchProducts();
            }
        }, 15000);

        return () => {
            window.removeEventListener("focus", refreshProducts);
            document.removeEventListener("visibilitychange", refreshProducts);
            clearInterval(intervalId);
        };
    }, [fetchProducts]);

    const handleChange = event => {
        const { name, value } = event.target;

        setProduct(previous => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!user?.id) {
            setError("Farmer details not found. Please log in again.");
            return;
        }

        if (
            !product.productName.trim() ||
            !product.category ||
            !product.quantity ||
            !product.price ||
            Number(product.quantity) <= 0 ||
            Number(product.price) <= 0
        ) {
            setError("Enter a valid product name, category, quantity and price.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...product,
                    productName: product.productName.trim(),
                    quantity: Number(product.quantity),
                    price: Number(product.price),
                    farmerId: Number(user.id)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Unable to save product.");
            }

            const savedProduct = await response.json();

            setProducts(previous => [
                ...previous,
                savedProduct
            ]);

            setProduct(initialProduct);
            setShowForm(false);
            setMessage("Product added successfully! 🌱");
        } catch (err) {
            setError(err.message || "Unable to save product.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async id => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmed) return;

        setError("");
        setMessage("");
        setDeletingId(id);

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Unable to delete product.");
            }

            setProducts(previous =>
                previous.filter(item => item.id !== id)
            );

            setMessage("Product deleted successfully.");
        } catch (err) {
            setError(err.message || "Unable to delete product.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <main className="farmer-products-page">
            <header className="farmer-products-navbar">
                <div className="farmer-products-brand">
                    <span className="farmer-products-brand-icon">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="farmer-products-navbar-actions">
                    <span className="farmer-products-portal">
                        Farmer Portal
                    </span>
                    <LogoutButton />
                </div>
            </header>

            <section className="farmer-products-hero">
                <button
                    type="button"
                    className="farmer-products-back"
                    onClick={() =>
                        navigate("/farmer/profile", {
                            state: { user }
                        })
                    }
                >
                    ← Back to Profile
                </button>

                <p className="farmer-products-eyebrow">
                    FARM INVENTORY
                </p>

                <h1>My Products 🌾</h1>

                <p>
                    Welcome, {user?.name || "Farmer"}! Manage your agricultural
                    products, monitor available stock, and list products for sale.
                </p>

                <button
                    type="button"
                    className="farmer-products-primary"
                    onClick={() => {
                        setShowForm(previous => !previous);
                        setMessage("");
                        setError("");
                    }}
                >
                    {showForm ? "Close Form" : "+ Add Product"}
                </button>
            </section>

            <section className="farmer-products-stats">
                <article className="farmer-products-stat">
                    <span className="farmer-products-stat-icon">📦</span>
                    <div>
                        <p>Total Products</p>
                        <h3>{totalProducts}</h3>
                    </div>
                </article>

                <article className="farmer-products-stat">
                    <span className="farmer-products-stat-icon">⚠️</span>
                    <div>
                        <p>Low Stock Products</p>
                        <h3>{lowStockProducts.length}</h3>
                    </div>
                </article>

                <article className="farmer-products-stat">
                    <span className="farmer-products-stat-icon">💰</span>
                    <div>
                        <p>Inventory Value</p>
                        <h3>
                            ₹{totalInventoryValue.toLocaleString("en-IN", {
                                maximumFractionDigits: 2
                            })}
                        </h3>
                    </div>
                </article>
            </section>

            {message && (
                <div className="farmer-products-message success" role="status">
                    {message}
                </div>
            )}

            {error && (
                <div className="farmer-products-message error" role="alert">
                    {error}
                </div>
            )}

            {lowStockProducts.length > 0 && (
                <section className="farmer-products-alert">
                    <div className="farmer-products-alert-heading">
                        <span>⚠️</span>
                        <div>
                            <h3>Low Stock Alerts</h3>
                            <p>
                                These products have 10 kg or less in available
                                stock.
                            </p>
                        </div>
                    </div>

                    <div className="farmer-products-alert-list">
                        {lowStockProducts.map(item => (
                            <div
                                className="farmer-products-alert-item"
                                key={item.id}
                            >
                                <span>{item.productName}</span>
                                <strong>
                                    {Number(item.quantity)} kg left
                                </strong>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {showForm && (
                <section className="farmer-products-form-panel">
                    <div className="farmer-products-section-heading">
                        <p className="farmer-products-eyebrow">
                            NEW LISTING
                        </p>
                        <h2>Add an Agricultural Product 🌱</h2>
                        <p>
                            Provide the product details and quantity available
                            for customers.
                        </p>
                    </div>

                    <form
                        className="farmer-products-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="farmer-products-form-grid">
                            <div className="farmer-products-field">
                                <label htmlFor="productName">
                                    Product Name
                                </label>
                                <input
                                    id="productName"
                                    name="productName"
                                    type="text"
                                    placeholder="e.g. Tomatoes"
                                    value={product.productName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="farmer-products-field">
                                <label htmlFor="category">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={product.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Fruits">Fruits</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Pulses">Pulses</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="farmer-products-field">
                                <label htmlFor="quantity">
                                    Available Quantity (kg)
                                </label>
                                <input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Enter quantity"
                                    value={product.quantity}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="farmer-products-field">
                                <label htmlFor="price">
                                    Price per kg (₹)
                                </label>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Enter price"
                                    value={product.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="farmer-products-field full-width">
                                <label htmlFor="description">
                                    Product Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="4"
                                    placeholder="Describe the quality, freshness, or other details..."
                                    value={product.description}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="farmer-products-form-actions">
                            <button
                                type="submit"
                                className="farmer-products-primary"
                                disabled={saving}
                            >
                                {saving ? "Saving Product..." : "Save Product"}
                            </button>

                            <button
                                type="button"
                                className="farmer-products-cancel"
                                disabled={saving}
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="farmer-products-list-section">
                <div className="farmer-products-section-heading">
                    <p className="farmer-products-eyebrow">YOUR INVENTORY</p>
                    <h2>Listed Products</h2>
                    <p>Review the products and their current availability.</p>
                </div>

                {loading ? (
                    <p className="farmer-products-info">
                        Loading your products...
                    </p>
                ) : products.length === 0 ? (
                    <div className="farmer-products-empty">
                        <span>🌱</span>
                        <h3>No Products Listed Yet</h3>
                        <p>
                            Add your first agricultural product to start
                            selling to customers.
                        </p>
                        <button
                            type="button"
                            className="farmer-products-primary"
                            onClick={() => setShowForm(true)}
                        >
                            + Add Your First Product
                        </button>
                    </div>
                ) : (
                    <div className="farmer-products-grid">
                        {products.map(item => {
                            const quantity = Number(item.quantity || 0);
                            const lowStock = quantity <= 10;

                            return (
                                <article
                                    className="farmer-product-card"
                                    key={item.id}
                                >
                                    <div className="farmer-product-card-top">
                                        <span className="farmer-product-icon">
                                            {item.category === "Fruits"
                                                ? "🍎"
                                                : item.category === "Grains"
                                                    ? "🌾"
                                                    : item.category === "Pulses"
                                                        ? "🫘"
                                                        : "🥬"}
                                        </span>

                                        <span className="farmer-product-category">
                                            {item.category || "Other"}
                                        </span>
                                    </div>

                                    <h3>{item.productName}</h3>

                                    <div className="farmer-product-price">
                                        ₹{Number(item.price).toLocaleString(
                                            "en-IN",
                                            { maximumFractionDigits: 2 }
                                        )}
                                        <span> / kg</span>
                                    </div>

                                    <p className="farmer-product-description">
                                        {item.description ||
                                            "No description provided."}
                                    </p>

                                    <div className="farmer-product-stock">
                                        <span>Available Stock</span>
                                        <strong>
                                            {quantity.toLocaleString("en-IN")} kg
                                        </strong>
                                    </div>

                                    <span
                                        className={`farmer-product-stock-badge ${lowStock ? "low" : "available"
                                            }`}
                                    >
                                        {quantity <= 0
                                            ? "Out of Stock"
                                            : lowStock
                                                ? "Low Stock"
                                                : "In Stock"}
                                    </span>

                                    <button
                                        type="button"
                                        className="farmer-product-delete"
                                        disabled={deletingId === item.id}
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        {deletingId === item.id
                                            ? "Deleting..."
                                            : "Delete Product"}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
};

export default Products;
