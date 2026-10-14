import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "../LogoutButton";


const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/crops`;
const MAX_CROPS = 10;

function getSavedUser() {
    for (const storage of [sessionStorage, localStorage]) {
        for (const key of ["user", "currentUser", "farmer", "loggedInUser"]) {
            try {
                const raw = storage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (parsed && (parsed.role === "FARMER" || parsed.user?.role === "FARMER")) {
                    return parsed;
                }
            } catch { }
        }
    }
    try {
        return (
            JSON.parse(sessionStorage.getItem("user") || "null") ||
            JSON.parse(localStorage.getItem("user") || "null")
        );
    } catch {
        return null;
    }
}

const cropStages = [
    "Land Preparation",
    "Seeded / Planted",
    "Pre-Emergence",
    "Emergence / Sprouting",
    "Vegetative Stage",
    "Flowering / Reproductive Stage",
    "Maturation / Ripening",
    "Harvested"
];

const MyCrop = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user || getSavedUser();
    const farmerId = user?.id;

    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const [cropName, setCropName] = useState("");
    const [variety, setVariety] = useState("");
    const [plantingDate, setPlantingDate] = useState("");
    const [area, setArea] = useState("");
    const [areaUnit, setAreaUnit] = useState("Acres");
    const [seedSource, setSeedSource] = useState("");
    const [fertilizerUsed, setFertilizerUsed] = useState("");
    const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
    const [cropStatus, setCropStatus] = useState("Seeded / Planted");

    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
    };

    async function loadCrops() {
        if (!farmerId) {
            setCrops([]);
            showMessage("User details not found. Please log in again.", "error");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/farmer/${farmerId}`
            );

            if (!response.ok) {
                throw new Error("Failed to retrieve your crops.");
            }

            const data = await response.json();

            setCrops(
                data.filter(
                    crop =>
                        String(crop.farmerId) === String(farmerId) &&
                        crop.cropStatus?.toLowerCase() !== "harvested"
                )
            );
        } catch (error) {
            setCrops([]);
            showMessage(
                error.message || "Could not load your crops.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCrops();

        const handleFarmDataUpdated = () => {
            loadCrops();
        };

        window.addEventListener("farmDataUpdated", handleFarmDataUpdated);
        return () => {
            window.removeEventListener("farmDataUpdated", handleFarmDataUpdated);
        };
    }, [farmerId]);

    async function deleteCrop(cropId, cropName) {
        if (!window.confirm(`Are you sure you want to delete crop "${cropName}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/${cropId}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to delete crop.");
            }

            setCrops(prev => prev.filter(c => c.id !== cropId));
            showMessage(`Crop "${cropName}" deleted successfully! 🗑️`);
            window.dispatchEvent(new CustomEvent("farmDataUpdated", { detail: { intent: "CROP_DELETED" } }));
        } catch (error) {
            showMessage(error.message || "Could not delete crop.", "error");
        } finally {
            setLoading(false);
        }
    }

    async function saveCrop(event) {
        event.preventDefault();
        setMessage("");

        if (!farmerId) {
            showMessage("Please log in again before adding a crop.", "error");
            return;
        }

        if (crops.length >= MAX_CROPS) {
            showMessage("You can add a maximum of 6 current crops.", "error");
            return;
        }

        if (
            !cropName.trim() ||
            !variety.trim() ||
            !plantingDate ||
            !area ||
            Number(area) <= 0 ||
            !seedSource.trim() ||
            !fertilizerUsed.trim() ||
            !expectedHarvestDate
        ) {
            showMessage("Please enter valid crop details.", "error");
            return;
        }

        if (expectedHarvestDate < plantingDate) {
            showMessage(
                "Expected harvest date cannot be before the planting date.",
                "error"
            );
            return;
        }

        const crop = {
            cropName: cropName.trim(),
            variety: variety.trim(),
            plantingDate,
            area: Number(area),
            areaUnit,
            seedSource: seedSource.trim(),
            fertilizerUsed: fertilizerUsed.trim(),
            expectedHarvestDate,
            cropStatus,
            farmerId
        };

        try {
            setSaving(true);

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(crop)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to save crop.");
            }

            const savedCrop = await response.json();

            if (savedCrop.cropStatus?.toLowerCase() !== "harvested") {
                setCrops(previous => [...previous, savedCrop]);
            }

            setCropName("");
            setVariety("");
            setPlantingDate("");
            setArea("");
            setAreaUnit("Acres");
            setSeedSource("");
            setFertilizerUsed("");
            setExpectedHarvestDate("");
            setCropStatus("Seeded / Planted");
            setShowForm(false);

            showMessage("Crop saved successfully! 🌱");
        } catch (error) {
            showMessage(error.message || "Could not save crop.", "error");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="my-crops-page">
            <header className="crops-navbar">
                <div className="crops-brand">
                    <span className="crops-brand-icon">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="crops-navbar-actions">
                    <span className="crops-portal-label">Farmer Portal</span>
                    <LogoutButton />
                </div>
            </header>

            <section className="crops-hero">
                <button
                    type="button"
                    className="crops-back-button"
                    onClick={() =>
                        navigate("/farmer/profile", { state: { user } })
                    }
                >
                    ← Back to Profile
                </button>

                <p className="crops-eyebrow">FARM MANAGEMENT</p>
                <h1>Hey {user?.name || "Farmer"} 🌾</h1>
                <h2>My Current Crops 🌱</h2>
                <p>
                    Manage your crops, track their growth, and maintain your
                    farming records in one place.
                </p>

                <div className="crops-count">
                    <span>Current Crops</span>
                    <strong>{crops.length} / {MAX_CROPS}</strong>
                </div>

                <div className="crops-count-track">
                    <span
                        style={{
                            width: `${(crops.length / MAX_CROPS) * 100}%`
                        }}
                    />
                </div>
            </section>

            {message && (
                <div
                    className={`crops-message ${messageType === "error" ? "is-error" : "is-success"
                        }`}
                    role="status"
                >
                    {message}
                </div>
            )}

            <section className="my-crops-section">
                <div className="my-crops-heading">
                    <div>
                        <p className="crops-eyebrow">YOUR FARM</p>
                        <h2>Growing Crops</h2>
                        <p>View the details and current growth stage of your crops.</p>
                    </div>

                    {crops.length < MAX_CROPS && (
                        <button
                            type="button"
                            className="crops-primary-button"
                            onClick={() => {
                                setShowForm(previous => !previous);
                                setMessage("");
                            }}
                        >
                            {showForm ? "Close Form" : "+ Add Crop"}
                        </button>
                    )}
                </div>

                {loading ? (
                    <p className="crops-info">Loading your crops...</p>
                ) : crops.length === 0 ? (
                    <div className="crops-empty-state">
                        <span>🌱</span>
                        <h3>No current crops yet</h3>
                        <p>Add your first crop to start tracking its growth.</p>
                        {farmerId && (
                            <button
                                type="button"
                                className="crops-primary-button"
                                onClick={() => setShowForm(true)}
                            >
                                + Add Your First Crop
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="my-crops-grid">
                        {crops.map(crop => (
                            <article className="my-crop-card" key={crop.id}>
                                <div className="my-crop-card-heading">
                                    <span className="my-crop-icon">🌱</span>
                                    <div>
                                        <h3>{crop.cropName}</h3>
                                        <span className="my-crop-id">
                                            Crop #{crop.id}
                                        </span>
                                    </div>
                                </div>

                                <div className="my-crop-details">
                                    <p>
                                        <strong>Variety</strong>
                                        <span>{crop.variety || "Not provided"}</span>
                                    </p>
                                    <p>
                                        <strong>Planting Date</strong>
                                        <span>{crop.plantingDate || "Not provided"}</span>
                                    </p>
                                    <p>
                                        <strong>Cultivated Area</strong>
                                        <span>
                                            {crop.area ?? "Not provided"}{" "}
                                            {crop.areaUnit || ""}
                                        </span>
                                    </p>
                                    <p>
                                        <strong>Seed Source / Company</strong>
                                        <span>{crop.seedSource || "Not provided"}</span>
                                    </p>
                                    <p>
                                        <strong>Fertilizer Used</strong>
                                        <span>
                                            {crop.fertilizerUsed || "Not provided"}
                                        </span>
                                    </p>
                                    <p>
                                        <strong>Expected Harvest</strong>
                                        <span>
                                            {crop.expectedHarvestDate || "Not provided"}
                                        </span>
                                    </p>
                                </div>

                                <div className="my-crop-stage">
                                    <span>Current Stage</span>
                                    <strong>
                                        {crop.cropStatus || "Seeded / Planted"}
                                    </strong>
                                </div>

                                <div className="my-crop-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                                    <button
                                        type="button"
                                        className="crops-secondary-button"
                                        onClick={() =>
                                            navigate(
                                                "/farmer/myharvest/currentharvest",
                                                { state: { user } }
                                            )
                                        }
                                    >
                                        View Harvests →
                                    </button>
                                    <button
                                        type="button"
                                        className="crops-delete-button"
                                        style={{
                                            backgroundColor: "#dc2626",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "6px",
                                            padding: "6px 12px",
                                            cursor: "pointer",
                                            fontWeight: "600",
                                            fontSize: "0.85rem",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}
                                        onClick={() => deleteCrop(crop.id, crop.cropName)}
                                        title="Delete this crop"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {showForm && crops.length < MAX_CROPS && farmerId && (
                <section className="add-crop-panel">
                    <div className="add-crop-heading">
                        <p className="crops-eyebrow">NEW CROP ENTRY</p>
                        <h2>Add a Current Crop 🌱</h2>
                        <p>Enter the details of the crop planted on your farm.</p>
                    </div>

                    <form onSubmit={saveCrop} className="add-crop-form">
                        <div className="add-crop-grid">
                            <div className="crops-field">
                                <label htmlFor="crop-name">Crop Name</label>
                                <input
                                    id="crop-name"
                                    className="crops-input"
                                    value={cropName}
                                    onChange={e => setCropName(e.target.value)}
                                    placeholder="e.g. Tomato, Rice, Chilli"
                                    required
                                />
                            </div>

                            <div className="crops-field">
                                <label htmlFor="crop-variety">Crop Variety</label>
                                <input
                                    id="crop-variety"
                                    className="crops-input"
                                    value={variety}
                                    onChange={e => setVariety(e.target.value)}
                                    placeholder="Enter crop variety"
                                    required
                                />
                            </div>

                            <div className="crops-field">
                                <label htmlFor="planting-date">Planting Date</label>
                                <input
                                    id="planting-date"
                                    className="crops-input"
                                    type="date"
                                    value={plantingDate}
                                    onChange={e => setPlantingDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="crops-field">
                                <label htmlFor="crop-area">Cultivated Area</label>
                                <input
                                    id="crop-area"
                                    className="crops-input"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={area}
                                    onChange={e => setArea(e.target.value)}
                                    placeholder="Enter cultivated area"
                                    required
                                />
                            </div>

                            <div className="crops-field">
                                <label htmlFor="area-unit">Area Unit</label>
                                <select
                                    id="area-unit"
                                    className="crops-input"
                                    value={areaUnit}
                                    onChange={e => setAreaUnit(e.target.value)}
                                >
                                    <option value="Acres">Acres</option>
                                    <option value="Hectares">Hectares</option>
                                    <option value="Cents">Cents</option>
                                </select>
                            </div>

                            <div className="crops-field">
                                <label htmlFor="seed-source">Seed Source / Company</label>
                                <input
                                    id="seed-source"
                                    className="crops-input"
                                    value={seedSource}
                                    onChange={e => setSeedSource(e.target.value)}
                                    placeholder="Enter seed supplier or company"
                                    required
                                />
                            </div>

                            <div className="crops-field">
                                <label htmlFor="fertilizer-used">Fertilizer Used</label>
                                <input
                                    id="fertilizer-used"
                                    className="crops-input"
                                    value={fertilizerUsed}
                                    onChange={e => setFertilizerUsed(e.target.value)}
                                    placeholder="Enter fertilizer name"
                                    required
                                />
                            </div>

                            <div className="crops-field">
                                <label htmlFor="expected-harvest">
                                    Expected Harvest Date
                                </label>
                                <input
                                    id="expected-harvest"
                                    className="crops-input"
                                    type="date"
                                    min={plantingDate || undefined}
                                    value={expectedHarvestDate}
                                    onChange={e =>
                                        setExpectedHarvestDate(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="crops-field">
                                <label htmlFor="crop-stage">Current Crop Stage</label>
                                <select
                                    id="crop-stage"
                                    className="crops-input"
                                    value={cropStatus}
                                    onChange={e => setCropStatus(e.target.value)}
                                    required
                                >
                                    {cropStages.map(stage => (
                                        <option key={stage} value={stage}>
                                            {stage}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="add-crop-actions">
                            <button
                                type="submit"
                                className="crops-primary-button"
                                disabled={saving}
                            >
                                {saving ? "Saving Crop..." : "Save Crop"}
                            </button>

                            <button
                                type="button"
                                className="crops-cancel-button"
                                disabled={saving}
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}
        </main>
    );
};

export default MyCrop;
