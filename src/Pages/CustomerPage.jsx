import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";
function CustomerPage() {
    const location = useLocation();
    const user = location.state?.user;
    const navigate = useNavigate();

    const dashboardCards = [
        {
            icon: "🛒",
            title: "Explore Products",
            description: "Discover fresh agricultural products directly from farmers.",
            button: "Browse Products",
            path: "/customer/products"
        },
        {
            icon: "📦",
            title: "My Orders",
            description: "Track and manage your agricultural purchases.",
            button: "View Orders",
            path: "/customer/orders"
        },
        {
            icon: "🧺",
            title: "My Cart",
            description: "Review your selected products before checkout.",
            button: "Open Cart",
            path: "/customer/cart"
        },
        {
            icon: "👤",
            title: "My Profile",
            description: "View and manage your personal account details.",
            button: "View Profile",
            path: "/customer/profile"
        }
    ];

    return (
        <main className="customer-dashboard">
            <header className="customer-navbar">
                <div className="customer-brand">
                    <span className="customer-brand-icon">✦</span>
                    Farming<span>Management</span>
                </div>

                <div className="customer-nav-right">
                    <span className="customer-role">Customer</span>
                    <LogoutButton />
                </div>
            </header>

            <section className="customer-welcome">
                <div className="customer-welcome-text">
                    <span className="customer-eyebrow">
                        YOUR  DASHBOARD
                    </span>

                    <h1>
                        Hey, {user?.name || "there"}!
                    </h1>

                    <p>
                        Welcome to your customer dashboard.
                        Fresh products and trusted farmers are just a click away.
                    </p>
                </div>

                <div className="customer-welcome-icon">👤</div>
            </section>

            <section className="customer-section">
                <div className="customer-section-heading">
                    <div>
                        <h2>Your Dashboard</h2>
                        <p>Everything you need, all in one place.</p>
                    </div>
                </div>

                <div className="customer-cards">
                    {dashboardCards.map((card) => (
                        <article className="customer-card" key={card.title}>
                            <div className="customer-card-icon">
                                {card.icon}
                            </div>

                            <h3>{card.title}</h3>

                            <p>{card.description}</p>

                            <button
                                className="customer-card-button"
                                onClick={() =>
                                    navigate(card.path, {
                                        state: { user }
                                    })
                                }
                            >
                                {card.button}
                                <span> →</span>
                            </button>
                        </article>
                    ))}
                </div>
            </section>

            <footer className="customer-footer">
                Growing together for a sustainable future 🌿
            </footer>
        </main>
    );
}

export default CustomerPage;
