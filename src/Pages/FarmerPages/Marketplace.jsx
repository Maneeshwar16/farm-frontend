
import React, { useEffect, useState } from "react";


const Marketplace = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(import.meta.env.VITE_API_URL + "/products")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Unable to load products.");
                }
                return response.json();
            })
            .then((data) => {
                setProducts(data);
            })
            .catch((err) => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return (
        <div className="marketplace-page">
            <h1>Farm Fresh Marketplace 🌾</h1>
            <p>Buy fresh agricultural products directly from farmers.</p>

            {loading && <p>Loading products...</p>}

            {error && <p className="marketplace-error">{error}</p>}

            {!loading && !error && products.length === 0 && (
                <div className="marketplace-empty">
                    <h2>No Products Available</h2>
                    <p>Products listed by farmers will appear here.</p>
                </div>
            )}

            <div className="marketplace-grid">
                {products.map((product) => (
                    <div className="marketplace-card" key={product.id}>
                        <h2>{product.productName}</h2>

                        <p>
                            <strong>Category:</strong> {product.category}
                        </p>

                        <p>
                            <strong>Available:</strong> {product.quantity} kg
                        </p>

                        <p className="marketplace-price">
                            ₹{product.price} / kg
                        </p>

                        <p>
                            {product.description || "Fresh farm produce"}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Marketplace;
