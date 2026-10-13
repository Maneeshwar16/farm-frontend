
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "../LogoutButton";


const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

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

const initialSummary = {
    newOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalOrders: 0
};

const filters = [
    ["ALL", "All Orders"],
    ["NEW", "New Orders"],
    ["PENDING", "Pending"],
    ["PROCESSING", "Processing"],
    ["SHIPPED", "Shipped"],
    ["DELIVERED", "Delivered"],
    ["CANCELLED", "Cancelled"]
];

const FarmerOrders = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user || getSavedUser();

    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(initialSummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [filter, setFilter] = useState("ALL");

    const salesRevenue = orders.reduce((total, order) => {
        if ((order.orderStatus || "").toUpperCase() === "CANCELLED") {
            return total;
        }

        return total + Number(order.farmerSubtotal || 0);
    }, 0);

    const fetchOrders = useCallback(async (showLoader = true) => {
        if (!user?.id) {
            setError("Farmer details not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            if (showLoader) setLoading(true);
            setError("");

            const [ordersResponse, summaryResponse] = await Promise.all([
                fetch(`${API_URL}/orders/farmer/${user.id}`),
                fetch(`${API_URL}/orders/farmer/${user.id}/summary`)
            ]);

            if (!ordersResponse.ok || !summaryResponse.ok) {
                throw new Error("Unable to load farmer orders.");
            }

            const [ordersData, summaryData] = await Promise.all([
                ordersResponse.json(),
                summaryResponse.json()
            ]);

            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setSummary({ ...initialSummary, ...summaryData });
        } catch (err) {
            setError(err.message || "Unable to load orders.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchOrders();

        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchOrders(false);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchOrders]);

    const updateStatus = async (orderId, status) => {
        setUpdatingOrder(orderId);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/orders/farmer/${user.id}/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ status })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update order status."
                );
            }

            setMessage(`Order #${orderId} updated to ${status}.`);
            await fetchOrders(false);
        } catch (err) {
            setError(err.message || "Unable to update order.");
            await fetchOrders(false);
        } finally {
            setUpdatingOrder(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const status = (order.orderStatus || "").toUpperCase();

        if (filter === "ALL") return true;
        if (filter === "NEW") return status === "PLACED";

        if (filter === "PENDING") {
            return !["DELIVERED", "CANCELLED"].includes(status);
        }

        return status === filter;
    });

    const formatDate = dateValue => {
        if (!dateValue) return "Date unavailable";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const formatCurrency = value =>
        Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    const statusClass = status =>
        (status || "PLACED").toLowerCase().replace(/\s+/g, "-");

    return (
        <main className="farmer-orders-page">
            <header className="fo-navbar">
                <div className="fo-brand">
                    <span className="fo-brand-icon">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="fo-navbar-actions">
                    <span className="fo-portal">Farmer Portal</span>
                    <LogoutButton />
                </div>
            </header>

            <section className="fo-hero">
                <button
                    type="button"
                    className="fo-back-button"
                    onClick={() =>
                        navigate("/farmer/profile", {
                            state: { user }
                        })
                    }
                >
                    ← Back to Profile
                </button>

                <p className="fo-eyebrow">SALES & ORDER MANAGEMENT</p>
                <h1>Order Management 🌾</h1>
                <p>
                    Welcome, {user?.name || "Farmer"}! Track customer orders,
                    update delivery progress, and review your sales.
                </p>
            </section>

            {message && (
                <div className="fo-message success" role="status">
                    {message}
                </div>
            )}

            {error && (
                <div className="fo-message error" role="alert">
                    {error}
                    <button
                        type="button"
                        onClick={() => fetchOrders()}
                    >
                        Retry
                    </button>
                </div>
            )}

            <section className="fo-stats">
                <article className="fo-stat">
                    <span className="fo-stat-icon">🆕</span>
                    <div>
                        <p>New Orders</p>
                        <h3>{summary.newOrders}</h3>
                    </div>
                </article>

                <article className="fo-stat">
                    <span className="fo-stat-icon">⏳</span>
                    <div>
                        <p>Pending Orders</p>
                        <h3>{summary.pendingOrders}</h3>
                    </div>
                </article>

                <article className="fo-stat">
                    <span className="fo-stat-icon">🚚</span>
                    <div>
                        <p>Delivered Orders</p>
                        <h3>{summary.deliveredOrders}</h3>
                    </div>
                </article>

                <article className="fo-stat">
                    <span className="fo-stat-icon">📦</span>
                    <div>
                        <p>Total Orders</p>
                        <h3>{summary.totalOrders}</h3>
                    </div>
                </article>

                <article className="fo-stat fo-revenue-stat">
                    <span className="fo-stat-icon">💰</span>
                    <div>
                        <p>Sales Revenue</p>
                        <h3>₹{formatCurrency(salesRevenue)}</h3>
                        <small>Excludes cancelled orders</small>
                    </div>
                </article>
            </section>

            <section className="fo-orders-section">
                <div className="fo-section-heading">
                    <div>
                        <p className="fo-eyebrow">YOUR SALES</p>
                        <h2>Customer Orders</h2>
                        <p>Review order details and manage order status.</p>
                    </div>

                    <button
                        type="button"
                        className="fo-refresh-button"
                        onClick={() => fetchOrders()}
                        disabled={loading}
                    >
                        ↻ {loading ? "Loading..." : "Refresh Orders"}
                    </button>
                </div>

                <div className="fo-filters">
                    {filters.map(([value, label]) => (
                        <button
                            type="button"
                            key={value}
                            className={filter === value ? "active" : ""}
                            onClick={() => setFilter(value)}
                            aria-pressed={filter === value}
                        >
                            {label}
                            {value === "ALL" && (
                                <span>{orders.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="fo-empty">
                        <span>🌱</span>
                        <p>Loading your customer orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="fo-empty">
                        <span>📦</span>
                        <h3>No orders found</h3>
                        <p>
                            There are no orders in the selected category.
                        </p>
                    </div>
                ) : (
                    <div className="fo-order-list">
                        {filteredOrders.map(order => {
                            const status = (
                                order.orderStatus || "PLACED"
                            ).toUpperCase();

                            const isUpdating =
                                updatingOrder === order.orderId;

                            return (
                                <article
                                    className="fo-order-card"
                                    key={order.orderId}
                                >
                                    <div className="fo-order-header">
                                        <div>
                                            <p className="fo-order-label">
                                                ORDER REFERENCE
                                            </p>
                                            <h3>Order #{order.orderId}</h3>
                                            <p className="fo-order-date">
                                                {formatDate(order.createdAt)}
                                            </p>
                                        </div>

                                        <span
                                            className={`fo-status ${statusClass(status)}`}
                                        >
                                            {status.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    <div className="fo-order-content">
                                        <section className="fo-order-products">
                                            <h4>🛒 Products Ordered</h4>

                                            {order.items?.length ? (
                                                order.items.map((item, index) => (
                                                    <div
                                                        className="fo-product-row"
                                                        key={
                                                            item.id ||
                                                            item.productId ||
                                                            index
                                                        }
                                                    >
                                                        <div>
                                                            <strong>
                                                                {item.productName ||
                                                                    "Product"}
                                                            </strong>
                                                            <p>
                                                                {item.quantity} kg × ₹
                                                                {formatCurrency(
                                                                    item.pricePerKg
                                                                )}
                                                            </p>
                                                        </div>

                                                        <strong>
                                                            ₹
                                                            {formatCurrency(
                                                                Number(item.quantity || 0) *
                                                                Number(item.pricePerKg || 0)
                                                            )}
                                                        </strong>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="fo-muted">
                                                    Product details unavailable.
                                                </p>
                                            )}
                                        </section>

                                        <section className="fo-delivery-details">
                                            <h4>📍 Delivery Details</h4>
                                            <p>
                                                <strong>Customer:</strong>{" "}
                                                {order.customerName || "Not provided"}
                                            </p>
                                            <p>
                                                <strong>Phone:</strong>{" "}
                                                {order.phone || "Not provided"}
                                            </p>
                                            <p>
                                                <strong>Address:</strong>{" "}
                                                {[
                                                    order.deliveryAddress,
                                                    order.village,
                                                    order.district,
                                                    order.state,
                                                    order.pincode
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ") || "Not provided"}
                                            </p>
                                        </section>
                                    </div>

                                    <div className="fo-order-bottom">
                                        <div className="fo-payment-info">
                                            <span>
                                                Payment:{" "}
                                                <strong>
                                                    {order.paymentMethod || "Not specified"}
                                                </strong>
                                            </span>
                                            <span>
                                                Payment Status:{" "}
                                                <strong>
                                                    {order.paymentStatus || "Pending"}
                                                </strong>
                                            </span>
                                        </div>

                                        <div className="fo-subtotal">
                                            <span>Your Product Subtotal</span>
                                            <strong>
                                                ₹{formatCurrency(
                                                    order.farmerSubtotal
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    {status !== "DELIVERED" &&
                                        status !== "CANCELLED" && (
                                            <div className="fo-status-editor">
                                                <div>
                                                    <h4>Update Order Status</h4>
                                                    <p>
                                                        Change the progress of this order.
                                                    </p>
                                                </div>

                                                <select
                                                    aria-label={`Update status for order ${order.orderId}`}
                                                    value={status}
                                                    disabled={isUpdating}
                                                    onChange={event =>
                                                        updateStatus(
                                                            order.orderId,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="PLACED">
                                                        New / Placed
                                                    </option>
                                                    <option value="PROCESSING">
                                                        Processing
                                                    </option>
                                                    <option value="SHIPPED">
                                                        Shipped
                                                    </option>
                                                    <option value="DELIVERED">
                                                        Delivered
                                                    </option>
                                                    <option value="CANCELLED">
                                                        Cancelled
                                                    </option>
                                                </select>

                                                {isUpdating && (
                                                    <span className="fo-updating">
                                                        Updating...
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
};

export default FarmerOrders;
