
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";


function MyOrders() {
    const location = useLocation();
    const navigate = useNavigate();

    const user =
        location.state?.user ||
        JSON.parse(sessionStorage.getItem("user") || "null") ||
        JSON.parse(localStorage.getItem("user") || "null");

    const [orders, setOrders] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user?.id) {
            setError("Please log in to view your orders.");
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                const response = await fetch(
                    import.meta.env.VITE_API_URL + `/orders/customer/${user.id}`
                );

                if (!response.ok) {
                    throw new Error("Unable to fetch your orders.");
                }

                const data = await response.json();

                // Display newest orders first.
                const sortedOrders = [...data].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );

                setOrders(sortedOrders);

                // Fetch the items for each order.
                const itemsResults = await Promise.all(
                    sortedOrders.map(async (order) => {
                        const itemsResponse = await fetch(
                            import.meta.env.VITE_API_URL + `/orders/${order.id}/items`
                        );

                        if (!itemsResponse.ok) {
                            return [order.id, []];
                        }

                        return [order.id, await itemsResponse.json()];
                    })
                );

                setOrderItems(Object.fromEntries(itemsResults));
            } catch (err) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user?.id]);

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    if (loading) {
        return <div className="my-orders-page">Loading your orders...</div>;
    }

    return (
        <div className="my-orders-page">
            <header className="my-orders-header">
                <div>
                    <p className="my-orders-eyebrow">YOUR ACCOUNT</p>
                    <h1>My Orders</h1>
                    <p>
                        Hey {user?.name || "there"}, track your farm-fresh
                        purchases here.
                    </p>
                </div>

                <button
                    className="orders-shop-button"
                    onClick={() => navigate("/customer/products")}
                >
                    Continue Shopping
                </button>
            </header>

            {error && <div className="orders-error">{error}</div>}

            {!error && orders.length === 0 && (
                <div className="orders-empty">
                    <div className="orders-empty-icon">🛒</div>
                    <h2>No orders yet</h2>
                    <p>
                        Your orders will appear here after you place your
                        first order.
                    </p>
                    <button
                        className="orders-shop-button"
                        onClick={() => navigate("/customer/products")}
                    >
                        Explore Products
                    </button>
                </div>
            )}

            <div className="my-orders-list">
                {orders.map((order) => (
                    <article className="my-order-card" key={order.id}>
                        <div className="my-order-top">
                            <div>
                                <span className="my-order-label">ORDER ID</span>
                                <h2>#{order.id}</h2>
                                <p>{formatDate(order.createdAt)}</p>
                            </div>

                            <span
                                className={`order-status ${
                                    order.orderStatus?.toLowerCase() || "placed"
                                }`}
                            >
                                {order.orderStatus || "PLACED"}
                            </span>
                        </div>

                        <div className="my-order-products">
                            <h3>Items ordered</h3>

                            {(orderItems[order.id] || []).length === 0 ? (
                                <p className="order-muted">
                                    {orderItems[order.id]
                                        ? "No items found."
                                        : "Loading items..."}
                                </p>
                            ) : (
                                orderItems[order.id].map((item) => (
                                    <div
                                        className="my-order-item"
                                        key={item.id}
                                    >
                                        <div>
                                            <strong>{item.productName}</strong>
                                            <p>
                                                Quantity: {item.quantity} kg
                                            </p>
                                        </div>

                                        <strong>
                                            ₹
                                            {Number(
                                                item.totalPrice || 0
                                            ).toLocaleString("en-IN")}
                                        </strong>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="my-order-details">
                            <div>
                                <span>Payment method</span>
                                <strong>{order.paymentMethod}</strong>
                            </div>

                            <div>
                                <span>Payment status</span>
                                <strong>
                                    {order.paymentStatus || "PENDING"}
                                </strong>
                            </div>

                            <div>
                                <span>Subtotal</span>
                                <strong>
                                    ₹{Number(order.subtotal || 0).toFixed(2)}
                                </strong>
                            </div>

                            <div>
                                <span>Discount</span>
                                <strong>
                                    −₹{Number(order.discount || 0).toFixed(2)}
                                </strong>
                            </div>

                            <div className="my-order-total">
                                <span>Total paid / payable</span>
                                <strong>
                                    ₹
                                    {Number(
                                        order.totalAmount || 0
                                    ).toFixed(2)}
                                </strong>
                            </div>
                        </div>

                        <div className="my-order-address">
                            <h3>Delivery address</h3>
                            <p>{order.phone}</p>
                            <p>
                                {[
                                    order.deliveryAddress,
                                    order.village,
                                    order.district,
                                    order.state,
                                    order.pincode,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default MyOrders;
