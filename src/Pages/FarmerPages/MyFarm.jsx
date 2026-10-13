
import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import LogoutButton from "../LogoutButton";

const API_URL = import.meta.env.VITE_API_URL + "/farms";
const MAX_FARMS = 6;

function getSavedUser() {
    try {
        return JSON.parse(
            sessionStorage.getItem("user") ||
            localStorage.getItem("user") ||
            "null"
        );
    } catch {
        return null;
    }
}

const initialFarmForm = {
    farmName: "",
    location: "",
    area: "",
    areaUnit: "Acres",
    soilType: "Red Soil",
    irrigationMethod: "Drip Irrigation"
};

const MyFarm = () => {
    const location = useLocation();
    const user = location.state?.user || getSavedUser();
    const farmerId = user?.id;

    const [farms, setFarms] = useState([]);
    const [form, setForm] = useState(initialFarmForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);

    const loadFarms = useCallback(async () => {
        if (!farmerId) {
            setFarms([]);
            setMessage("User details not found. Please log in again.");
            setError(true);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/farmer/${farmerId}`
            );

            if (!response.ok) {
                throw new Error("Failed to retrieve your farms.");
            }

            const data = await response.json();
            setFarms(Array.isArray(data) ? data : []);
            setMessage("");
            setError(false);
        } catch (err) {
            setMessage(
                err.message || "Could not load farms. Check your backend."
            );
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [farmerId]);

    useEffect(() => {
        loadFarms();
    }, [loadFarms]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function saveFarm(event) {
        event.preventDefault();
        setMessage("");
        setError(false);

        if (!farmerId) {
            setMessage("Please log in again before adding a farm.");
            setError(true);
            return;
        }

        if (farms.length >= MAX_FARMS) {
            setMessage("You can add a maximum of 6 farms.");
            setError(true);
            return;
        }

        if (
            !form.farmName.trim() ||
            !form.location.trim() ||
            !form.area ||
            Number(form.area) <= 0
        ) {
            setMessage("Please enter valid farm details.");
            setError(true);
            return;
        }

        setSaving(true);

        const farm = {
            farmName: form.farmName.trim(),
            location: form.location.trim(),
            area: Number(form.area),
            areaUnit: form.areaUnit,
            soilType: form.soilType,
            irrigationMethod: form.irrigationMethod,
            farmerId: farmerId
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(farm)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to save farm.");
            }

            await response.json();

            setForm(initialFarmForm);
            setShowForm(false);
            setMessage("Farm saved successfully! 🌱");

            await loadFarms();
        } catch (err) {
            setMessage(err.message || "Could not save farm.");
            setError(true);
        } finally {
            setSaving(false);
        }
    }

    const totalAreaByUnit = farms.reduce((totals, farm) => {
        const unit = farm.areaUnit || "Unspecified";
        totals[unit] =
            (totals[unit] || 0) + (Number(farm.area) || 0);
        return totals;
    }, {});

    const totalAreaText = Object.entries(totalAreaByUnit)
        .map(([unit, area]) => `${area.toFixed(2)} ${unit}`)
        .join(" · ");

    return (
        <main className="myfarm-page">
            <header className="myfarm-navbar">
                <div className="myfarm-brand">
                    <span className="myfarm-brand-icon">🌿</span>
                    <div>
                        <h2>Farming Management</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="myfarm-navbar-right">
                    <span className="myfarm-role">Farmer Portal</span>
                    <LogoutButton />
                </div>
            </header>

            <div className="myfarm-content">
                <section className="myfarm-hero">
                    <span className="myfarm-eyebrow">
                        FARM MANAGEMENT
                    </span>

                    <h1>
                        Your Farms,{" "}
                        <span>{user?.name || "Farmer"}</span> 🌾
                    </h1>

                    <p>
                        Manage your agricultural lands, record soil
                        information and organize your farming resources.
                    </p>

                    <div className="myfarm-summary">
                        <div>
                            <span>Registered Farms</span>
                            <strong>
                                {farms.length} / {MAX_FARMS}
                            </strong>
                        </div>

                        <div>
                            <span>Total Recorded Area</span>
                            <strong>{totalAreaText || "Not recorded"}</strong>
                        </div>
                    </div>
                </section>

                {message && (
                    <div
                        className={`myfarm-message ${
                            error ? "myfarm-message-error" : ""
                        }`}
                        role="status"
                    >
                        {message}
                    </div>
                )}

                <section className="myfarm-section">
                    <div className="myfarm-section-heading">
                        <div>
                            <span className="myfarm-eyebrow">
                                YOUR AGRICULTURAL LAND
                            </span>
                            <h2>My Farms</h2>
                            <p>
                                View your registered farms and their details.
                            </p>
                        </div>

                        {farms.length < MAX_FARMS && farmerId && (
                            <button
                                className="myfarm-add-button"
                                onClick={() => {
                                    setMessage("");
                                    setShowForm(previous => !previous);
                                }}
                            >
                                {showForm ? "− Close Form" : "+ Add Farm"}
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="myfarm-empty">
                            <span>🌱</span>
                            <p>Loading your farms...</p>
                        </div>
                    ) : farms.length === 0 ? (
                        <div className="myfarm-empty">
                            <span>🚜</span>
                            <h3>No farms registered yet</h3>
                            <p>
                                Add your first farm to start recording
                                your agricultural land.
                            </p>

                            {farmerId && (
                                <button
                                    className="myfarm-add-button"
                                    onClick={() => setShowForm(true)}
                                >
                                    + Register Your First Farm
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="myfarm-grid">
                            {farms.map((farm, index) => (
                                <article
                                    className="myfarm-card"
                                    key={farm.id}
                                >
                                    <div className="myfarm-card-top">
                                        <div className="myfarm-card-icon">
                                            🚜
                                        </div>
                                        <span className="myfarm-card-number">
                                            FARM {String(index + 1).padStart(2, "0")}
                                        </span>
                                    </div>

                                    <h3>{farm.farmName}</h3>

                                    <p className="myfarm-location">
                                        <span>📍</span>
                                        {farm.location || "Location not provided"}
                                    </p>

                                    <div className="myfarm-card-details">
                                        <div>
                                            <span>Land Area</span>
                                            <strong>
                                                {farm.area} {farm.areaUnit}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Soil Type</span>
                                            <strong>
                                                {farm.soilType || "Not specified"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Irrigation</span>
                                            <strong>
                                                {farm.irrigationMethod ||
                                                    "Not specified"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="myfarm-card-footer">
                                        <span>🌱 Registered Farm</span>
                                        <span>Happy Farming!</span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {showForm && farms.length < MAX_FARMS && farmerId && (
                    <section className="myfarm-form-section">
                        <div className="myfarm-form-heading">
                            <span>🌱</span>
                            <div>
                                <h2>Add a New Farm</h2>
                                <p>
                                    Enter your farm details to register your land.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={saveFarm} className="myfarm-form">
                            <div className="myfarm-form-grid">
                                <div className="myfarm-field">
                                    <label htmlFor="farmName">Farm Name</label>
                                    <input
                                        id="farmName"
                                        name="farmName"
                                        value={form.farmName}
                                        onChange={handleChange}
                                        placeholder="e.g. My Farm"
                                        required
                                    />
                                </div>

                                <div className="myfarm-field">
                                    <label htmlFor="farmLocation">
                                        Farm Location
                                    </label>
                                    <input
                                        id="farmLocation"
                                        name="location"
                                        value={form.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Vijayawada"
                                        required
                                    />
                                </div>

                                <div className="myfarm-field">
                                    <label htmlFor="farmArea">Land Area</label>
                                    <input
                                        id="farmArea"
                                        name="area"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.area}
                                        onChange={handleChange}
                                        placeholder="Enter land area"
                                        required
                                    />
                                </div>

                                <div className="myfarm-field">
                                    <label htmlFor="areaUnit">Area Unit</label>
                                    <select
                                        id="areaUnit"
                                        name="areaUnit"
                                        value={form.areaUnit}
                                        onChange={handleChange}
                                    >
                                        <option value="Acres">Acres</option>
                                        <option value="Hectares">Hectares</option>
                                        <option value="Cents">Cents</option>
                                    </select>
                                </div>

                                <div className="myfarm-field">
                                    <label htmlFor="soilType">Soil Type</label>
                                    <select
                                        id="soilType"
                                        name="soilType"
                                        value={form.soilType}
                                        onChange={handleChange}
                                    >
                                        <option value="Red Soil">Red Soil</option>
                                        <option value="Black Soil">Black Soil</option>
                                        <option value="Alluvial Soil">
                                            Alluvial Soil
                                        </option>
                                        <option value="Sandy Soil">Sandy Soil</option>
                                        <option value="Clay Soil">Clay Soil</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="myfarm-field">
                                    <label htmlFor="irrigationMethod">
                                        Irrigation Method
                                    </label>
                                    <select
                                        id="irrigationMethod"
                                        name="irrigationMethod"
                                        value={form.irrigationMethod}
                                        onChange={handleChange}
                                    >
                                        <option value="Drip Irrigation">
                                            Drip Irrigation
                                        </option>
                                        <option value="Sprinkler Irrigation">
                                            Sprinkler Irrigation
                                        </option>
                                        <option value="Flood Irrigation">
                                            Flood Irrigation
                                        </option>
                                        <option value="Rainfed">Rainfed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="myfarm-form-actions">
                                <button
                                    type="submit"
                                    className="myfarm-add-button"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Farm"}
                                </button>

                                <button
                                    type="button"
                                    className="myfarm-cancel-button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setForm(initialFarmForm);
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <footer className="myfarm-footer">
                    <strong>🌿 Farming Management</strong>
                    <p>Supporting smarter and more sustainable farming.</p>
                </footer>
            </div>
        </main>
    );
};

export default MyFarm;
