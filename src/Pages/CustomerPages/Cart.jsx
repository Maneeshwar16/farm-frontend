
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API = (
    import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

const getSavedUser = () => {
    try {
        return (
            JSON.parse(sessionStorage.getItem("user") || "null") ||
            JSON.parse(localStorage.getItem("user") || "null")
        );
    } catch {
        return null;
    }
};

const emptyAddress = {
    phone: "",
    address: "",
    village: "",
    district: "",
    state: "",
    pincode: ""
};

const Cart = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [user] = useState(() => location.state?.user || getSavedUser());

    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("cart") || "[]");
        } catch {
            return [];
        }
    });

    const [profile, setProfile] = useState({});
    const [address, setAddress] = useState(() => {
        try {
            return {
                ...emptyAddress,
                ...(JSON.parse(
                    localStorage.getItem("checkoutAddress") || "null"
                ) || {})
            };
        } catch {
            return { ...emptyAddress };
        }
    });

    const [useNewAddress, setUseNewAddress] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [lookingUpPin, setLookingUpPin] = useState(false);
    const [addressError, setAddressError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!user?.id) {
            setMessage("Please log in to continue shopping.");
            return;
        }

        let cancelled = false;
        setLoadingProfile(true);

        fetch(`${API}/users/${user.id}/profile`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Profile could not be loaded.");
                }
                return response.json();
            })
            .then(data => {
                if (cancelled) return;

                setProfile(data);
                setAddress(previous => ({
                    phone: data.phone || previous.phone || "",
                    address: data.address || previous.address || "",
                    village: data.village || previous.village || "",
                    district: data.district || previous.district || "",
                    state: data.state || previous.state || "",
                    pincode: data.pincode || previous.pincode || ""
                }));
                setMessage("");
            })
            .catch(() => {
                if (!cancelled) {
                    setMessage(
                        "Could not load your saved profile. You can enter your delivery details below."
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingProfile(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const updateCart = updatedCart => {
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const changeQuantity = (id, value) => {
        if (value === "") return;

        const quantity = Number(value);
        const item = cart.find(product => product.id === id);

        if (
            !item ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > Number(item.quantity)
        ) {
            setAddressError(
                `Quantity must be between 1 and ${item?.quantity || 0} kg.`
            );
            return;
        }

        setAddressError("");
        updateCart(
            cart.map(product =>
                product.id === id
                    ? { ...product, cartQuantity: quantity }
                    : product
            )
        );
    };

    const removeItem = id => {
        updateCart(cart.filter(item => item.id !== id));
        setAddressError("");
    };

    const subtotal = cart.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.cartQuantity || 1),
        0
    );

    const handleAddressChange = event => {
        const { name, value } = event.target;
        setAddress(previous => ({ ...previous, [name]: value }));
        setAddressError("");
        setMessage("");
    };

    const lookupPincode = async () => {
        const pincode = address.pincode.trim();

        if (!/^[1-9][0-9]{5}$/.test(pincode)) {
            setAddressError("Enter a valid 6-digit Indian PIN code.");
            return;
        }

        setLookingUpPin(true);
        setAddressError("");
        setMessage("");

        try {
            const response = await fetch(
                `https://api.postalpincode.in/pincode/${pincode}`
            );

            if (!response.ok) throw new Error();

            const data = await response.json();
            const office = data[0]?.PostOffice?.[0];

            if (data[0]?.Status !== "Success" || !office) {
                setAddressError("PIN code not found. Please check the number.");
                return;
            }

            setAddress(previous => ({
                ...previous,
                district: office.District || "",
                state: office.State || ""
            }));

            setMessage("District and state filled successfully.");
        } catch {
            setAddressError("Unable to look up the PIN code. Please try again.");
        } finally {
            setLookingUpPin(false);
        }
    };

    const selectSavedAddress = () => {
        setUseNewAddress(false);
        setAddress({
            phone: profile.phone || "",
            address: profile.address || "",
            village: profile.village || "",
            district: profile.district || "",
            state: profile.state || "",
            pincode: profile.pincode || address.pincode || ""
        });
        setAddressError("");
        setMessage("");
    };

    const proceedToCheckout = () => {
        setAddressError("");
        setMessage("");

        if (!user?.id) {
            setAddressError("Please log in again before placing an order.");
            return;
        }

        if (cart.length === 0) {
            setAddressError("Your cart is empty.");
            return;
        }

        for (const item of cart) {
            const quantity = Number(item.cartQuantity || 1);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > Number(item.quantity)
            ) {
                setAddressError(
                    `Check the quantity selected for ${item.productName}.`
                );
                return;
            }
        }

        if (!/^[6-9][0-9]{9}$/.test(address.phone.trim())) {
            setAddressError("Enter a valid 10-digit Indian mobile number.");
            return;
        }

        if (
            !address.address.trim() ||
            !address.village.trim() ||
            !/^[1-9][0-9]{5}$/.test(address.pincode.trim())
        ) {
            setAddressError(
                "Complete your house address, village/city and PIN code."
            );
            return;
        }

        if (!address.district.trim() || !address.state.trim()) {
            setAddressError(
                "Click Find District & State after entering your PIN code."
            );
            return;
        }

        localStorage.setItem("checkoutAddress", JSON.stringify(address));
        localStorage.setItem("user", JSON.stringify(user));

        navigate("/customer/checkout", {
            state: { user, cart, address, subtotal }
        });
    };

    return (
        <main className="customer-cart-page">
            <header className="customer-cart-navbar">
                <div className="customer-cart-brand">
                    <span className="customer-cart-logo">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Fresh from the farm</p>
                    </div>
                </div>

                <div className="customer-cart-nav-actions">
                    <span className="customer-cart-role">Customer Portal</span>
                    <button
                        className="customer-cart-nav-button"
                        onClick={() =>
                            navigate("/customer/products", { state: { user } })
                        }
                    >
                        Continue Shopping
                    </button>
                </div>
            </header>

            <div className="customer-cart-content">
                <section className="customer-cart-hero">
                    <span className="customer-cart-eyebrow">
                        YOUR FARM-TO-HOME SHOPPING
                    </span>
                    <h1>
                        Your Shopping <span>Cart</span> 🛒
                    </h1>
                    <p>
                        {user?.name
                            ? `Hey ${user.name}! `
                            : ""}
                        Review your fresh produce, confirm your delivery
                        details, and get ready to checkout.
                    </p>
                </section>

                {message && (
                    <div className="customer-cart-notice" role="status">
                        {message}
                    </div>
                )}

                {addressError && (
                    <div className="customer-cart-error" role="alert">
                        {addressError}
                    </div>
                )}

                {loadingProfile && (
                    <p className="customer-cart-loading">
                        Loading your saved profile...
                    </p>
                )}

                {cart.length === 0 ? (
                    <section className="customer-cart-empty">
                        <span>🧺</span>
                        <h2>Your cart is empty</h2>
                        <p>
                            Discover fresh products directly from our farmers.
                        </p>
                        <button
                            className="customer-cart-primary-button"
                            onClick={() =>
                                navigate("/customer/products", {
                                    state: { user }
                                })
                            }
                        >
                            Browse Products →
                        </button>
                    </section>
                ) : (
                    <div className="customer-cart-layout">
                        <section className="customer-cart-products">
                            <div className="customer-cart-section-heading">
                                <div>
                                    <span className="customer-cart-eyebrow">
                                        YOUR SELECTION
                                    </span>
                                    <h2>Cart Items ({cart.length})</h2>
                                </div>
                            </div>

                            {cart.map(item => (
                                <article className="customer-cart-item" key={item.id}>
                                    <div className="customer-cart-item-icon">
                                        {item.category?.toLowerCase().includes("fruit")
                                            ? "🍎"
                                            : item.category?.toLowerCase().includes("vegetable")
                                              ? "🥬"
                                              : "🌾"}
                                    </div>

                                    <div className="customer-cart-item-info">
                                        <span className="customer-cart-category">
                                            {item.category || "Farm Product"}
                                        </span>
                                        <h3>{item.productName}</h3>
                                        <p>
                                            {`₹${Number(item.price).toFixed(2)} / kg`}
                                        </p>
                                        <p className="customer-cart-stock">
                                            Available: {item.quantity} kg
                                        </p>
                                    </div>

                                    <div className="customer-cart-item-controls">
                                        <label htmlFor={`cart-qty-${item.id}`}>
                                            Quantity (kg)
                                        </label>
                                        <input
                                            id={`cart-qty-${item.id}`}
                                            type="number"
                                            min="1"
                                            max={item.quantity}
                                            step="1"
                                            value={item.cartQuantity || 1}
                                            onChange={event =>
                                                changeQuantity(
                                                    item.id,
                                                    event.target.value
                                                )
                                            }
                                        />
                                        <strong>
                                            {`₹${(
                                                Number(item.price) *
                                                Number(item.cartQuantity || 1)
                                            ).toFixed(2)}`}
                                        </strong>
                                        <button
                                            className="customer-cart-remove-button"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </section>

                        <aside className="customer-cart-summary">
                            <span className="customer-cart-eyebrow">
                                ORDER SUMMARY
                            </span>
                            <h2>Your Order</h2>

                            <div className="customer-cart-summary-row">
                                <span>Unique products</span>
                                <strong>{cart.length}</strong>
                            </div>

                            <div className="customer-cart-summary-row">
                                <span>Items total</span>
                                <strong>{`₹${subtotal.toFixed(2)}`}</strong>
                            </div>

                            <div className="customer-cart-summary-total">
                                <span>Subtotal</span>
                                <strong>{`₹${subtotal.toFixed(2)}`}</strong>
                            </div>

                            <p className="customer-cart-summary-note">
                                Delivery charges, if applicable, are handled
                                during checkout.
                            </p>
                        </aside>

                        <section className="customer-cart-address">
                            <div className="customer-cart-section-heading">
                                <div>
                                    <span className="customer-cart-eyebrow">
                                        DELIVERY DETAILS
                                    </span>
                                    <h2>📍 Delivery Address</h2>
                                    <p>
                                        Your saved profile address is filled
                                        in automatically when available.
                                    </p>
                                </div>
                            </div>

                            {profile.address && (
                                <label className="customer-cart-address-choice">
                                    <input
                                        type="radio"
                                        name="deliveryAddress"
                                        checked={!useNewAddress}
                                        onChange={selectSavedAddress}
                                    />
                                    <span>
                                        <strong>Use saved profile address</strong>
                                        <small>
                                            {profile.address}
                                            {profile.village
                                                ? `, ${profile.village}`
                                                : ""}
                                        </small>
                                    </span>
                                </label>
                            )}

                            <label className="customer-cart-address-choice">
                                <input
                                    type="radio"
                                    name="deliveryAddress"
                                    checked={useNewAddress || !profile.address}
                                    onChange={() => {
                                        setUseNewAddress(true);
                                        setAddressError("");
                                        setMessage("");
                                    }}
                                />
                                <span>
                                    <strong>Enter a different address</strong>
                                    <small>Choose where you want the order delivered.</small>
                                </span>
                            </label>

                            <div className="customer-cart-address-form">
                                <div className="customer-cart-field">
                                    <label htmlFor="delivery-phone">Phone Number</label>
                                    <input
                                        id="delivery-phone"
                                        name="phone"
                                        type="tel"
                                        value={address.phone}
                                        onChange={handleAddressChange}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                    />
                                </div>

                                <div className="customer-cart-field customer-cart-field-full">
                                    <label htmlFor="delivery-address">
                                        House Number, Street and Area
                                    </label>
                                    <textarea
                                        id="delivery-address"
                                        name="address"
                                        value={address.address}
                                        onChange={handleAddressChange}
                                        placeholder="Enter house number, street and area"
                                        rows="3"
                                    />
                                </div>

                                <div className="customer-cart-field">
                                    <label htmlFor="delivery-village">
                                        Village / City / Town
                                    </label>
                                    <input
                                        id="delivery-village"
                                        name="village"
                                        value={address.village}
                                        onChange={handleAddressChange}
                                        placeholder="Enter village or city"
                                    />
                                </div>

                                <div className="customer-cart-field">
                                    <label htmlFor="delivery-pincode">PIN Code</label>
                                    <div className="customer-cart-pincode-row">
                                        <input
                                            id="delivery-pincode"
                                            name="pincode"
                                            value={address.pincode}
                                            onChange={handleAddressChange}
                                            placeholder="6-digit PIN code"
                                            maxLength="6"
                                            inputMode="numeric"
                                        />
                                        <button
                                            type="button"
                                            onClick={lookupPincode}
                                            disabled={lookingUpPin}
                                        >
                                            {lookingUpPin
                                                ? "Finding..."
                                                : "Find District & State"}
                                        </button>
                                    </div>
                                </div>

                                <div className="customer-cart-field">
                                    <label htmlFor="delivery-district">District</label>
                                    <input
                                        id="delivery-district"
                                        name="district"
                                        value={address.district}
                                        onChange={handleAddressChange}
                                        placeholder="District"
                                    />
                                </div>

                                <div className="customer-cart-field">
                                    <label htmlFor="delivery-state">State</label>
                                    <input
                                        id="delivery-state"
                                        name="state"
                                        value={address.state}
                                        onChange={handleAddressChange}
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <button
                                className="customer-cart-checkout-button"
                                onClick={proceedToCheckout}
                            >
                                Proceed to Checkout →
                            </button>
                        </section>
                    </div>
                )}

                <footer className="customer-cart-footer">
                    <strong>🌿 FarmingManagement</strong>
                    <p>Supporting smarter and more sustainable farming.</p>
                </footer>
            </div>
        </main>
    );
};

export default Cart;
