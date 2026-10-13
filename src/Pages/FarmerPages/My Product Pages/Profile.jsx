
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "../../LogoutButton";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const initialProfile = {
    name: "",
    email: "",
    phone: "",
    address: "",
    village: "",
    district: "",
    state: ""
};

const Profile = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getSavedUser = () => {
        try {
            return (
                JSON.parse(sessionStorage.getItem("user") || "null") ||
                JSON.parse(localStorage.getItem("user") || "null")
            );
        } catch {
            return null;
        }
    };

    const loggedInUser = location.state?.user || getSavedUser();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [farmer, setFarmer] = useState(initialProfile);
    const [formData, setFormData] = useState(initialProfile);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!loggedInUser?.id) {
                setError("User details not found. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                setError("");

                const response = await fetch(
                    `${API_URL}/users/${loggedInUser.id}/profile`
                );

                if (!response.ok) {
                    throw new Error("Unable to load profile.");
                }

                const data = await response.json();

                setFarmer({ ...initialProfile, ...data });
                setFormData({ ...initialProfile, ...data });
            } catch (err) {
                setError(err.message || "Unable to load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [loggedInUser?.id]);

    const handleChange = event => {
        const { name, value } = event.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSave = async event => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!loggedInUser?.id) {
            setError("User details not found. Please log in again.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
                `${API_URL}/users/${loggedInUser.id}/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update profile.");
            }

            const updatedProfile = {
                ...initialProfile,
                ...data
            };

            setFarmer(updatedProfile);
            setFormData(updatedProfile);
            setIsEditing(false);
            setMessage("Profile updated successfully!");

            const updatedUser = {
                ...loggedInUser,
                ...updatedProfile
            };

            sessionStorage.setItem("user", JSON.stringify(updatedUser));

            if (localStorage.getItem("user")) {
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }
        } catch (err) {
            setError(err.message || "Unable to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({ ...farmer });
        setIsEditing(false);
        setError("");
        setMessage("");
    };

    const openOrderManagement = () => {
        navigate("/farmer/orders", {
            state: {
                user: loggedInUser,
                farmer
            }
        });
    };

    if (loading) {
        return (
            <main className="farmer-profile-page">
                <div className="farmer-profile-loading">
                    <span>🌿</span>
                    <p>Loading your profile...</p>
                </div>
            </main>
        );
    }

    if (error && !farmer.email) {
        return (
            <main className="farmer-profile-page">
                <div className="farmer-profile-error-panel">
                    <h2>Unable to load profile</h2>
                    <p>{error}</p>
                    <button
                        type="button"
                        className="farmer-profile-primary"
                        onClick={() => navigate("/farmer", {
                            state: { user: loggedInUser }
                        })}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="farmer-profile-page">
            <header className="farmer-profile-navbar">
                <div className="farmer-profile-brand">
                    <span className="farmer-profile-brand-icon">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="farmer-profile-navbar-actions">
                    <span className="farmer-profile-portal">
                        Farmer Portal
                    </span>
                    <LogoutButton />
                </div>
            </header>

            <section className="farmer-profile-hero">
                <button
                    type="button"
                    className="farmer-profile-back"
                    onClick={() =>
                        navigate("/farmer", {
                            state: { user: loggedInUser }
                        })
                    }
                >
                    ← Back to Dashboard
                </button>

                <p className="farmer-profile-eyebrow">
                    FARMER ACCOUNT
                </p>

                <h1>My Profile 🌾</h1>

                <p>
                    Manage your personal information and contact details
                    to keep your farming account up to date.
                </p>
            </section>

            {message && (
                <div
                    className="farmer-profile-message success"
                    role="status"
                >
                    {message}
                </div>
            )}

            {error && (
                <div
                    className="farmer-profile-message error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <section className="farmer-profile-layout">
                <aside className="farmer-profile-sidebar">
                    <div className="farmer-profile-avatar">
                        {farmer.name?.trim()?.charAt(0).toUpperCase() || "F"}
                    </div>

                    <h2>{farmer.name || "Farmer"}</h2>
                    <p className="farmer-profile-email">
                        {farmer.email || "Email not provided"}
                    </p>

                    <span className="farmer-profile-role">
                        🌱 Farmer Account
                    </span>

                    <div className="farmer-profile-sidebar-divider" />

                    <p className="farmer-profile-sidebar-label">
                        ACCOUNT INFORMATION
                    </p>

                    <div className="farmer-profile-sidebar-info">
                        <span>📍</span>
                        <div>
                            <strong>Location</strong>
                            <p>
                                {[farmer.village, farmer.district]
                                    .filter(Boolean)
                                    .join(", ") || "Not provided"}
                            </p>
                        </div>
                    </div>

                    <div className="farmer-profile-sidebar-info">
                        <span>📞</span>
                        <div>
                            <strong>Contact</strong>
                            <p>{farmer.phone || "Not provided"}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="farmer-profile-order-button"
                        onClick={openOrderManagement}
                    >
                        📦 Order Management
                        <span>→</span>
                    </button>
                </aside>

                <section className="farmer-profile-details-panel">
                    <div className="farmer-profile-panel-heading">
                        <div>
                            <p className="farmer-profile-eyebrow">
                                PERSONAL DETAILS
                            </p>
                            <h2>Profile Information</h2>
                            <p>
                                Your saved information and contact details.
                            </p>
                        </div>

                        {!isEditing && (
                            <button
                                type="button"
                                className="farmer-profile-primary"
                                onClick={() => {
                                    setFormData({ ...farmer });
                                    setIsEditing(true);
                                    setError("");
                                    setMessage("");
                                }}
                            >
                                ✏️ Edit Profile
                            </button>
                        )}
                    </div>

                    {!isEditing ? (
                        <div className="farmer-profile-details-grid">
                            <ProfileField
                                label="Full Name"
                                value={farmer.name}
                                icon="👤"
                            />
                            <ProfileField
                                label="Email Address"
                                value={farmer.email}
                                icon="✉️"
                            />
                            <ProfileField
                                label="Phone Number"
                                value={farmer.phone}
                                icon="📞"
                            />
                            <ProfileField
                                label="Village / Town"
                                value={farmer.village}
                                icon="📍"
                            />
                            <ProfileField
                                label="District"
                                value={farmer.district}
                                icon="🏡"
                            />
                            <ProfileField
                                label="State"
                                value={farmer.state}
                                icon="🗺️"
                            />
                            <ProfileField
                                label="Address"
                                value={farmer.address}
                                icon="🏠"
                                fullWidth
                            />
                        </div>
                    ) : (
                        <form
                            className="farmer-profile-form"
                            onSubmit={handleSave}
                        >
                            <div className="farmer-profile-form-grid">
                                <div className="farmer-profile-field">
                                    <label htmlFor="profile-name">
                                        Full Name
                                    </label>
                                    <input
                                        id="profile-name"
                                        name="name"
                                        value={formData.name || ""}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="farmer-profile-field">
                                    <label htmlFor="profile-email">
                                        Email Address
                                    </label>
                                    <input
                                        id="profile-email"
                                        type="email"
                                        value={formData.email || ""}
                                        readOnly
                                    />
                                    <small>
                                        Email cannot be changed here.
                                    </small>
                                </div>

                                <div className="farmer-profile-field">
                                    <label htmlFor="profile-phone">
                                        Phone Number
                                    </label>
                                    <input
                                        id="profile-phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ""}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="farmer-profile-field">
                                    <label htmlFor="profile-village">
                                        Village / Town
                                    </label>
                                    <input
                                        id="profile-village"
                                        name="village"
                                        value={formData.village || ""}
                                        onChange={handleChange}
                                        placeholder="Enter village or town"
                                    />
                                </div>

                                <div className="farmer-profile-field">
                                    <label htmlFor="profile-district">
                                        District
                                    </label>
                                    <input
                                        id="profile-district"
                                        name="district"
                                        value={formData.district || ""}
                                        onChange={handleChange}
                                        placeholder="Enter district"
                                    />
                                </div>

                                <div className="farmer-profile-field">
                                    <label htmlFor="profile-state">
                                        State
                                    </label>
                                    <select
                                        id="profile-state"
                                        name="state"
                                        value={formData.state || ""}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select State</option>
                                        <option value="Andhra Pradesh">
                                            Andhra Pradesh
                                        </option>
                                        <option value="Telangana">
                                            Telangana
                                        </option>
                                        <option value="Karnataka">
                                            Karnataka
                                        </option>
                                        <option value="Tamil Nadu">
                                            Tamil Nadu
                                        </option>
                                        <option value="Kerala">Kerala</option>
                                        <option value="Maharashtra">
                                            Maharashtra
                                        </option>
                                        <option value="Odisha">Odisha</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="farmer-profile-field full-width">
                                    <label htmlFor="profile-address">
                                        Complete Address
                                    </label>
                                    <textarea
                                        id="profile-address"
                                        name="address"
                                        value={formData.address || ""}
                                        onChange={handleChange}
                                        placeholder="Enter your complete address"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="farmer-profile-form-actions">
                                <button
                                    type="submit"
                                    className="farmer-profile-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    className="farmer-profile-cancel"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </section>
        </main>
    );
};

const ProfileField = ({ label, value, icon, fullWidth }) => (
    <div
        className={`farmer-profile-field-card ${
            fullWidth ? "full-width" : ""
        }`}
    >
        <span className="farmer-profile-field-icon">{icon}</span>
        <div>
            <p>{label}</p>
            <strong>{value || "Not provided"}</strong>
        </div>
    </div>
);

export default Profile;
