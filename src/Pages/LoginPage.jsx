import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const loginUser = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(import.meta.env.VITE_API_URL + "/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password
                })
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Invalid email or password.");
            }

            const data = await response.json();

            console.log("Login successful", data);

            // Clear old session to avoid role or farmerId cross-contamination
            sessionStorage.clear();
            localStorage.removeItem("user");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("loggedInUser");
            localStorage.removeItem("farmer");
            localStorage.removeItem("userData");

            // Store current user session
            sessionStorage.setItem("user", JSON.stringify(data));
            localStorage.setItem("user", JSON.stringify(data));

            if (data.role === "FARMER") {
                navigate("/farmer", { state: { user: data } });
            } else if (
                data.role === "CUSTOMER" ||
                data.role === "USER"
            ) {
                navigate("/customer", { state: { user: data } });
            } else {
                setError("Your account has an unrecognized role.");
            }
        } catch (err) {
            setError(err.message || "Unable to log in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <div className="register-brand">
                <span className="brand-leaf">✦</span>
                <span>
                    Farming<span className="brand-highlight">Management</span>
                </span>
                <p>Grow smarter. Sell better. Build a greener tomorrow.</p>
            </div>

            <section className="register-card">
                <div className="register-heading">
                    <span className="register-eyebrow">
                        WELCOME BACK
                    </span>

                    <h1>Sign in to <span>FarmingManagement</span></h1>

                    <p>
                        Your farming journey continues here.
                    </p>
                </div>

                <form onSubmit={loginUser}>
                    <label htmlFor="login-email">
                        Email address
                    </label>

                    <input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="login-password">
                        Password
                    </label>

                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

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
                        {loading ? "Signing in..." : "Sign in →"}
                    </button>
                </form>

                <div className="register-footer">
                    <span>New to FarmingManagement?</span>
                    <Link to="/register">Create an account</Link>
                </div>
            </section>

            <p className="register-bottom">
                Growing together for a sustainable future 🌿
            </p>
        </main>
    );
}

export default LoginPage;
