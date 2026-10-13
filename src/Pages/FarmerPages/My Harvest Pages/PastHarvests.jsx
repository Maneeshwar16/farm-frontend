
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LogoutButton from '../../LogoutButton';

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

const PastHarvests = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const user =
        location.state?.user ||
        (() => {
            try {
                return JSON.parse(
                    sessionStorage.getItem('user') ||
                    localStorage.getItem('user') ||
                    'null'
                );
            } catch {
                return null;
            }
        })();

    const [harvests, setHarvests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadHarvests = async () => {
            if (!user?.id) {
                setMessage('Please log in again to view your harvest records.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setMessage('');

                const response = await fetch(
                    `${API_BASE_URL}/harvests/farmer/${user.id}`
                );

                if (!response.ok) {
                    throw new Error('Failed to load harvest records.');
                }

                const data = await response.json();
                setHarvests(Array.isArray(data) ? data : []);
            } catch {
                setMessage(
                    'Could not load harvests. Please check your connection and try again.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadHarvests();
    }, [user?.id]);

    const totalRevenue = harvests.reduce(
        (total, harvest) => total + Number(harvest.revenue || 0),
        0
    );

    const formatCurrency = value =>
        Number(value || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    const formatDate = value => {
        if (!value) return '—';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Kolkata'
        });
    };

    return (
        <div className="past-harvests-page">
            <header className="past-harvests-navbar">
                <div className="past-harvests-brand">
                    <span className="past-harvests-logo">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="past-harvests-navbar-right">
                    <span className="past-harvests-role">Farmer Portal</span>
                    <LogoutButton />
                </div>
            </header>

            <main className="past-harvests-main">
                <section className="past-harvests-hero">
                    <button
                        className="past-harvests-back-link"
                        onClick={() =>
                            navigate('/farmer/myharvest', {
                                state: { user }
                            })
                        }
                    >
                        ← Back to My Harvest
                    </button>

                    <span className="past-harvests-eyebrow">
                        HARVEST HISTORY
                    </span>

                    <h1>
                        Past Harvests <span>🌾</span>
                    </h1>

                    <p>
                        Welcome back, {user?.name || 'Farmer'}! Review your
                        completed harvests, quantities and estimated revenue.
                    </p>
                </section>

                <section className="past-harvests-stats">
                    <article className="past-harvests-stat-card">
                        <span className="past-harvests-stat-icon">🌾</span>
                        <div>
                            <p>Recorded Harvests</p>
                            <h2>{harvests.length}</h2>
                        </div>
                    </article>

                    <article className="past-harvests-stat-card">
                        <span className="past-harvests-stat-icon">₹</span>
                        <div>
                            <p>Total Estimated Revenue</p>
                            <h2>₹{formatCurrency(totalRevenue)}</h2>
                        </div>
                    </article>
                </section>

                <section className="past-harvests-section">
                    <div className="past-harvests-section-heading">
                        <div>
                            <span className="past-harvests-eyebrow">
                                YOUR RECORDS
                            </span>
                            <h2>Harvest History</h2>
                            <p>
                                All your saved harvest details in one place.
                            </p>
                        </div>
                    </div>

                    {message && (
                        <div className="past-harvests-message" role="status">
                            {message}
                        </div>
                    )}

                    {loading ? (
                        <div className="past-harvests-empty">
                            <span>🌱</span>
                            <h3>Loading your harvests...</h3>
                            <p>Please wait while we retrieve your records.</p>
                        </div>
                    ) : !message && harvests.length === 0 ? (
                        <div className="past-harvests-empty">
                            <span>🌱</span>
                            <h3>No Past Harvests Yet</h3>
                            <p>
                                Once you record a harvest, its details will
                                appear here.
                            </p>
                            <button
                                className="past-harvests-primary-button"
                                onClick={() =>
                                    navigate('/farmer/myharvest', {
                                        state: { user }
                                    })
                                }
                            >
                                Go to My Harvest →
                            </button>
                        </div>
                    ) : (
                        <div className="past-harvests-grid">
                            {harvests.map(harvest => (
                                <article
                                    className="past-harvest-card"
                                    key={harvest.id}
                                >
                                    <div className="past-harvest-card-top">
                                        <span className="past-harvest-crop-icon">
                                            🌾
                                        </span>
                                        <span className="past-harvest-status">
                                            Completed
                                        </span>
                                    </div>

                                    <h3>{harvest.cropName || 'Unnamed Crop'}</h3>
                                    <p className="past-harvest-variety">
                                        {harvest.variety || 'Variety not specified'}
                                    </p>

                                    <div className="past-harvest-details">
                                        <div>
                                            <span>Planting Date</span>
                                            <strong>
                                                {formatDate(harvest.plantingDate)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Harvest Date</span>
                                            <strong>
                                                {formatDate(harvest.harvestDate)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Quantity</span>
                                            <strong>
                                                {harvest.quantity ?? '—'}{' '}
                                                {harvest.quantityUnit || ''}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Selling Price</span>
                                            <strong>
                                                ₹{formatCurrency(harvest.sellingPrice)}
                                                {harvest.quantityUnit
                                                    ? ` / ${harvest.quantityUnit}`
                                                    : ''}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="past-harvest-revenue">
                                        <span>Estimated Revenue</span>
                                        <strong>
                                            ₹{formatCurrency(harvest.revenue)}
                                        </strong>
                                    </div>

                                    <div className="past-harvest-completed">
                                        <span>✓</span>
                                        Harvest record saved
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <footer className="past-harvests-footer">
                    <span>🌿 FarmingManagement</span>
                    <p>Supporting smarter and more sustainable farming.</p>
                </footer>
            </main>
        </div>
    );
};

export default PastHarvests;
