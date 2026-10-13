
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "../../LogoutButton";


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

const cropStages = [
    "Seeded / Planted",
    "Germination",
    "Vegetative Growth",
    "Flowering",
    "Fruiting",
    "Ready for Harvest"
];

const getStoredUser = (location) => {
    if (location.state?.user) return location.state.user;

    try {
        return (
            JSON.parse(sessionStorage.getItem("user") || "null") ||
            JSON.parse(localStorage.getItem("user") || "null")
        );
    } catch {
        return null;
    }
};

const CurrentHarvests = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = getStoredUser(location);

    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const [selectedCropId, setSelectedCropId] = useState("");
    const [harvestDate, setHarvestDate] = useState("");
    const [quantity, setQuantity] = useState("");
    const [quantityUnit, setQuantityUnit] = useState("kg");
    const [sellingPrice, setSellingPrice] = useState("");

    const [editingCropId, setEditingCropId] = useState(null);
    const [selectedStage, setSelectedStage] = useState("");
    const [savingStage, setSavingStage] = useState(false);

    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
    };

    async function loadCrops() {
        if (!user?.id) {
            setCrops([]);
            showMessage("Farmer details not found. Please log in again.", "error");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE}/crops/farmer/${user.id}`
            );

            if (!response.ok) {
                throw new Error("Failed to load your crops.");
            }

            const data = await response.json();

            const farmerCrops = data.filter(
                (crop) =>
                    String(crop.farmerId) === String(user.id) &&
                    crop.cropStatus?.toLowerCase() !== "harvested"
            );

            setCrops(farmerCrops);
        } catch (error) {
            setCrops([]);
            showMessage(error.message || "Could not load your crops.", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCrops();
    }, [user?.id]);

    const handleEditStage = (crop) => {
        setEditingCropId(crop.id);
        setSelectedStage(crop.cropStatus || "Seeded / Planted");
        setMessage("");
    };

    async function saveCropStage(cropId) {
        const crop = crops.find((item) => item.id === cropId);

        if (!crop) {
            showMessage("Crop not found.", "error");
            return;
        }

        try {
            setSavingStage(true);
            setMessage("");

            const response = await fetch(`${API_BASE}/crops/${cropId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...crop,
                    cropStatus: selectedStage
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Could not update crop stage.");
            }

            setCrops((previous) =>
                previous.map((item) =>
                    item.id === cropId
                        ? { ...item, cropStatus: selectedStage }
                        : item
                )
            );

            setEditingCropId(null);
            showMessage("Crop stage updated successfully.");
        } catch (error) {
            showMessage(error.message || "Could not update crop stage.", "error");
        } finally {
            setSavingStage(false);
        }
    }

    async function saveHarvest(event) {
        event.preventDefault();
        setMessage("");

        const selectedCrop = crops.find(
            (crop) => String(crop.id) === selectedCropId
        );

        if (!selectedCrop) {
            showMessage("Please select one of your crops.", "error");
            return;
        }

        if (
            !harvestDate ||
            Number(quantity) <= 0 ||
            sellingPrice === "" ||
            Number(sellingPrice) < 0
        ) {
            showMessage(
                "Enter a valid harvest date, quantity and selling price.",
                "error"
            );
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`${API_BASE}/harvests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cropId: selectedCrop.id,
                    harvestDate,
                    quantity: Number(quantity),
                    quantityUnit,
                    sellingPrice: Number(sellingPrice)
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to save harvest.");
            }

            const savedHarvest = await response.json();

            setCrops((previous) =>
                previous.filter((crop) => crop.id !== selectedCrop.id)
            );

            setSelectedCropId("");
            setHarvestDate("");
            setQuantity("");
            setQuantityUnit("kg");
            setSellingPrice("");
            setShowForm(false);

            showMessage(
                `Harvest recorded successfully! Estimated revenue: ₹${Number(
                    savedHarvest.revenue || 0
                ).toLocaleString("en-IN")}.`
            );
        } catch (error) {
            showMessage(
                error.message || "Could not record harvest. Please try again.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    }

    const estimatedRevenue =
        Number(quantity || 0) * Number(sellingPrice || 0);

    return (
        <main className="current-harvests-page">
            <header className="harvest-navbar">
                <div className="harvest-brand">
                    <span className="harvest-brand-icon">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="harvest-navbar-actions">
                    <span className="harvest-portal-label">Farmer Portal</span>
                    <LogoutButton />
                </div>
            </header>

            <section className="harvest-hero">
                <button
                    type="button"
                    className="harvest-back-button"
                    onClick={() =>
                        navigate("/farmer/myharvest", { state: { user } })
                    }
                >
                    ← Back to My Harvest
                </button>

                <p className="harvest-eyebrow">CROP GROWTH MANAGEMENT</p>
                <h1>Current Harvests 🌱</h1>
                <p>
                    Hey {user?.name || "Farmer"}! Track crop growth, update
                    stages, and record your harvest when crops are ready.
                </p>
            </section>

            {message && (
                <div
                    className={`harvest-message ${
                        messageType === "error" ? "is-error" : "is-success"
                    }`}
                    role="status"
                >
                    {message}
                </div>
            )}

            <section className="harvest-section">
                <div className="harvest-section-heading">
                    <div>
                        <p className="harvest-eyebrow">YOUR FARM</p>
                        <h2>Crops in Progress</h2>
                        <p>Only crops belonging to your account are shown.</p>
                    </div>

                    <button
                        type="button"
                        className="harvest-primary-button"
                        onClick={() => {
                            setSelectedCropId("");
                            setShowForm((previous) => !previous);
                            setMessage("");
                        }}
                    >
                        {showForm ? "Close Form" : "+ Add Harvest"}
                    </button>
                </div>

                {loading ? (
                    <p className="harvest-info">Loading your crops...</p>
                ) : crops.length === 0 ? (
                    <div className="harvest-empty-state">
                        <span>🌱</span>
                        <h3>No crops in progress</h3>
                        <p>You have no crops awaiting harvest.</p>
                    </div>
                ) : (
                    <div className="current-crops-grid">
                        {crops.map((crop) => (
                            <article className="current-crop-card" key={crop.id}>
                                <div className="current-crop-heading">
                                    <span className="current-crop-icon">🌱</span>
                                    <div>
                                        <h3>{crop.cropName}</h3>
                                        <span className="crop-id-label">
                                            Crop #{crop.id}
                                        </span>
                                    </div>
                                </div>

                                <div className="current-crop-details">
                                    <p>
                                        <strong>Variety</strong>
                                        <span>{crop.variety || "Not provided"}</span>
                                    </p>
                                    <p>
                                        <strong>Planting Date</strong>
                                        <span>{crop.plantingDate || "Not provided"}</span>
                                    </p>
                                    <p>
                                        <strong>Expected Harvest</strong>
                                        <span>
                                            {crop.expectedHarvestDate || "Not provided"}
                                        </span>
                                    </p>
                                    <p>
                                        <strong>Cultivated Area</strong>
                                        <span>
                                            {crop.area ?? "Not provided"}{" "}
                                            {crop.areaUnit || ""}
                                        </span>
                                    </p>
                                </div>

                                <div className="crop-stage-row">
                                    <div>
                                        <span className="crop-detail-label">
                                            Current Stage
                                        </span>
                                        <span className="crop-stage-badge">
                                            {crop.cropStatus || "Seeded / Planted"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="harvest-secondary-button"
                                        onClick={() => handleEditStage(crop)}
                                    >
                                        Edit Stage
                                    </button>
                                </div>

                                {editingCropId === crop.id && (
                                    <div className="edit-stage-panel">
                                        <label htmlFor={`stage-${crop.id}`}>
                                            Update crop stage
                                        </label>

                                        <select
                                            id={`stage-${crop.id}`}
                                            className="harvest-input"
                                            value={selectedStage}
                                            onChange={(event) =>
                                                setSelectedStage(event.target.value)
                                            }
                                        >
                                            {cropStages.map((stage) => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="harvest-form-actions">
                                            <button
                                                type="button"
                                                className="harvest-primary-button"
                                                disabled={savingStage}
                                                onClick={() => saveCropStage(crop.id)}
                                            >
                                                {savingStage ? "Saving..." : "Save Stage"}
                                            </button>

                                            <button
                                                type="button"
                                                className="harvest-cancel-button"
                                                disabled={savingStage}
                                                onClick={() => setEditingCropId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="harvest-record-button"
                                    onClick={() => {
                                        setSelectedCropId(String(crop.id));
                                        setShowForm(true);
                                        setMessage("");
                                    }}
                                >
                                    Record Harvest →
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {showForm && (
                <section className="harvest-form-card">
                    <div className="harvest-form-heading">
                        <p className="harvest-eyebrow">HARVEST ENTRY</p>
                        <h2>Record Harvest Details 🌾</h2>
                        <p>Enter the harvested quantity and selling price.</p>
                    </div>

                    <form onSubmit={saveHarvest} className="harvest-form">
                        <div className="harvest-form-grid">
                            <div className="harvest-field">
                                <label htmlFor="harvest-crop">Select Crop</label>
                                <select
                                    id="harvest-crop"
                                    className="harvest-input"
                                    value={selectedCropId}
                                    onChange={(event) =>
                                        setSelectedCropId(event.target.value)
                                    }
                                    required
                                >
                                    <option value="">Choose your crop</option>
                                    {crops.map((crop) => (
                                        <option key={crop.id} value={String(crop.id)}>
                                            {crop.cropName} — {crop.variety || "No variety"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="harvest-field">
                                <label htmlFor="harvest-date">Harvest Date</label>
                                <input
                                    id="harvest-date"
                                    className="harvest-input"
                                    type="date"
                                    value={harvestDate}
                                    onChange={(event) =>
                                        setHarvestDate(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="harvest-field">
                                <label htmlFor="harvest-quantity">
                                    Quantity Harvested
                                </label>
                                <input
                                    id="harvest-quantity"
                                    className="harvest-input"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Enter quantity"
                                    value={quantity}
                                    onChange={(event) =>
                                        setQuantity(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="harvest-field">
                                <label htmlFor="harvest-unit">Quantity Unit</label>
                                <select
                                    id="harvest-unit"
                                    className="harvest-input"
                                    value={quantityUnit}
                                    onChange={(event) =>
                                        setQuantityUnit(event.target.value)
                                    }
                                >
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="quintals">Quintals</option>
                                    <option value="tonnes">Tonnes</option>
                                </select>
                            </div>

                            <div className="harvest-field">
                                <label htmlFor="selling-price">
                                    Selling Price per Unit (₹)
                                </label>
                                <input
                                    id="selling-price"
                                    className="harvest-input"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter selling price"
                                    value={sellingPrice}
                                    onChange={(event) =>
                                        setSellingPrice(event.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="harvest-revenue-preview">
                            <span>Estimated Revenue</span>
                            <strong>
                                ₹{estimatedRevenue.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </strong>
                        </div>

                        <div className="harvest-form-actions">
                            <button
                                type="submit"
                                className="harvest-primary-button"
                                disabled={saving || crops.length === 0}
                            >
                                {saving ? "Saving..." : "Save Harvest"}
                            </button>

                            <button
                                type="button"
                                className="harvest-cancel-button"
                                disabled={saving}
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <footer className="harvest-footer">
                <button
                    type="button"
                    className="harvest-secondary-button"
                    onClick={() =>
                        navigate("/farmer/myharvest", { state: { user } })
                    }
                >
                    ← Back to My Harvest
                </button>
            </footer>
        </main>
    );
};

export default CurrentHarvests;
