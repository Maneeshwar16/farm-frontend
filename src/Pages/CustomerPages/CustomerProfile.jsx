
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CustomerProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const user =
        location.state?.user ||
        JSON.parse(sessionStorage.getItem("user") || "null") ||
        JSON.parse(localStorage.getItem("user") || "null");

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        village: "",
        district: "",
        state: "",
    });

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user?.id) {
            setError("Please log in again to view your profile.");
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await fetch(
                    import.meta.env.VITE_API_URL + `/users/${user.id}/profile`
                );

                if (!response.ok) {
                    throw new Error("Unable to load your profile.");
                }

                const data = await response.json();

                setProfile({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    village: data.village || "",
                    district: data.district || "",
                    state: data.state || "",
                });
            } catch (err) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSave = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!user?.id) {
            setError("Please log in again.");
            return;
        }

        if (profile.phone && !/^[6-9]\d{9}$/.test(profile.phone)) {
            setError("Enter a valid 10-digit Indian mobile number.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                import.meta.env.VITE_API_URL + `/users/${user.id}/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: profile.name,
                        phone: profile.phone,
                        address: profile.address,
                        village: profile.village,
                        district: profile.district,
                        state: profile.state,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Unable to update profile.");
            }

            const updatedProfile = {
                ...profile,
                ...data,
            };

            setProfile((previous) => ({
                ...previous,
                name: updatedProfile.name ?? previous.name,
                email: updatedProfile.email ?? previous.email,
                phone: updatedProfile.phone ?? previous.phone,
                address: updatedProfile.address ?? previous.address,
                village: updatedProfile.village ?? previous.village,
                district: updatedProfile.district ?? previous.district,
                state: updatedProfile.state ?? previous.state,
            }));

            const updatedUser = {
                ...user,
                name: updatedProfile.name || profile.name,
            };

            // Keep the updated name available for other pages.
            if (localStorage.getItem("user")) {
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }

            if (sessionStorage.getItem("user")) {
                sessionStorage.setItem("user", JSON.stringify(updatedUser));
            }

            setMessage("Profile updated successfully!");
            setEditing(false);
        } catch (err) {
            setError(err.message || "Unable to save your profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="profile-page">Loading your profile...</div>;
    }

    return (
        <div className="profile-page">
            <header className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your personal information and delivery details.</p>
            </header>

            <section className="profile-card">
                <div className="profile-avatar">
                    {(profile.name || user?.name || "C")
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <h2>{profile.name || "Customer"}</h2>
                <p className="profile-email">{profile.email}</p>

                {message && (
                    <p className="profile-success" role="status">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="profile-error" role="alert">
                        {error}
                    </p>
                )}

                {!editing ? (
                    <>
                        <div className="profile-details">
                            <div className="profile-field">
                                <span className="profile-label">Full Name</span>
                                <span className="profile-value">
                                    {profile.name || "Not provided"}
                                </span>
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">Email</span>
                                <span className="profile-value">
                                    {profile.email || "Not provided"}
                                </span>
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">Phone</span>
                                <span className="profile-value">
                                    {profile.phone || "Not provided"}
                                </span>
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">Address</span>
                                <span className="profile-value">
                                    {profile.address || "Not provided"}
                                </span>
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">Village</span>
                                <span className="profile-value">
                                    {profile.village || "Not provided"}
                                </span>
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">District</span>
                                <span className="profile-value">
                                    {profile.district || "Not provided"}
                                </span>
                            </div>

                            <div className="profile-field">
                                <span className="profile-label">State</span>
                                <span className="profile-value">
                                    {profile.state || "Not provided"}
                                </span>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button
                                className="profile-button"
                                onClick={() => {
                                    setMessage("");
                                    setError("");
                                    setEditing(true);
                                }}
                            >
                                Edit Profile
                            </button>

                            <button
                                className="profile-cancel-button"
                                onClick={() => navigate("/customer/products")}
                            >
                                Back to Shopping
                            </button>
                        </div>
                    </>
                ) : (
                    <form className="profile-form" onSubmit={handleSave}>
                        <label htmlFor="customer-name">Full Name</label>
                        <input
                            id="customer-name"
                            name="name"
                            value={profile.name}
                            onChange={handleChange}
                            required
                        />

                        <label htmlFor="customer-email">Email</label>
                        <input
                            id="customer-email"
                            value={profile.email}
                            readOnly
                        />

                        <label htmlFor="customer-phone">Phone Number</label>
                        <input
                            id="customer-phone"
                            name="phone"
                            value={profile.phone}
                            onChange={handleChange}
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                        />

                        <label htmlFor="customer-address">Address</label>
                        <textarea
                            id="customer-address"
                            name="address"
                            value={profile.address}
                            onChange={handleChange}
                            rows={3}
                        />

                        <label htmlFor="customer-village">Village / Town</label>
                        <input
                            id="customer-village"
                            name="village"
                            value={profile.village}
                            onChange={handleChange}
                        />

                        <label htmlFor="customer-district">District</label>
                        <input
                            id="customer-district"
                            name="district"
                            value={profile.district}
                            onChange={handleChange}
                        />

                        <label htmlFor="customer-state">State</label>
                        <input
                            id="customer-state"
                            name="state"
                            value={profile.state}
                            onChange={handleChange}
                        />

                        <div className="profile-actions">
                            <button
                                className="profile-button"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                                className="profile-cancel-button"
                                type="button"
                                disabled={saving}
                                onClick={() => {
                                    setEditing(false);
                                    setError("");
                                    setMessage("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </div>
    );
};

export default CustomerProfile;
