import { useState } from "react";
import { useLocation } from "react-router-dom";


const API_BASE = (
    import.meta.env.VITE_API_URL ||
    "https://farm-backend-nhke.onrender.com"
).replace(/\/+$/, "");

function getFarmerId() {
    const keys = [
        "user",
        "currentUser",
        "loggedInUser",
        "farmer",
        "userData"
    ];

    for (const storage of [sessionStorage, localStorage]) {
        for (const key of keys) {
            try {
                const raw = storage.getItem(key);
                if (!raw) continue;

                const user = JSON.parse(raw);

                const id =
                    user?.farmerId ??
                    user?.userId ??
                    user?.id;

                if (id !== undefined && id !== null && id !== "") {
                    return Number(id);
                }
            } catch {
                // Ignore invalid storage values and try the next key.
            }
        }
    }

    return null;
}

function newMessage(role, text, extra = {}) {
    return {
        id: `${Date.now()}-${Math.random()}`,
        role,
        text,
        ...extra
    };
}

export default function FarmerAssistantWidget() {
    const location = useLocation();

    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [conversationId, setConversationId] = useState(null);

    const [messages, setMessages] = useState([
        newMessage(
            "assistant",
            "Namaste! 🌱 I'm your Farmer Assistant.\n\n" +
            "You can ask about your crops, record expenses, " +
            "list products, or record a harvest."
        )
    ]);

    const [pendingAction, setPendingAction] = useState(null);

    // Do not display the assistant outside the farmer portal.
    if (!location.pathname.startsWith("/farmer")) {
        return null;
    }

    function addMessage(role, text, extra = {}) {
        setMessages(previous => [
            ...previous,
            newMessage(role, text, extra)
        ]);
    }

    async function sendToBackend(
        message,
        options = {}
    ) {
        const farmerId = getFarmerId();

        if (!farmerId || !Number.isFinite(farmerId)) {
            throw new Error(
                "Farmer details were not found. Please log in again."
            );
        }

        const payload = {
            message,
            farmerId,
            conversationId: options.conversationId ?? conversationId,
            confirmed: options.confirmed ?? false,
            cancelled: options.cancelled ?? false
        };

        const response = await fetch(
            `${API_BASE}/api/farmer-assistant/message`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const responseText = await response.text();

        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            data = { message: responseText };
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                `Assistant request failed (${response.status}).`
            );
        }

        return data;
    }

    function applyAssistantResponse(data) {
        const reply =
            data?.message ||
            "I received your request, but the server returned no message.";

        addMessage("assistant", reply);

        const nextConversationId = data?.conversationId || null;
        const nextStep = data?.nextStep || "";
        const intent = data?.intent || "";

        if (
            data?.requiresConfirmation ||
            nextStep.startsWith("CONFIRM_")
        ) {
            setConversationId(nextConversationId);
            setPendingAction({
                conversationId: nextConversationId,
                intent
            });
            return;
        }

        // A normal follow-up question may still belong to an active
        // multi-step conversation.
        if (
            nextConversationId &&
            nextStep &&
            nextStep !== "COMPLETED"
        ) {
            setConversationId(nextConversationId);
            setPendingAction(null);
            return;
        }

        // Clear the conversation after a successful save or cancellation.
        if (
            nextStep === "COMPLETED" ||
            intent.endsWith("_SAVED") ||
            intent === "CANCELLED"
        ) {
            setConversationId(null);
            setPendingAction(null);
            return;
        }

        setPendingAction(null);

        // If the server returned a conversation ID without a confirmation
        // step, retain it for the next question.
        setConversationId(nextConversationId);
    }

    async function handleSend(event) {
        event?.preventDefault();

        const message = input.trim();

        if (!message || loading || pendingAction) {
            return;
        }

        setInput("");
        setError("");
        addMessage("user", message);
        setLoading(true);

        try {
            const data = await sendToBackend(message);
            applyAssistantResponse(data);
        } catch (err) {
            setError(
                err.message ||
                "Could not contact the Farmer Assistant."
            );
        } finally {
            setLoading(false);
        }
    }

    async function confirmAction() {
        if (loading || !pendingAction) return;

        setError("");
        setLoading(true);
        addMessage("user", "Yes, save it.");

        try {
            const data = await sendToBackend(
                "YES",
                {
                    conversationId: pendingAction.conversationId,
                    confirmed: true,
                    cancelled: false
                }
            );

            applyAssistantResponse(data);
        } catch (err) {
            setError(err.message || "Unable to confirm this action.");
        } finally {
            setLoading(false);
        }
    }

    async function cancelAction() {
        if (loading || !pendingAction) return;

        setError("");
        setLoading(true);
        addMessage("user", "Cancel.");

        try {
            const data = await sendToBackend(
                "NO",
                {
                    conversationId: pendingAction.conversationId,
                    confirmed: false,
                    cancelled: true
                }
            );

            applyAssistantResponse(data);
            setConversationId(null);
            setPendingAction(null);
        } catch (err) {
            setError(err.message || "Unable to cancel this action.");
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
            newMessage(
                "assistant",
                "Namaste! 🌱 What would you like to do with your farm records?"
            )
        ]);
    }

    return (
        <div className="fa-widget">
            {isOpen && (
                <section
                    className="fa-widget-panel"
                    aria-label="Farmer Assistant"
                >
                    <header className="fa-widget-header">
                        <div className="fa-widget-header-info">
                            <div className="fa-widget-avatar">🌱</div>
                            <div>
                                <strong>Farmer Assistant</strong>
                                <span>Farm records & assistance</span>
                            </div>
                        </div>

                        <div className="fa-widget-header-actions">
                            <button
                                type="button"
                                className="fa-widget-icon-button"
                                onClick={startNewChat}
                                title="Start a new conversation"
                                aria-label="Start a new conversation"
                            >
                                ↻
                            </button>

                            <button
                                type="button"
                                className="fa-widget-icon-button"
                                onClick={() => setIsOpen(false)}
                                title="Close assistant"
                                aria-label="Close assistant"
                            >
                                ×
                            </button>
                        </div>
                    </header>

                    <div className="fa-widget-messages">
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={
                                    message.role === "user"
                                        ? "fa-widget-message-row user"
                                        : "fa-widget-message-row assistant"
                                }
                            >
                                <div className="fa-widget-message">
                                    {message.text}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="fa-widget-loading">
                                <span />
                                <span />
                                <span />
                                <small>Working...</small>
                            </div>
                        )}

                        {error && (
                            <div className="fa-widget-error" role="alert">
                                {error}
                            </div>
                        )}

                        {pendingAction && (
                            <div className="fa-widget-confirm">
                                <strong>Confirm this action</strong>
                                <p>
                                    Please review the details above before
                                    saving them to your farm records.
                                </p>

                                <div className="fa-widget-confirm-actions">
                                    <button
                                        type="button"
                                        className="fa-widget-confirm-yes"
                                        onClick={confirmAction}
                                        disabled={loading}
                                    >
                                        Yes, save
                                    </button>

                                    <button
                                        type="button"
                                        className="fa-widget-confirm-no"
                                        onClick={cancelAction}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <form
                        className="fa-widget-input-area"
                        onSubmit={handleSend}
                    >
                        <input
                            value={input}
                            onChange={event => setInput(event.target.value)}
                            placeholder={
                                pendingAction
                                    ? "Confirm or cancel above"
                                    : "Ask about your farm..."
                            }
                            disabled={loading || Boolean(pendingAction)}
                            aria-label="Message Farmer Assistant"
                        />

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                Boolean(pendingAction) ||
                                !input.trim()
                            }
                            aria-label="Send message"
                        >
                            ➤
                        </button>
                    </form>

                    <footer className="fa-widget-footer">
                        Answers use records saved in your farm system.
                    </footer>
                </section>
            )}

            <button
                type="button"
                className="fa-widget-launcher"
                onClick={() => setIsOpen(open => !open)}
                aria-label={
                    isOpen
                        ? "Close Farmer Assistant"
                        : "Open Farmer Assistant"
                }
            >
                {isOpen ? "×" : "🌱"}
                {!isOpen && <span>Farmer Assistant</span>}
            </button>
        </div>
    );
}