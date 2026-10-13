import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL + "/products";

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

const ProductDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user] = useState(() => location.state?.user || getSavedUser());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("featured");
  const [availability, setAvailability] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [quantities, setQuantities] = useState({});

  const [cartCount, setCartCount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]").length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load products.");
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);

        const initialQuantities = {};
        data.forEach((product) => {
          initialQuantities[product.id] = "1";
        });
        setQuantities(initialQuantities);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        setCartCount(
          JSON.parse(localStorage.getItem("cart") || "[]").length
        );
      } catch {
        setCartCount(0);
      }
    };

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      )
    ].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((product) =>
        [
          product.productName,
          product.category,
          product.description
        ].some((value) =>
          String(value || "").toLowerCase().includes(searchText)
        )
      );
    }

    if (category !== "ALL") {
      result = result.filter(
        (product) => product.category === category
      );
    }

    if (availability === "available") {
      result = result.filter(
        (product) => Number(product.quantity) > 0
      );
    }

    if (availability === "low") {
      result = result.filter(
        (product) =>
          Number(product.quantity) > 0 &&
          Number(product.quantity) <= 10
      );
    }

    if (maxPrice !== "" && Number(maxPrice) >= 0) {
      result = result.filter(
        (product) => Number(product.price) <= Number(maxPrice)
      );
    }

    switch (sortBy) {
      case "price-low":
        result.sort(
          (a, b) => Number(a.price) - Number(b.price)
        );
        break;

      case "price-high":
        result.sort(
          (a, b) => Number(b.price) - Number(a.price)
        );
        break;

      case "name":
        result.sort((a, b) =>
          String(a.productName || "").localeCompare(
            String(b.productName || "")
          )
        );
        break;

      case "stock":
        result.sort(
          (a, b) => Number(b.quantity) - Number(a.quantity)
        );
        break;

      default:
        break;
    }

    return result;
  }, [products, search, category, availability, maxPrice, sortBy]);

  const updateQuantity = (productId, value) => {
    setQuantities((previous) => ({
      ...previous,
      [productId]: value
    }));
  };

  const getValidQuantity = (product) => {
    const quantity = Number(quantities[product.id] || 1);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > Number(product.quantity)
    ) {
      setError(
        `Choose a valid quantity for ${product.productName}. Available: ${product.quantity} kg.`
      );
      setMessage("");
      return null;
    }

    setError("");
    setMessage("");
    return quantity;
  };

  const addToCart = (product) => {
    const quantity = getValidQuantity(product);
    if (quantity === null) return;

    let existingCart = [];

    try {
      existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      existingCart = [];
    }

    const existingItem = existingCart.find(
      (item) => Number(item.id) === Number(product.id)
    );

    const currentQuantity = existingItem
      ? Number(existingItem.cartQuantity || 0)
      : 0;

    if (currentQuantity + quantity > Number(product.quantity)) {
      setError(
        `Only ${product.quantity} kg of ${product.productName} is available.`
      );
      setMessage("");
      return;
    }

    const updatedCart = existingItem
      ? existingCart.map((item) =>
        Number(item.id) === Number(product.id)
          ? {
            ...item,
            cartQuantity: currentQuantity + quantity
          }
          : item
      )
      : [...existingCart, { ...product, cartQuantity: quantity }];

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);
    window.dispatchEvent(new Event("cartUpdated"));

    setMessage(`${quantity} kg of ${product.productName} added to cart!`);
    setError("");
  };

  const buyNow = (product) => {
    const quantity = getValidQuantity(product);
    if (quantity === null) return;

    navigate("/customer/checkout", {
      state: {
        user,
        product: {
          ...product,
          cartQuantity: quantity
        }
      }
    });
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("ALL");
    setSortBy("featured");
    setAvailability("all");
    setMaxPrice("");
    setError("");
    setMessage("");
  };

  const openCart = () => {
    navigate("/customer/cart", { state: { user } });
  };

  return (
    <main className="customer-products-page">
      <header className="products-navbar">
        <div className="products-brand">
          <span>✦</span> Agri<span>Connect</span>
        </div>

        <button className="products-cart-button" onClick={openCart}>
          🛒 Cart
          <span className="products-cart-count">{cartCount}</span>
        </button>
      </header>

      <section className="products-hero">
        <div>
          <span className="products-eyebrow">
            FARM FRESH · DIRECT FROM FARMERS
          </span>

          <h1>Fresh from the <span>farm.</span></h1>

          <p>
            Discover quality produce, compare prices, and shop
            directly from farmers.
          </p>
        </div>

        <div className="products-hero-icon">👤</div>
      </section>

      <section className="products-toolbar">
        <div className="products-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Search products, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="products-toolbar-right">
          <label htmlFor="sort-products">Sort by</label>

          <select
            id="sort-products"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A–Z</option>
            <option value="stock">Most Stock</option>
          </select>
        </div>
      </section>

      <div className="products-layout">
        <aside className="products-filters">
          <div className="products-filter-heading">
            <h2>Filters</h2>
            <button onClick={resetFilters}>Reset</button>
          </div>

          <div className="products-filter-group">
            <label htmlFor="category-filter">Category</label>

            <select
              id="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="products-filter-group">
            <label htmlFor="price-filter">Maximum price (₹/kg)</label>

            <input
              id="price-filter"
              type="number"
              min="0"
              placeholder="No price limit"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <div className="products-filter-group">
            <label htmlFor="stock-filter">Availability</label>

            <select
              id="stock-filter"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="all">All products</option>
              <option value="available">In stock</option>
              <option value="low">Low stock (10 kg or less)</option>
            </select>
          </div>

          <div className="products-filter-note">
            🌱 <span>Supporting farmers, one purchase at a time.</span>
          </div>
        </aside>

        <section className="products-results">
          <div className="products-results-heading">
            <div>
              <h2>Explore Products</h2>
              <p>
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          {message && (
            <p className="products-success">{message}</p>
          )}

          {error && (
            <p className="customer-products-error">{error}</p>
          )}

          {loading && (
            <p className="products-status">Loading fresh products...</p>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="customer-products-empty">
              <div>🔎</div>
              <h2>No matching products</h2>
              <p>Try another search or adjust your filters.</p>
              <button
                className="products-reset-button"
                onClick={resetFilters}
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="customer-products-grid">
            {filteredProducts.map((product) => {
              const maxQuantity = Math.min(
                Math.floor(Number(product.quantity)),
                100
              );

              const selectedQuantity = Number(
                quantities[product.id] || 1
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
                      {product.description || "Fresh farm produce"}
                    </p>

                    <div className="product-farmer-info">
                      <span>🌱 Cultivated by </span>

                      <button
                        type="button"
                        className="product-farmer-link"
                        onClick={() =>
                          navigate(`/customer/farmer/${product.farmerId}`, {
                            state: { user }
                          })
                        }
                      >
                        {product.farmerName || "Farmer"}
                      </button>
                    </div>


                    <p className="customer-product-stock">
                      <span
                        className={
                          Number(product.quantity) > 10
                            ? "stock-dot"
                            : "stock-dot stock-low"
                        }
                      />
                      {Number(product.quantity) > 0
                        ? `${product.quantity} kg available`
                        : "Out of stock"}
                    </p>

                    <div className="customer-product-price-row">
                      <span className="customer-product-price">
                        ₹{Number(product.price).toFixed(2)}
                      </span>
                      <span className="product-unit">/ kg</span>
                    </div>

                    <label htmlFor={`quantity-${product.id}`}>
                      Quantity
                    </label>

                    <select
                      id={`quantity-${product.id}`}
                      value={quantities[product.id] || "1"}
                      disabled={maxQuantity < 1}
                      onChange={(e) =>
                        updateQuantity(
                          product.id,
                          e.target.value
                        )
                      }
                    >
                      {Array.from(
                        { length: maxQuantity },
                        (_, index) => index + 1
                      ).map((quantity) => (
                        <option
                          key={quantity}
                          value={quantity}
                        >
                          {quantity} kg
                        </option>
                      ))}
                    </select>

                    <div className="customer-product-total">
                      <span>Total price</span>
                      <strong>
                        ₹{(
                          Number(product.price) *
                          selectedQuantity
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div className="customer-product-actions">
                      <button
                        className="add-to-cart-button"
                        disabled={maxQuantity < 1}
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </button>

                      <button
                        className="buy-now-button"
                        disabled={maxQuantity < 1}
                        onClick={() => buyNow(product)}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="products-footer">
        Growing together for a sustainable future 🌿
      </footer>
    </main>
  );
};

export default ProductDetails;
