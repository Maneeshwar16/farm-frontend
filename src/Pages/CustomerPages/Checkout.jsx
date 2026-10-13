
  import React, { useEffect, useState } from "react";
  import { useLocation, useNavigate } from "react-router-dom";

  const API = import.meta.env.VITE_API_URL + "";

  const getSavedUser = () => {
    try {
      return JSON.parse(
        sessionStorage.getItem("user") ||
        localStorage.getItem("user") ||
        "null"
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

  const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [user] = useState(() => location.state?.user || getSavedUser());

    const [cart, setCart] = useState(() => {
      if (location.state?.cart?.length) return location.state.cart;

      if (location.state?.product) {
        return [{
          ...location.state.product,
          cartQuantity: location.state.product.cartQuantity || 1
        }];
      }

      try {
        return JSON.parse(localStorage.getItem("cart") || "[]");
      } catch {
        return [];
      }
    });

    const [address, setAddress] = useState(() => ({
      ...emptyAddress,
      ...(location.state?.address || {})
    }));

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [loading, setLoading] = useState(false);
    const [demoPaymentStatus, setDemoPaymentStatus] = useState("");
    const [orderMessage, setOrderMessage] = useState("");
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);

    const [checkoutRequestId] = useState(() => {
      // Reuse the ID for retries of the same checkout.
      const storageKey = "checkoutRequestId";
      let id = sessionStorage.getItem(storageKey);

      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(storageKey, id);
      }

      return id;
    });

    useEffect(() => {
      if (!user?.id) return;

      localStorage.setItem("user", JSON.stringify(user));

      let cancelled = false;
      setLoadingProfile(true);

      fetch(`${API}/users/${user.id}/profile`)
        .then((response) => {
          if (!response.ok) throw new Error("Unable to load profile.");
          return response.json();
        })
        .then((profile) => {
          if (cancelled) return;

          // Preserve an explicitly supplied checkout address.
          // Fill only missing fields from the saved profile.
          setAddress((previous) => ({
            phone: previous.phone || profile.phone || "",
            address: previous.address || profile.address || "",
            village: previous.village || profile.village || "",
            district: previous.district || profile.district || "",
            state: previous.state || profile.state || "",
            pincode: previous.pincode || profile.pincode || ""
          }));
        })
        .catch(() => {
          if (!cancelled) {
            setOrderMessage(
              "Your profile could not be loaded. You can enter your delivery address below."
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

    const subtotal = cart.reduce(
      (total, item) =>
        total + Number(item.price) * Number(item.cartQuantity || 1),
      0
    );

    const deliveryCharge = 0;
    const total = Math.max(0, subtotal + deliveryCharge - discount);

    const handleAddressChange = (event) => {
      const { name, value } = event.target;
      setAddress((previous) => ({ ...previous, [name]: value }));
    };

    const lookupPincode = async () => {
      if (!/^[1-9][0-9]{5}$/.test(address.pincode.trim())) {
        setOrderMessage("Enter a valid 6-digit Indian PIN code.");
        return;
      }

      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${address.pincode.trim()}`
        );
        if (!response.ok) throw new Error();

        const result = await response.json();
        const office = result[0]?.PostOffice?.[0];

        if (result[0]?.Status !== "Success" || !office) {
          setOrderMessage("PIN code not found. Please check it.");
          return;
        }

        setAddress((previous) => ({
          ...previous,
          district: office.District || "",
          state: office.State || ""
        }));
        setOrderMessage("");
      } catch {
        setOrderMessage("Could not look up the PIN code. Please try again.");
      }
    };

    const applyCoupon = () => {
      if (coupon.trim().toUpperCase() === "FARM10") {
        const amount = subtotal * 0.1;
        setDiscount(amount);
        setCouponMessage(`Coupon applied! You saved ₹${amount.toFixed(2)}.`);
      } else {
        setDiscount(0);
        setCouponMessage("Invalid coupon code. Try FARM10.");
      }
    };

    const handlePlaceOrder = async () => {
      setOrderMessage("");
      if (
        paymentMethod === "DEMO" &&
        demoPaymentStatus !== "SUCCESS"
      ) {
        setOrderMessage(
          "Please complete the demo payment successfully before placing your order."
        );
        return;
      }

      if (!user?.id) {
        setOrderMessage("Customer details are missing. Please log in again.");
        return;
      }

      if (cart.length === 0) {
        setOrderMessage("Your cart is empty.");
        return;
      }

      if (
        !/^[6-9][0-9]{9}$/.test(address.phone.trim()) ||
        !address.address.trim() ||
        !address.village.trim() ||
        !/^[1-9][0-9]{5}$/.test(address.pincode.trim()) ||
        !address.district.trim() ||
        !address.state.trim()
      ) {
        setOrderMessage(
          "Complete the delivery address, phone number, PIN code, district and state above."
        );
        return;
      }

      for (const item of cart) {
        const quantity = Number(item.cartQuantity || 1);
        if (!Number.isInteger(quantity) || quantity < 1) {
          setOrderMessage(`Check the quantity for ${item.productName}.`);
          return;
        }
      }

      setLoading(true);

      try {
        localStorage.setItem("checkoutAddress", JSON.stringify(address));

        const response = await fetch(`${API}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: user.id,
            checkoutRequestId,
            address: {
              phone: address.phone,
              address: address.address,
              village: address.village,
              district: address.district,
              state: address.state,
              pincode: address.pincode
            },
            items: cart.map((item) => ({
              productId: item.id,
              quantity: Number(item.cartQuantity || 1)
            })),
            couponCode: coupon.trim().toUpperCase(),
            paymentMethod
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to place your order.");
        }

        setOrderId(data.orderId);
        setOrderSuccess(true);
        setOrderMessage(
          data.alreadyPlaced
            ? `This checkout was already placed. Order ID: ${data.orderId}`
            : `Order placed successfully! Order ID: ${data.orderId}`
        );

        // Do not clear the cart until the backend confirms success.
        localStorage.removeItem("cart");
        setCart([]);

        // Prepare a new id for a future, separate checkout.
        sessionStorage.removeItem("checkoutRequestId");
      } catch (error) {
        setOrderMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="checkout-page">
        <header className="checkout-header">
          <button
            className="checkout-back-button"
            onClick={() =>
              navigate("/customer/cart", { state: { user } })
            }
          >
            ← Back to Cart
          </button>

          <h1>🌾 Farm Fresh Checkout</h1>
          <p>
            {user?.name ? `Almost there, ${user.name}!` : "Complete your order."}
          </p>
        </header>

        <div className="checkout-quote">
          <p>Fresh from the farm, bringing goodness to your table.</p>
          <span>Support farmers. Eat fresh. Live well.</span>
        </div>

        <div className="checkout-layout">
          <main className="checkout-main">
            <section className="checkout-section">
              <h2>📦 Order Summary</h2>

              {cart.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                cart.map((item) => (
                  <div className="checkout-product" key={item.id}>
                    <div>
                      <h3>{item.productName}</h3>
                      <p>{item.category}</p>
                      <p>Quantity: {item.cartQuantity || 1} kg</p>
                      <p>₹{Number(item.price).toFixed(2)} / kg</p>
                    </div>
                    <strong>
                      ₹{(
                        Number(item.price) * Number(item.cartQuantity || 1)
                      ).toFixed(2)}
                    </strong>
                  </div>
                ))
              )}
            </section>

            <section className="checkout-section">
              <h2>📍 Delivery Address</h2>
              {loadingProfile && <p>Loading your saved address...</p>}

              <p>Your profile details are filled in automatically. You can edit them for this order.</p>

              <div className="checkout-address-form">
                <label htmlFor="checkout-phone">Phone Number</label>
                <input
                  id="checkout-phone"
                  name="phone"
                  value={address.phone}
                  onChange={handleAddressChange}
                  maxLength="10"
                  placeholder="10-digit mobile number"
                />

                <label htmlFor="checkout-address">House Number, Street and Area</label>
                <textarea
                  id="checkout-address"
                  name="address"
                  value={address.address}
                  onChange={handleAddressChange}
                  rows="3"
                  placeholder="Enter house number, street and area"
                />

                <label htmlFor="checkout-village">Village / City / Town</label>
                <input
                  id="checkout-village"
                  name="village"
                  value={address.village}
                  onChange={handleAddressChange}
                  placeholder="Village or city"
                />

                <label htmlFor="checkout-pincode">PIN Code</label>
                <div className="checkout-coupon-row">
                  <input
                    id="checkout-pincode"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleAddressChange}
                    maxLength="6"
                    placeholder="6-digit PIN code"
                  />
                  <button type="button" onClick={lookupPincode}>
                    Find District & State
                  </button>
                </div>

                <label htmlFor="checkout-district">District</label>
                <input
                  id="checkout-district"
                  name="district"
                  value={address.district}
                  onChange={handleAddressChange}
                  placeholder="District"
                />

                <label htmlFor="checkout-state">State</label>
                <input
                  id="checkout-state"
                  name="state"
                  value={address.state}
                  onChange={handleAddressChange}
                  placeholder="State"
                />
              </div>
            </section>

            <section className="checkout-section">
              <h2>🎟️ Apply Coupon</h2>
              <p className="checkout-muted">Use FARM10 for a 10% discount.</p>

              <div className="checkout-coupon-row">
                <input
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Enter coupon code"
                  disabled={orderSuccess}
                />
                <button onClick={applyCoupon} disabled={orderSuccess}>
                  Apply
                </button>
              </div>

              {couponMessage && (
                <p className={discount > 0 ? "checkout-success" : "checkout-error"}>
                  {couponMessage}
                </p>
              )}
            </section>

            <section className="checkout-section">
              <h2>💳 Payment Method</h2>

              {[
                ["COD", "Cash on Delivery", "Pay when your order arrives."],
                ["QR", "QR Code Payment", "Payment verification is required."],
                ["BANK", "Bank Transfer", "Payment verification is required."],
                ["DEMO", "Demo Payment", "Test payment for project demonstration. No real money."]
              ].map(([value, title, description]) => (
                <label className="checkout-payment-option" key={value}>
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    disabled={orderSuccess}
                  />
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}

              {paymentMethod === "DEMO" ? (
                <div className="checkout-payment-info">
                  <p>
                    <strong>Demo Payment Mode</strong>
                  </p>

                  <p>No real money will be charged.</p>

                  <button
                    type="button"
                    onClick={() => setDemoPaymentStatus("SUCCESS")}
                    disabled={loading || orderSuccess}
                  >
                    Simulate Success
                  </button>

                  <button
                    type="button"
                    onClick={() => setDemoPaymentStatus("FAILED")}
                    disabled={loading || orderSuccess}
                  >
                    Simulate Failure
                  </button>

                  {demoPaymentStatus === "SUCCESS" && (
                    <p className="checkout-success">
                      Demo payment successful! You can now confirm the order.
                    </p>
                  )}

                  {demoPaymentStatus === "FAILED" && (
                    <p className="checkout-error">
                      Demo payment failed. Please try again.
                    </p>
                  )}
                </div>
              ) : paymentMethod === "QR" || paymentMethod === "BANK" ? (
                <div className="checkout-payment-info">
                  Configure and verify online payments before accepting them.
                </div>
              ) : null}
            </section>
          </main>

          <aside className="checkout-summary">
            <h2>Price Details</h2>

            <div className="checkout-summary-row">
              <span>Unique products</span>
              <span>{cart.length}</span>
            </div>

            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="checkout-summary-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>

            <div className="checkout-summary-row checkout-discount">
              <span>Discount preview</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>

            <hr />

            <div className="checkout-total">
              <span>Total payable*</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>

            <p className="checkout-summary-note">
              *The backend calculates the final order total.
            </p>

            <button
              className="checkout-place-order-button"
              onClick={handlePlaceOrder}
              disabled={loading || orderSuccess || cart.length === 0}
            >
              {loading ? "Placing Order..." : orderSuccess ? "Order Placed" : "Confirm Order"}
            </button>

            {orderMessage && (
              <p className={orderSuccess ? "checkout-success" : "checkout-order-message"}>
                {orderMessage}
              </p>
            )}

            {orderSuccess && (
              <button
                className="checkout-secondary-button"
                onClick={() => navigate("/customer/orders", { state: { user, orderId } })}
              >
                View My Orders
              </button>
            )}

            <p className="checkout-secure-note">
              🌱 Supporting local farmers, one order at a time.
            </p>
          </aside>
        </div>
      </div>
    );
  };

  export default Checkout;
