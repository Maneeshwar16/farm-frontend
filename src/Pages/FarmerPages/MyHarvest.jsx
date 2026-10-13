import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "../LogoutButton";


const MyHarvest = () => {
    const location = useLocation();
    const navigate = useNavigate();

    let user = location.state?.user;

    if (!user) {
        try {
            user =
                JSON.parse(sessionStorage.getItem("user") || "null") ||
                JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            user = null;
        }
    }

    const harvestSections = [
        {
            id: 1,
            title: "Current Harvests",
            emoji: "🌱",
            description:
                "Track growing crops, update their growth stages, and prepare for harvesting.",
            route: "/farmer/myharvest/currentharvest",
            label: "Manage Growing Crops",
        },
        {
            id: 2,
            title: "Past Harvests",
            emoji: "🌾",
            description:
                "Review completed harvests, quantities collected, selling prices, and revenue.",
            route: "/farmer/myharvest/pastharvest",
            label: "View Harvest Records",
        },
    ];

    return (
        <main className="harvest-dashboard">
            <nav className="harvest-navbar">
                <div className="harvest-brand">
                    <div className="harvest-logo">🌿</div>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="harvest-nav-actions">
                    <span className="harvest-portal">Farmer Portal</span>
                    <LogoutButton />
                </div>
            </nav>

            <header className="harvest-hero">
                <p className="harvest-eyebrow">Farm Management</p>
                <h1>Hey {user?.name || "Farmer"} 🌾</h1>
                <h2>Your Harvests</h2>
                <p>
                    Manage growing crops and review completed harvests in one
                    place. Keep track of crop progress and your harvest records.
                </p>
            </header>

            <section className="harvest-sections">
                <h2 className="harvest-section-title">Harvest Management</h2>
                <p className="harvest-section-description">
                    Choose a section to manage your farming activities.
                </p>

                <div className="harvest-grid">
                    {harvestSections.map((section) => (
                        <article className="harvest-card" key={section.id}>
                            <div className="harvest-card-icon">
                                {section.emoji}
                            </div>

                            <h3>{section.title}</h3>
                            <p>{section.description}</p>

                            <button
                                type="button"
                                className="harvest-card-button"
                                onClick={() =>
                                    navigate(section.route, {
                                        state: { user },
                                    })
                                }
                            >
                                {section.label} →
                            </button>
                        </article>
                    ))}
                </div>
            </section>

            <footer className="harvest-footer">
                <button
                    type="button"
                    className="harvest-back-button"
                    onClick={() =>
                        navigate("/farmer", {
                            state: { user },
                        })
                    }
                >
                    ← Back to Dashboard
                </button>
            </footer>
        </main>
    );
};

export default MyHarvest;
