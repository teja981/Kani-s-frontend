
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storeApi, rupees } from "./StoreApi.js";
import { notifyCartChanged } from "./cartShared.js";
import { LoginBox } from "./Shop.jsx";
import "./Cart.css";
import "./checkout-premium.css";

const EMPTY = {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
};

/* Loads Razorpay's checkout window once, on demand. */
function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const s = document.createElement("script");

        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = resolve;
        s.onerror = () =>
            reject(
                new Error(
                    "Couldn't load the payment window. Check your connection and try again."
                )
            );

        document.body.appendChild(s);
    });
}

/* Backend requires an Idempotency-Key of 16-128 chars */
const newKey = () =>
    window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;

/* ---------- Checkout (Razorpay online payment only) ---------- */
export function Checkout() {
    const navigate = useNavigate();

    const [cart, setCart] = useState(null);
    const [state, setState] = useState("loading");
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const keyRef = useRef(null);

    const load = () =>
        storeApi("/cart")
            .then((r) => {
                setCart(r.cart);
                setState("ready");
            })
            .catch((err) =>
                setState(err.status === 401 ? "login" : "error")
            );

    useEffect(() => {
        load();
    }, []);

    const change = (key) => (e) => {
        keyRef.current = null;
        setForm((f) => ({
            ...f,
            [key]: e.target.value,
        }));
    };

    const done = (orderId) => {
        notifyCartChanged();

        navigate(`/orders/${orderId}`, {
            state: { placed: true },
            replace: true,
        });
    };

    const payOnline = async () => {
        await loadRazorpay();

        if (!keyRef.current) {
            keyRef.current = newKey();
        }

        // Reserves stock for 15 minutes and creates the Razorpay order
        const s = await storeApi("/payments/create-order", {
            method: "POST",
            headers: {
                "Idempotency-Key": keyRef.current,
            },
            body: {
                shippingAddress: form,
            },
        });

        await new Promise((resolve, reject) => {
            let paid = false;

            const rzp = new window.Razorpay({
                key: s.keyId,
                amount: s.amount,
                currency: s.currency,
                order_id: s.razorpayOrderId,
                name: "Kani's Studio",
                description: "Order payment",

                prefill: {
                    name: form.fullName,
                    contact: form.phone,
                },

                handler: async (resp) => {
                    paid = true;

                    try {
                        const v = await storeApi("/payments/verify", {
                            method: "POST",
                            body: {
                                reservationId: s.reservationId,
                                razorpay_order_id: resp.razorpay_order_id,
                                razorpay_payment_id: resp.razorpay_payment_id,
                                razorpay_signature: resp.razorpay_signature,
                            },
                        });

                        done(v.orderId);
                        resolve();
                    } catch (err) {
                        // Money may have been taken, so don't tell the customer to pay again
                        if (err.status === 401) {
                            reject(err);
                        } else {
                            reject(
                                new Error(
                                    "We received your payment but couldn't confirm the order yet. Please check My Orders in a minute before trying again."
                                )
                            );
                        }
                    }
                },

                modal: {
                    ondismiss: () => {
                        if (paid) return;

                        reject(
                            new Error(
                                "Payment was cancelled. Your items stay reserved for 15 minutes, so you can try again."
                            )
                        );
                    },
                },
            });

            // The window stays open after a failed attempt so the customer can retry inside it
            rzp.on("payment.failed", (r) =>
                setError(
                    r?.error?.description ||
                    "Payment failed. You can retry in the payment window."
                )
            );

            rzp.open();
        });
    };

    const submit = async (e) => {
        e.preventDefault();

        setError("");
        setBusy(true);

        try {
            await payOnline();
        } catch (err) {
            if (err.status === 401) {
                setState("login");
            } else {
                setError(err.message);
            }
        } finally {
            setBusy(false);
        }
    };

    if (state === "loading") {
        return (
            <main className="shop ct-page">
                <p className="shop-note">Loading checkout…</p>
            </main>
        );
    }

    if (state === "login") {
        return (
            <main className="shop ct-page ct-narrow">
                <h1 className="ct-title">Checkout</h1>

                <LoginBox
                    message="Sign in to place your order."
                    button="Sign in"
                    onDone={load}
                />
            </main>
        );
    }

    if (state === "error") {
        return (
            <main className="shop ct-page">
                <p className="shop-note">
                    We couldn't load checkout. Please refresh.
                </p>
            </main>
        );
    }

    const items = cart?.items || [];

    if (items.length === 0) {
        return (
            <main className="shop ct-page ct-empty">
                <h1 className="ct-title">Your cart is empty</h1>

                <Link
                    to="/shop"
                    className="shop-btn ct-linkbtn"
                >
                    Browse the collection
                </Link>
            </main>
        );
    }

    return (
        <main className="shop ct-page">
            <h1 className="ct-title">Checkout</h1>

            <div className="ct-layout">
                <form className="ct-form" onSubmit={submit}>
                    <h2>Delivery address</h2>

                    <label>
                        Full name
                        <input
                            required
                            maxLength={100}
                            value={form.fullName}
                            onChange={change("fullName")}
                            autoComplete="name"
                        />
                    </label>

                    <label>
                        Phone
                        <input
                            required
                            type="tel"
                            maxLength={20}
                            value={form.phone}
                            onChange={change("phone")}
                            autoComplete="tel"
                        />
                    </label>

                    <label>
                        Address line 1
                        <input
                            required
                            maxLength={200}
                            value={form.addressLine1}
                            onChange={change("addressLine1")}
                            autoComplete="address-line1"
                        />
                    </label>

                    <label>
                        Address line 2 <small>(optional)</small>
                        <input
                            maxLength={200}
                            value={form.addressLine2}
                            onChange={change("addressLine2")}
                            autoComplete="address-line2"
                        />
                    </label>

                    <label>
                        Landmark <small>(optional)</small>
                        <input
                            maxLength={100}
                            value={form.landmark}
                            onChange={change("landmark")}
                        />
                    </label>

                    <div className="ct-two">
                        <label>
                            City
                            <input
                                required
                                maxLength={80}
                                value={form.city}
                                onChange={change("city")}
                                autoComplete="address-level2"
                            />
                        </label>

                        <label>
                            State
                            <input
                                required
                                maxLength={80}
                                value={form.state}
                                onChange={change("state")}
                                autoComplete="address-level1"
                            />
                        </label>
                    </div>

                    <div className="ct-two">
                        <label>
                            PIN code
                            <input
                                required
                                maxLength={12}
                                value={form.postalCode}
                                onChange={change("postalCode")}
                                autoComplete="postal-code"
                            />
                        </label>

                        <label>
                            Country
                            <input
                                maxLength={60}
                                value={form.country}
                                onChange={change("country")}
                                autoComplete="country-name"
                            />
                        </label>
                    </div>

                    <h2>Payment</h2>

                    <div className="ct-methods">
                        <div className="ct-method on">
                            <span>
                                <b>Pay online</b>
                                <small>
                                    UPI, cards, netbanking and wallets via
                                    Razorpay. Your items are held for 15 minutes.
                                </small>
                            </span>
                        </div>
                    </div>

                    {error && (
                        <p className="ct-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        className="shop-btn ct-block"
                        disabled={busy || cart.hasUnavailableItems}
                    >
                        {busy
                            ? "Opening payment…"
                            : `Pay ${rupees(cart.subtotal)}`}
                    </button>

                    {cart.hasUnavailableItems && (
                        <p className="ct-warn">
                            Some items are unavailable.{" "}
                            <Link to="/cart">Fix your cart</Link>
                        </p>
                    )}
                </form>

                <aside className="ct-summary">
                    <h2>Your order</h2>

                    <ul className="ct-mini">
                        {items.map((item) => (
                            <li key={item.itemId}>
                                <span>
                                    {item.name}

                                    <small>
                                        {[
                                            item.color,
                                            item.size && `Size ${item.size}`,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}{" "}
                                        × {item.quantity}
                                    </small>
                                </span>

                                <span>{rupees(item.lineTotal)}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="ct-sum-row">
                        <span>Subtotal</span>
                        <span>{rupees(cart.subtotal)}</span>
                    </div>

                    <div className="ct-sum-row">
                        <span>Shipping</span>
                        <span>Free</span>
                    </div>

                    <div className="ct-sum-row ct-total">
                        <span>Total</span>
                        <span>{rupees(cart.subtotal)}</span>
                    </div>

                    <Link to="/cart" className="ct-textlink">
                        Edit cart
                    </Link>
                </aside>
            </div>
        </main>
    );
}
