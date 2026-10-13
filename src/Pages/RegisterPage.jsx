import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";


function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const registerUser = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(import.meta.env.VITE_API_URL + "/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    role
                })
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Registration failed.");
            }

            alert("Registration successful! Please log in.");
            navigate("/login");
        } catch (err) {
            setError(err.message || "Unable to register. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <div className="register-brand">
                <span className="brand-leaf">✦</span>
                <span>Farming<span className="brand-highlight">Management</span></span>
                <p>Grow smarter. Sell better. Build a greener tomorrow.</p>
            </div>

            <section className="register-card">
                <div className="register-heading">
                    <span className="register-eyebrow">JOIN OUR COMMUNITY</span>
                    <h1>Create your <span>account</span></h1>
                    <p>Your journey towards smarter agriculture starts here.</p>
                </div>

                <form onSubmit={registerUser}>
                    <label htmlFor="name">Full name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                    />
                    <label htmlFor="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                    />

                    <label htmlFor="role">I want to join as</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="">Select your role</option>
                        <option value="FARMER">🌱 Farmer — Manage and sell crops</option>
                        <option value="CUSTOMER">🛒 Consumer — Discover farm products</option>
                    </select>

                    {error && (
                        <p className="register-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="register-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create account →"}
                    </button>
                </form>

                <div className="register-footer">
                    <span>Already have an account?</span>
                    <Link to="/login">Sign in</Link>
                </div>
            </section>

            <p className="register-bottom">
                Growing together for a sustainable future 🌿
            </p>
        </main>
    );
}

export default RegisterPage;
