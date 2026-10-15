import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const API_BASE = (
    import.meta.env.VITE_API_URL || "https://farm-backend-nhke.onrender.com"
).replace(/\/+$/, "");

const STORAGE_KEYS = ["user", "currentUser", "loggedInUser", "farmer", "userData"];


function getIdFromUser(user) {
    if (!user || typeof user !== "object") {
        return null;
    }

    const candidates = [
        user.id,
        user.userId,
        user.farmerId,
        user.user?.id,
        user.user?.userId,
        user.user?.farmerId,
        user.data?.id,
        user.data?.userId,
        user.data?.farmerId
    ];

    for (const value of candidates) {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            const id = Number(value);

            if (Number.isSafeInteger(id) && id > 0) {
                return id;
            }
        }
    }

    return null;
}


function getStoredFarmerUser() {
    for (const storage of [sessionStorage, localStorage]) {
        for (const key of STORAGE_KEYS) {
            try {
                const raw = storage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (parsed && (parsed.role === "FARMER" || parsed.user?.role === "FARMER")) {
                    return parsed;
                }
            } catch {
                // Try the next key.
            }
        }
    }
    return null;
}

function getStoredUser() {
    const farmer = getStoredFarmerUser();
    if (farmer) return farmer;

    for (const storage of [sessionStorage, localStorage]) {
        for (const key of STORAGE_KEYS) {
            try {
                const raw = storage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (getIdFromUser(parsed) !== null) return parsed;
            } catch {
                // Try the next key.
            }
        }
    }
    return null;
}

function newMessage(role, text) {
    return { id: `${Date.now()}-${Math.random()}`, role, text };
}

function renderFormattedText(text) {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
        const parts = [];
        const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
        let match;
        let lastIndex = 0;
        let pIdx = 0;

        while ((match = regex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                parts.push(line.substring(lastIndex, match.index));
            }
            const token = match[0];
            if (token.startsWith("**") && token.endsWith("**")) {
                parts.push(<strong key={`b-${pIdx++}`}>{token.slice(2, -2)}</strong>);
            } else if (token.startsWith("*") && token.endsWith("*")) {
                parts.push(<em key={`i-${pIdx++}`}>{token.slice(1, -1)}</em>);
            }
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
        }

        return (
            <span key={lIdx} style={{ display: "block", minHeight: line.trim() ? "auto" : "0.5em" }}>
                {parts.length > 0 ? parts : "\u00A0"}
            </span>
        );
    });
}

export default function FarmerAssistantWidget() {
    const location = useLocation();
    const routeUser = location.state?.user ?? null;

    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [conversationId, setConversationId] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [messages, setMessages] = useState([
        newMessage(
            "assistant",
            "Namaste! 🌱 I'm your Farmer Assistant.\n\nYou can ask to view crops, add crops, edit crop status, list products, record expenses, or record a harvest."
        )
    ]);

    // Prefer the user passed by React Router. Mirror it to storage to keep
    // the same farmer ID when navigating to other farmer pages.
    useEffect(() => {
        if (!routeUser) return;
        try {
            const serialized = JSON.stringify(routeUser);
            sessionStorage.setItem("user", serialized);
            localStorage.setItem("user", serialized);
        } catch (storageError) {
            console.warn("Unable to persist farmer session:", storageError);
        }
    }, [routeUser]);

    if (!location.pathname.startsWith("/farmer")) return null;

    function addMessage(role, text) {
        setMessages(previous => [...previous, newMessage(role, text)]);
    }

    async function sendToBackend(message, options = {}) {
        const activeUser = (routeUser && routeUser.role === "FARMER" ? routeUser : null)
            ?? getStoredFarmerUser()
            ?? routeUser
            ?? getStoredUser();
        const farmerId = getIdFromUser(activeUser);

        if (farmerId === null) {
            throw new Error(
                "Farmer ID was not found in the logged-in user. Log out and log in again as a farmer."
            );
        }

        const payload = {
            message,
            farmerId,
            conversationId: options.conversationId ?? conversationId,
            confirmed: options.confirmed ?? false,
            cancelled: options.cancelled ?? false
        };

        const response = await fetch(`${API_BASE}/api/farmer-assistant/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            data = { message: responseText };
        }

        if (!response.ok) {
            throw new Error(
                data?.message || data?.error || `Assistant request failed (${response.status}).`
            );
        }
        return data;
    }

    function applyAssistantResponse(data) {
        addMessage(
            "assistant",
            data?.message || "I received your request, but the server returned no message."
        );

        const nextConversationId = data?.conversationId ?? null;
        const nextStep = data?.nextStep || "";
        const intent = data?.intent || "";

        if (data?.requiresConfirmation || nextStep.startsWith("CONFIRM_")) {
            setConversationId(nextConversationId);
            setPendingAction({ conversationId: nextConversationId, intent });
            return;
        }

        if (nextConversationId && nextStep && nextStep !== "COMPLETED") {
            setConversationId(nextConversationId);
            setPendingAction(null);
            return;
        }

        if (
            nextStep === "COMPLETED" ||
            intent.endsWith("_SAVED") ||
            intent.endsWith("_DELETED") ||
            intent.endsWith("_UPDATED") ||
            intent === "CANCELLED"
        ) {
            setConversationId(null);
            setPendingAction(null);

            // Notify open pages (e.g. MyCrop, Products) that database records changed
            if (intent.endsWith("_SAVED") || intent.endsWith("_DELETED") || intent.endsWith("_UPDATED")) {
                window.dispatchEvent(new CustomEvent("farmDataUpdated", { detail: { intent } }));
            }
            return;
        }

        setPendingAction(null);
        setConversationId(nextConversationId);
    }

    async function handleSend(event) {
        event?.preventDefault();
        const message = input.trim();
        if (!message || loading) return;

        setInput("");
        setError("");
        addMessage("user", message);
        setLoading(true);

        const lower = message.toLowerCase();

        // If a pending confirmation was waiting and user typed yes/save/confirm
        if (pendingAction && (lower === "yes" || lower === "y" || lower === "save" || lower === "confirm" || lower === "sure" || lower === "ok")) {
            try {
                const data = await sendToBackend("YES", {
                    conversationId: pendingAction.conversationId,
                    confirmed: true,
                    cancelled: false
                });
                applyAssistantResponse(data);
            } catch (confirmError) {
                setError(confirmError?.message || "Unable to confirm this action.");
            } finally {
                setLoading(false);
            }
            return;
        }

        // If a pending confirmation was waiting and user typed no/cancel
        if (pendingAction && (lower === "no" || lower === "n" || lower === "cancel" || lower === "stop")) {
            try {
                const data = await sendToBackend("NO", {
                    conversationId: pendingAction.conversationId,
                    confirmed: false,
                    cancelled: true
                });
                applyAssistantResponse(data);
                setConversationId(null);
                setPendingAction(null);
            } catch (cancelError) {
                setError(cancelError?.message || "Unable to cancel this action.");
            } finally {
                setLoading(false);
            }
            return;
        }

        // If user typed a brand new question while pending action was waiting, clear pending action
        const activeConvId = pendingAction ? null : conversationId;
        if (pendingAction) {
            setPendingAction(null);
            setConversationId(null);
        }

        try {
            const data = await sendToBackend(message, { conversationId: activeConvId });
            applyAssistantResponse(data);
        } catch (sendError) {
            setError(sendError?.message || "Could not contact the Farmer Assistant.");
        } finally {
            setLoading(false);
        }
    }

    async function confirmAction() {
        if (loading || !pendingAction) return;

        setError("");
        setLoading(true);
        addMessage("user", "YES");

        try {
            const data = await sendToBackend("YES", {
                conversationId: pendingAction.conversationId,
                confirmed: true,
                cancelled: false
            });
            applyAssistantResponse(data);
        } catch (confirmError) {
            setError(confirmError?.message || "Unable to confirm this action.");
        } finally {
            setLoading(false);
        }
    }

    async function cancelAction() {
        if (loading || !pendingAction) return;

        setError("");
        setLoading(true);
        addMessage("user", "NO");

        try {
            const data = await sendToBackend("NO", {
                conversationId: pendingAction.conversationId,
                confirmed: false,
                cancelled: true
            });
            applyAssistantResponse(data);
            setConversationId(null);
            setPendingAction(null);
        } catch (cancelError) {
            setError(cancelError?.message || "Unable to cancel this action.");
        } finally {
            setLoading(false);
        }
    }

    function startNewChat() {
        setConversationId(null);
        setPendingAction(null);
        setInput("");
        setError("");
        setMessages([
            newMessage("assistant", "Namaste! 🌱 What would you like to do with your farm records?")
        ]);
    }

    return (
        <div className="fa-widget">
            {isOpen && (
                <section className="fa-widget-panel" aria-label="Farmer Assistant">
                    <header className="fa-widget-header">
                        <div className="fa-widget-header-info">
                            <div className="fa-widget-avatar">🌱</div>
                            <div>
                                <strong>Farmer Assistant</strong>
                                <span>Farm records &amp; assistance</span>
                            </div>
                        </div>
                        <div className="fa-widget-header-actions">
                            <button type="button" className="fa-widget-icon-button" onClick={startNewChat} title="Start a new conversation" aria-label="Start a new conversation">↻</button>
                            <button type="button" className="fa-widget-icon-button" onClick={() => setIsOpen(false)} title="Close assistant" aria-label="Close assistant">×</button>
                        </div>
                    </header>

                    <div className="fa-widget-messages">
                        {messages.map(message => (
                            <div key={message.id} className={`fa-widget-message-row ${message.role === "user" ? "user" : "assistant"}`}>
                                <div className="fa-widget-message">{renderFormattedText(message.text)}</div>
                            </div>
                        ))}

                        {loading && (
                            <div className="fa-widget-loading">
                                <span /><span /><span /><small>Working...</small>
                            </div>
                        )}

                        {error && <div className="fa-widget-error" role="alert">{error}</div>}

                        {pendingAction && (
                            <div className="fa-widget-confirm">
                                <strong>Confirm this action</strong>
                                <p>Please review the details above before saving them to your farm records.</p>
                                <div className="fa-widget-confirm-actions">
                                    <button type="button" className="fa-widget-confirm-yes" onClick={confirmAction} disabled={loading}>Yes, save</button>
                                    <button type="button" className="fa-widget-confirm-no" onClick={cancelAction} disabled={loading}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <form className="fa-widget-input-area" onSubmit={handleSend}>
                        <input
                            value={input}
                            onChange={event => setInput(event.target.value)}
                            placeholder={pendingAction ? "Reply YES / Cancel or ask something else..." : "Ask about your farm..."}
                            disabled={loading}
                            aria-label="Message Farmer Assistant"
                        />
                        <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">➤</button>
                    </form>
                    <footer className="fa-widget-footer">Answers use records saved in your farm system.</footer>
                </section>
            )}

            <button
                type="button"
                className="fa-widget-launcher"
                onClick={() => setIsOpen(open => !open)}
                aria-label={isOpen ? "Close Farmer Assistant" : "Open Farmer Assistant"}
            >
                {isOpen ? "×" : "🌱"}
                {!isOpen && <span>Farmer Assistant</span>}
            </button>
        </div>
    );
}
