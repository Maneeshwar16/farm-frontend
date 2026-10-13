
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";

const farmerFeatures = [
    {
        title: "My Farms",
        description: "Manage your farms and view farm details.",
        icon: "🚜",
        route: "/farmer/myfarm",
        label: "Manage Farms"
    },
    {
        title: "My Crops",
        description: "Track crop growth, planting dates and crop stages.",
        icon: "🌱",
        route: "/farmer/mycrop",
        label: "Manage Crops"
    },
    {
        title: "Expenses",
        description: "Record and monitor your farming expenses.",
        icon: "💰",
        route: "/farmer/myexpense",
        label: "View Expenses"
    },
    {
        title: "My Harvest",
        description: "Maintain harvest records and track your produce.",
        icon: "🌾",
        route: "/farmer/myharvest",
        label: "View Harvests"
    },
    {
        title: "My Products",
        description: "List agricultural products and manage available stock.",
        icon: "🧺",
        route: "/farmer/products",
        label: "Manage Products"
    },
    {
        title: "My Profile",
        description: "View and update your personal and farming details.",
        icon: "👨‍🌾",
        route: "/farmer/profile",
        label: "View Profile"
    }
];

function FarmerPage() {
    const location = useLocation();
    const user = location.state?.user;
    const navigate = useNavigate();

    const openFeature = route => {
        navigate(route, {
            state: { user }
        });
    };

    return (
        <div className="farmer-dashboard-page">
            <header className="farmer-dashboard-navbar">
                <div className="farmer-dashboard-brand">
                    <span className="farmer-dashboard-logo">🌿</span>
                    <div>
                        <h2>Farming Management</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="farmer-dashboard-navbar-right">
                    <span className="farmer-dashboard-role">
                        Farmer Portal
                    </span>
                    <LogoutButton />
                </div>
            </header>

            <main className="farmer-dashboard-main">
                <section className="farmer-dashboard-welcome">
                    <div className="farmer-dashboard-welcome-content">
                        <span className="farmer-dashboard-eyebrow">
                            YOUR FARMING JOURNEY
                        </span>

                        <h1>
                            Welcome back,{" "}
                            <span>{user?.name || "Farmer"}</span>! 🌾
                        </h1>

                        <p>
                            Manage your farms, monitor your crops, track
                            expenses and bring your produce to market — all
                            in one place.
                        </p>

                        <button
                            className="farmer-dashboard-primary"
                            onClick={() => openFeature("/farmer/myfarm")}
                        >
                            Explore My Farms <span>→</span>
                        </button>
                    </div>

                    <div className="farmer-dashboard-welcome-art">
                        <span>🌱</span>
                        <div className="farmer-dashboard-art-caption">
                            <strong>Grow Better. Farm Smarter.</strong>
                            <span>Your farm, your progress.</span>
                        </div>
                    </div>
                </section>

                <section className="farmer-dashboard-section">
                    <div className="farmer-dashboard-section-heading">
                        <div>
                            <span className="farmer-dashboard-eyebrow">
                                YOUR WORKSPACE
                            </span>
                            <h2>Manage Your Farm</h2>
                            <p>
                                Everything you need to keep your farming
                                activities organized.
                            </p>
                        </div>

                        <span className="farmer-dashboard-feature-count">
                            {farmerFeatures.length} Features
                        </span>
                    </div>

                    <div className="farmer-dashboard-grid">
                        {farmerFeatures.map((feature, index) => (
                            <article
                                className="farmer-dashboard-card"
                                key={feature.route}
                                style={{ "--card-index": index }}
                            >
                                <div className="farmer-dashboard-card-top">
                                    <div className="farmer-dashboard-icon">
                                        {feature.icon}
                                    </div>
                                    <span className="farmer-dashboard-card-number">
                                        0{index + 1}
                                    </span>
                                </div>

                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>

                                <button
                                    className="farmer-dashboard-card-button"
                                    onClick={() => openFeature(feature.route)}
                                >
                                    {feature.label}
                                    <span>→</span>
                                </button>
                            </article>
                        ))}
                    </div>
                </section>

                <footer className="farmer-dashboard-footer">
                    <span>🌿 Farming Management</span>
                    <p>Supporting smarter and more sustainable farming.</p>
                </footer>
            </main>
        </div>
    );
}

export default FarmerPage;
