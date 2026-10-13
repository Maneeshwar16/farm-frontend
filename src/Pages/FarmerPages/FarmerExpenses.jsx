
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutButton from "../LogoutButton";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "");

const API_URL = `${API_BASE_URL}/expenses`;
const ORDERS_API_URL = `${API_BASE_URL}/orders`;

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

const today = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();

    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
};

const initialForm = {
    category: "",
    description: "",
    amount: "",
    expenseDate: today()
};

const expenseCategories = [
    { value: "Seeds", icon: "🌱" },
    { value: "Fertilizer", icon: "🧪" },
    { value: "Pesticides", icon: "🛡️" },
    { value: "Labour", icon: "👨‍🌾" },
    { value: "Irrigation", icon: "💧" },
    { value: "Transport", icon: "🚚" },
    { value: "Equipment", icon: "🚜" },
    { value: "Other", icon: "📋" }
];

const formatCurrency = amount =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const formatDate = dateValue => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(`${dateValue}T00:00:00`);

    return Number.isNaN(date.getTime())
        ? dateValue
        : date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
          });
};

const FarmerExpenses = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user || getSavedUser();

    const [expenses, setExpenses] = useState([]);
    const [salesRevenue, setSalesRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [formData, setFormData] = useState(initialForm);

    const totalExpenses = expenses.reduce(
        (total, expense) => total + Number(expense.amount || 0),
        0
    );

    const profitLoss = salesRevenue - totalExpenses;

    const fetchFinancialData = useCallback(async () => {
        if (!user?.id) {
            setError("Farmer details not found. Please log in again.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const [expensesResponse, ordersResponse] = await Promise.all([
                fetch(`${API_URL}/farmer/${user.id}`),
                fetch(`${ORDERS_API_URL}/farmer/${user.id}`)
            ]);

            if (!expensesResponse.ok) {
                throw new Error("Unable to fetch expenses.");
            }

            if (!ordersResponse.ok) {
                throw new Error("Unable to fetch sales revenue.");
            }

            const [expensesData, ordersData] = await Promise.all([
                expensesResponse.json(),
                ordersResponse.json()
            ]);

            setExpenses(Array.isArray(expensesData) ? expensesData : []);

            const revenue = (Array.isArray(ordersData) ? ordersData : [])
                .filter(
                    order =>
                        String(order.orderStatus || "").toUpperCase() !==
                        "CANCELLED"
                )
                .reduce(
                    (total, order) =>
                        total + Number(order.farmerSubtotal || 0),
                    0
                );

            setSalesRevenue(revenue);
        } catch (err) {
            setError(err.message || "Unable to load financial data.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const handleChange = event => {
        setFormData(previous => ({
            ...previous,
            [event.target.name]: event.target.value
        }));
    };

    const handleSubmit = async event => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!user?.id) {
            setError("Farmer details not found. Please log in again.");
            return;
        }

        if (!formData.category || !formData.description.trim()) {
            setError("Please complete all required fields.");
            return;
        }

        const amount = Number(formData.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Enter an expense amount greater than zero.");
            return;
        }

        if (!formData.expenseDate) {
            setError("Please select the expense date.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    farmerId: Number(user.id),
                    category: formData.category,
                    description: formData.description.trim(),
                    amount,
                    expenseDate: formData.expenseDate
                })
            });

            if (!response.ok) {
                throw new Error("Unable to save expense.");
            }

            const savedExpense = await response.json();

            setExpenses(previous => [savedExpense, ...previous]);
            setFormData({ ...initialForm, expenseDate: today() });
            setShowForm(false);
            setMessage("Expense recorded successfully!");
        } catch (err) {
            setError(err.message || "Unable to save expense.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async expenseId => {
        if (!window.confirm("Are you sure you want to delete this expense?")) {
            return;
        }

        setError("");
        setMessage("");
        setDeletingId(expenseId);

        try {
            const response = await fetch(`${API_URL}/${expenseId}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Unable to delete expense.");
            }

            setExpenses(previous =>
                previous.filter(expense => expense.id !== expenseId)
            );

            setMessage("Expense deleted successfully!");
        } catch (err) {
            setError(err.message || "Unable to delete expense.");
        } finally {
            setDeletingId(null);
        }
    };

    const expenseCountByCategory = expenses.reduce((totals, expense) => {
        totals[expense.category] = (totals[expense.category] || 0) + 1;
        return totals;
    }, {});

    return (
        <main className="farmer-expenses-page">
            <header className="expenses-navbar">
                <div className="expenses-brand">
                    <span className="expenses-brand-icon">🌿</span>
                    <div>
                        <h2>FarmingManagement</h2>
                        <p>Smart Farming Management</p>
                    </div>
                </div>

                <div className="expenses-navbar-right">
                    <span className="expenses-role">Farmer Portal</span>
                    <LogoutButton />
                </div>
            </header>

            <div className="expenses-content">
                <section className="expenses-hero">
                    <button
                        type="button"
                        className="expenses-back-button"
                        onClick={() =>
                            navigate("/farmer", { state: { user } })
                        }
                    >
                        ← Back to Dashboard
                    </button>

                    <span className="expenses-eyebrow">
                        FARM FINANCIAL MANAGEMENT
                    </span>

                    <h1>
                        Track Your <span>Expenses</span> 💰
                    </h1>

                    <p>
                        Welcome, {user?.name || "Farmer"}! Keep your farming
                        costs organized and understand your estimated financial
                        performance.
                    </p>
                </section>

                {message && (
                    <div
                        className="expenses-alert expenses-alert-success"
                        role="status"
                    >
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div
                        className="expenses-alert expenses-alert-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <section className="expenses-summary-section">
                    <div className="expenses-section-heading">
                        <div>
                            <span className="expenses-eyebrow">
                                FINANCIAL OVERVIEW
                            </span>
                            <h2>Your Farm Finances</h2>
                            <p>
                                A summary based on your recorded expenses and
                                farmer order records.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="expenses-refresh-button"
                            onClick={fetchFinancialData}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>
                    </div>

                    <div className="expenses-stats-grid">
                        <article className="expenses-stat-card">
                            <div className="expenses-stat-top">
                                <span className="expenses-stat-icon">🛒</span>
                                <span className="expenses-stat-label">
                                    SALES REVENUE
                                </span>
                            </div>
                            <h3>{formatCurrency(salesRevenue)}</h3>
                            <p>Recorded farmer order subtotals</p>
                        </article>

                        <article className="expenses-stat-card">
                            <div className="expenses-stat-top">
                                <span className="expenses-stat-icon">💸</span>
                                <span className="expenses-stat-label">
                                    TOTAL EXPENSES
                                </span>
                            </div>
                            <h3>{formatCurrency(totalExpenses)}</h3>
                            <p>{expenses.length} expense records</p>
                        </article>

                        <article className="expenses-stat-card">
                            <div className="expenses-stat-top">
                                <span className="expenses-stat-icon">📈</span>
                                <span className="expenses-stat-label">
                                    ESTIMATED PROFIT / LOSS
                                </span>
                            </div>
                            <h3
                                className={
                                    profitLoss > 0
                                        ? "expenses-profit"
                                        : profitLoss < 0
                                          ? "expenses-loss"
                                          : ""
                                }
                            >
                                {formatCurrency(profitLoss)}
                            </h3>
                            <p>
                                {profitLoss > 0
                                    ? "Revenue exceeds expenses"
                                    : profitLoss < 0
                                      ? "Expenses exceed revenue"
                                      : "Currently at break-even"}
                            </p>
                        </article>

                        <article className="expenses-stat-card">
                            <div className="expenses-stat-top">
                                <span className="expenses-stat-icon">📋</span>
                                <span className="expenses-stat-label">
                                    EXPENSE RECORDS
                                </span>
                            </div>
                            <h3>{expenses.length}</h3>
                            <p>Recorded farming expenses</p>
                        </article>
                    </div>

                    <div className="expenses-calculation">
                        <span>Estimated calculation</span>
                        <strong>
                            {formatCurrency(salesRevenue)} −{" "}
                            {formatCurrency(totalExpenses)} ={" "}
                            <span
                                className={
                                    profitLoss >= 0
                                        ? "expenses-profit"
                                        : "expenses-loss"
                                }
                            >
                                {formatCurrency(profitLoss)}
                            </span>
                        </strong>
                    </div>

                    <p className="expenses-disclaimer">
                        This is an estimate based on recorded order subtotals
                        and expenses, not verified net profit. It does not
                        automatically account for all production costs,
                        refunds or payment settlements.
                    </p>
                </section>

                <section className="expenses-records-section">
                    <div className="expenses-section-heading">
                        <div>
                            <span className="expenses-eyebrow">
                                COST MANAGEMENT
                            </span>
                            <h2>Your Expense Records</h2>
                            <p>
                                Record and review costs associated with running
                                your farm.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="expenses-add-button"
                            onClick={() => {
                                setShowForm(previous => !previous);
                                setError("");
                                setMessage("");
                            }}
                            disabled={saving}
                        >
                            {showForm ? "− Cancel" : "+ Add Expense"}
                        </button>
                    </div>

                    {showForm && (
                        <form className="expenses-form" onSubmit={handleSubmit}>
                            <div className="expenses-form-heading">
                                <span className="expenses-form-icon">🧾</span>
                                <div>
                                    <h3>Record a Farming Expense</h3>
                                    <p>
                                        Enter the details of your farm-related
                                        purchase or cost.
                                    </p>
                                </div>
                            </div>

                            <div className="expenses-form-grid">
                                <div className="expenses-field">
                                    <label htmlFor="expense-category">
                                        Expense Category
                                    </label>
                                    <select
                                        id="expense-category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {expenseCategories.map(category => (
                                            <option
                                                key={category.value}
                                                value={category.value}
                                            >
                                                {category.icon} {category.value}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="expenses-field">
                                    <label htmlFor="expense-amount">
                                        Amount (₹)
                                    </label>
                                    <input
                                        id="expense-amount"
                                        type="number"
                                        name="amount"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="expenses-field expenses-field-full">
                                    <label htmlFor="expense-description">
                                        Description
                                    </label>
                                    <input
                                        id="expense-description"
                                        type="text"
                                        name="description"
                                        placeholder="e.g. Purchased fertilizer for tomato crop"
                                        value={formData.description}
                                        onChange={handleChange}
                                        maxLength={250}
                                        required
                                    />
                                </div>

                                <div className="expenses-field">
                                    <label htmlFor="expense-date">
                                        Expense Date
                                    </label>
                                    <input
                                        id="expense-date"
                                        type="date"
                                        name="expenseDate"
                                        value={formData.expenseDate}
                                        max={today()}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="expenses-form-actions">
                                <button
                                    type="submit"
                                    className="expenses-add-button"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Expense"}
                                </button>

                                <button
                                    type="button"
                                    className="expenses-cancel-button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setFormData({
                                            ...initialForm,
                                            expenseDate: today()
                                        });
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <div className="expenses-empty">
                            <span>⏳</span>
                            <p>Loading your expense records...</p>
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="expenses-empty">
                            <span>🌱</span>
                            <h3>No expenses recorded yet</h3>
                            <p>
                                Start tracking your farming costs by adding
                                your first expense.
                            </p>
                            <button
                                type="button"
                                className="expenses-add-button"
                                onClick={() => setShowForm(true)}
                            >
                                + Record First Expense
                            </button>
                        </div>
                    ) : (
                        <div className="expenses-records-grid">
                            {expenses.map(expense => {
                                const category = expenseCategories.find(
                                    item => item.value === expense.category
                                );

                                return (
                                    <article
                                        className="expenses-record-card"
                                        key={expense.id}
                                    >
                                        <div className="expenses-record-top">
                                            <div className="expenses-record-category">
                                                <span>
                                                    {category?.icon || "📋"}
                                                </span>
                                                <div>
                                                    <h3>{expense.category}</h3>
                                                    <p>
                                                        {formatDate(
                                                            expense.expenseDate
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="expenses-record-tag">
                                                Expense
                                            </span>
                                        </div>

                                        <p className="expenses-record-description">
                                            {expense.description}
                                        </p>

                                        <div className="expenses-record-bottom">
                                            <div>
                                                <span>Amount spent</span>
                                                <strong>
                                                    {formatCurrency(expense.amount)}
                                                </strong>
                                            </div>

                                            <button
                                                type="button"
                                                className="expenses-delete-button"
                                                onClick={() =>
                                                    handleDelete(expense.id)
                                                }
                                                disabled={deletingId === expense.id}
                                            >
                                                {deletingId === expense.id
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {!loading && expenses.length > 0 && (
                        <div className="expenses-category-summary">
                            <h3>Expense Categories</h3>
                            <div className="expenses-category-list">
                                {Object.entries(expenseCountByCategory).map(
                                    ([category, count]) => (
                                        <span key={category}>
                                            {category}
                                            <strong>{count}</strong>
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </section>

                <footer className="expenses-footer">
                    <strong>🌿 FarmingManagement</strong>
                    <p>Supporting smarter and more sustainable farming.</p>
                </footer>
            </div>
        </main>
    );
};

export default FarmerExpenses;
