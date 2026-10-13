
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_URL + "";

const FarmerProfile = () => {
    const { farmerId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [farmer, setFarmer] = useState(null);
    const [products, setProducts] = useState([]);
    const [crops, setCrops] = useState([]);
    const [farms, setFarms] = useState([]);
    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [quantities, setQuantities] = useState({});
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchArray(url) {
            try {
                const response = await fetch(url);

                if (!response.ok) return null;

                const data = await response.json();
                return Array.isArray(data) ? data : null;
            } catch {
                return null;
            }
        }

        async function fetchFarmerFarms() {
            // Try the farmer-specific endpoint first.
            const specific = await fetchArray(
                `${API}/farms/farmer/${farmerId}`
            );

            if (specific !== null) return specific;

            // Fall back to all farms and filter by farmer ID.
            const allFarms = await fetchArray(`${API}/farms`);

            if (allFarms === null) return [];

            return allFarms.filter(
                farm => Number(farm.farmerId) === Number(farmerId)
            );
        }

        async function loadProfile() {
            setLoading(true);
            setError("");

            try {
                const profileResponse = await fetch(
                    `${API}/users/${farmerId}/profile`
                );

                if (!profileResponse.ok) {
                    throw new Error("Unable to load this farmer's profile.");
                }

                const profile = await profileResponse.json();

                if (profile.role?.toUpperCase() !== "FARMER") {
                    throw new Error("This profile does not belong to a farmer.");
                }

                const [
                    allProducts,
                    farmerCrops,
                    farmerFarms,
                    farmerOrders
                ] = await Promise.all([
                    fetchArray(`${API}/products`),
                    fetchArray(`${API}/crops/farmer/${farmerId}`),
                    fetchFarmerFarms(),
                    fetchArray(`${API}/orders/farmer/${farmerId}`)
                ]);

                if (cancelled) return;

                const farmerProducts = (allProducts || []).filter(
                    product =>
                        Number(product.farmerId) === Number(farmerId)
                );

                setFarmer(profile);
                setProducts(farmerProducts);
                setCrops(farmerCrops || []);
                setFarms(farmerFarms || []);
                setOrders(farmerOrders || []);

                setQuantities(
                    Object.fromEntries(
                        farmerProducts.map(product => [
                            product.id,
                            "1"
                        ])
                    )
                );
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Unable to load farmer details.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, [farmerId]);

    if (loading) {
        return (
            <main className="farmer-profile-page">
                Loading farmer profile...
            </main>
        );
    }

    if (error) {
        return (
            <main className="farmer-profile-page">
                <button onClick={() => navigate(-1)}>← Back</button>
                <p>{error}</p>
            </main>
        );
    }

    const uniqueValues = values => [
        ...new Set(
            values
                .filter(value =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                )
                .map(value => String(value).trim())
        )
    ];

    // Support common field names used for farm and crop records.
    const soilTypes = uniqueValues([
        ...farms.map(farm =>
            farm.soilType ?? farm.soil ?? farm.soilCategory
        ),
        ...crops.map(crop =>
            crop.soilType ?? crop.soil ?? crop.soilCategory
        )
    ]);

    const fertilizers = uniqueValues(
        crops.map(crop =>
            crop.fertilizerUsed ??
            crop.fertilizerName ??
            crop.fertilizer
        )
    );

    const seedSources = uniqueValues(
        crops.map(crop =>
            crop.seedSource ??
            crop.seedCompany ??
            crop.seedSourceCompany
        )
    );

    const cropNames = uniqueValues(
        crops.map(crop => crop.cropName ?? crop.name)
    );

    // Calculate farm area without mixing different units.
    const areaByUnit = farms.reduce((totals, farm) => {
        const rawArea =
            farm.area ??
            farm.cultivatedArea ??
            farm.farmArea ??
            farm.totalArea;

        if (rawArea === null || rawArea === undefined || rawArea === "") {
            return totals;
        }

        const area = Number(rawArea);

        if (!Number.isFinite(area)) return totals;

        const unit =
            farm.areaUnit ??
            farm.unit ??
            farm.areaMeasure ??
            "Unit not specified";

        totals[unit] = (totals[unit] || 0) + area;

        return totals;
    }, {});

    const cultivatedAreaText = Object.entries(areaByUnit)
        .map(([unit, area]) => `${area.toFixed(2)} ${unit}`)
        .join(", ");

    const completedOrders = orders.filter(order =>
        ["DELIVERED", "COMPLETED"].includes(
            String(order.orderStatus || "").toUpperCase()
        )
    ).length;

    const updateQuantity = (productId, value) => {
        setQuantities(previous => ({
            ...previous,
            [productId]: value
        }));
    };

    const getCart = () => {
        try {
            const cart = JSON.parse(
                localStorage.getItem("cart") || "[]"
            );

            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    };

    const addToCart = product => {
        const quantity = Number(quantities[product.id] || 1);

        setCartError("");
        setCartMessage("");

        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > Number(product.quantity)
        ) {
            setCartError("Please select a valid available quantity.");
            return;
        }

        const cart = getCart();

        const existing = cart.find(
            item => Number(item.id) === Number(product.id)
        );

        const currentQuantity = Number(existing?.cartQuantity || 0);

        if (currentQuantity + quantity > Number(product.quantity)) {
            setCartError(
                `Only ${product.quantity} kg of ${product.productName} is available.`
            );
            return;
        }

        const updatedCart = existing
            ? cart.map(item =>
                Number(item.id) === Number(product.id)
                    ? {
                        ...item,
                        cartQuantity: currentQuantity + quantity
                    }
                    : item
            )
            : [...cart, { ...product, cartQuantity: quantity }];

        localStorage.setItem("cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("cartUpdated"));

        setCartMessage(
            `${product.productName} added to cart successfully!`
        );
    };

    const buyNow = product => {
        const quantity = Number(quantities[product.id] || 1);

        setCartError("");
        setCartMessage("");

        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > Number(product.quantity)
        ) {
            setCartError("Please select a valid available quantity.");
            return;
        }

        navigate("/customer/checkout", {
            state: {
                user: location.state?.user,
                product: {
                    ...product,
                    cartQuantity: quantity
                }
            }
        });
    };

    return (
        <main className="farmer-profile-page">
            <button onClick={() => navigate(-1)}>
                ← Back to Products
            </button>

            <section className="farmer-profile-card">
                <div className="farmer-profile-avatar">🌱</div>

                <p className="farmer-profile-label">
                    AGRICULTURE PARTNER
                </p>

                <h1>{farmer.name || "Registered Farmer"}</h1>

                <p>
                    {[
                        farmer.village,
                        farmer.district,
                        farmer.state
                    ]
                        .filter(Boolean)
                        .join(", ") || "Location not provided"}
                </p>

                <p>
                    Growing fresh produce and connecting directly with customers.
                </p>
            </section>

            <section className="farmer-profile-stats">
                <article>
                    <h2>{farms.length}</h2>
                    <p>Registered Farms</p>
                </article>

                <article>
                    <h2>{crops.length}</h2>
                    <p>Crop Records</p>
                </article>

                <article>
                    <h2>{products.length}</h2>
                    <p>Listed Products</p>
                </article>

                <article>
                    <h2>{completedOrders}</h2>
                    <p>Completed Purchases</p>
                </article>
            </section>

            <section className="farmer-profile-section">
                <h2>Farming Information 🌾</h2>

                <div className="farmer-profile-details">
                    <article>
                        <h3>Soil Type</h3>
                        <p>
                            {soilTypes.join(", ") || "Not provided yet"}
                        </p>
                    </article>

                    <article>
                        <h3>Fertilizers Used</h3>
                        <p>
                            {fertilizers.join(", ") || "No records available"}
                        </p>
                    </article>

                    <article>
                        <h3>Seed Sources / Companies</h3>
                        <p>
                            {seedSources.join(", ") || "No records available"}
                        </p>
                    </article>

                    <article>
                        <h3>Crops Cultivated</h3>
                        <p>
                            {cropNames.join(", ") || "No crop records available"}
                        </p>
                    </article>

                    <article>
                        <h3>Total Cultivated Area</h3>
                        <p>
                            {cultivatedAreaText || "Not provided yet"}
                        </p>
                    </article>
                </div>
            </section>

            <section className="farmer-profile-section">
                <h2>Products from this Farmer</h2>

                {cartMessage && (
                    <p className="products-success">{cartMessage}</p>
                )}

                {cartError && (
                    <p className="customer-products-error">{cartError}</p>
                )}

                {products.length === 0 ? (
                    <p>No products currently listed by this farmer.</p>
                ) : (
                    <div className="customer-products-grid">
                        {products.map(product => {
                            const quantity = Number(
                                quantities[product.id] || 1
                            );

                            const available = Number(product.quantity);

                            const maxQuantity = Math.min(
                                Math.floor(available),
                                100
                            );

                            return (
                                <article
                                    className="customer-product-card"
                                    key={product.id}
                                >
                                    <div className="customer-product-image">
                                        <span>🌱</span>

                                        <span className="product-category-tag">
                                            {product.category || "Farm produce"}
                                        </span>
                                    </div>

                                    <div className="customer-product-body">
                                        <h2>{product.productName}</h2>

                                        <p className="customer-product-description">
                                            {product.description ||
                                                "Fresh farm produce"}
                                        </p>

                                        <p className="customer-product-stock">
                                            {available > 0
                                                ? `${available} kg available`
                                                : "Out of stock"}
                                        </p>

                                        <div className="customer-product-price-row">
                                            <span className="customer-product-price">
                                                ₹{Number(product.price).toFixed(2)}
                                            </span>

                                            <span className="product-unit">
                                                / kg
                                            </span>
                                        </div>

                                        <label
                                            htmlFor={`farmer-quantity-${product.id}`}
                                        >
                                            Quantity
                                        </label>

                                        <select
                                            id={`farmer-quantity-${product.id}`}
                                            value={quantities[product.id] || "1"}
                                            disabled={maxQuantity < 1}
                                            onChange={event =>
                                                updateQuantity(
                                                    product.id,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            {Array.from(
                                                { length: maxQuantity },
                                                (_, index) => index + 1
                                            ).map(value => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {value} kg
                                                </option>
                                            ))}
                                        </select>

                                        <div className="customer-product-total">
                                            <span>Total price</span>

                                            <strong>
                                                ₹{(
                                                    Number(product.price) *
                                                    quantity
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div className="customer-product-actions">
                                            <button
                                                className="add-to-cart-button"
                                                disabled={maxQuantity < 1}
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                            >
                                                Add to Cart
                                            </button>

                                            <button
                                                className="buy-now-button"
                                                disabled={maxQuantity < 1}
                                                onClick={() =>
                                                    buyNow(product)
                                                }
                                            >
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
};

export default FarmerProfile;
