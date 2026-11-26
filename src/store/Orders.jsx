import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { storeApi, rupees } from "./StoreApi.js";
import { LoginBox } from "./Shop.jsx";
import "./Cart.css";

const STATUS_LABEL = {
    pending: "Order placed",
    confirmed: "Confirmed",
    processing: "Being prepared",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

const label = (s) => STATUS_LABEL[s] || s;

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "";

const fmtDateTime = (d) =>
    d
        ? new Date(d).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
        })
        : "";

/* ---------- My orders (list) ---------- */
export function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [state, setState] = useState("loading"); // loading | login | ready | error

    const load = () =>
        storeApi("/orders/my-orders?limit=50")
            .then((r) => { setOrders(r.orders || []); setState("ready"); })
            .catch((err) => setState(err.status === 401 ? "login" : "error"));

    useEffect(() => { load(); }, []);

    if (state === "loading") {
        return <main className="shop ct-page"><p className="shop-note">Loading your orders…</p></main>;
    }

    if (state === "login") {
        return (
            <main className="shop ct-page ct-narrow">
                <h1 className="ct-title">My orders</h1>
                <LoginBox message="Sign in to see your orders." button="Sign in" onDone={load} />
            </main>
        );
    }

    if (state === "error") {
        return <main className="shop ct-page"><p className="shop-note">We couldn't load your orders. Please refresh.</p></main>;
    }

    if (orders.length === 0) {
        return (
            <main className="shop ct-page ct-empty">
                <h1 className="ct-title">No orders yet</h1>
                <p>When you place an order it will show up here.</p>
                <Link to="/shop" className="shop-btn ct-linkbtn">Browse the collection</Link>
            </main>
        );
    }

    return (
        <main className="shop ct-page">
            <h1 className="ct-title">My orders</h1>
            <ul className="ct-orders">
                {orders.map((o) => (
                    <li key={o._id}>
                        <Link to={`/orders/${o._id}`} className="ct-order-card">
                            <div>
                                <strong>{o.orderNumber}</strong>
                                <small>{fmtDate(o.createdAt)} · {o.items?.length || 0} item(s)</small>
                            </div>
                            <span className={`ct-status ct-status-${o.status}`}>{label(o.status)}</span>
                            <strong>{rupees(o.totalAmount)}</strong>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}

/* ---------- One order (confirmation + tracking) ---------- */
export function OrderPage() {
    const { orderId } = useParams();
    const location = useLocation();
    const justPlaced = Boolean(location.state?.placed);

    const [order, setOrder] = useState(null);
    const [state, setState] = useState("loading"); // loading | login | missing | ready | error
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);

    const load = () =>
        storeApi(`/orders/my-orders/${orderId}`)
            .then((r) => { setOrder(r.order); setState("ready"); })
            .catch((err) => {
                if (err.status === 401) setState("login");
                else if (err.status === 404 || err.status === 400) setState("missing");
                else setState("error");
            });

    useEffect(() => { load(); }, [orderId]);

    const cancel = async () => {
        if (!window.confirm("Cancel this order?")) return;
        setBusy(true);
        setMsg("");
        try {
            await storeApi(`/orders/my-orders/${orderId}/cancel`, {
                method: "PATCH",
                body: { reason: "Cancelled by customer" },
            });
            await load();
        } catch (err) {
            setMsg(err.message);
        } finally {
            setBusy(false);
        }
    };

    if (state === "loading") {
        return <main className="shop ct-page"><p className="shop-note">Loading your order…</p></main>;
    }

    if (state === "login") {
        return (
            <main className="shop ct-page ct-narrow">
                <h1 className="ct-title">Your order</h1>
                <LoginBox message="Sign in to see this order." button="Sign in" onDone={load} />
            </main>
        );
    }

    if (state === "missing") {
        return (
            <main className="shop ct-page">
                <p className="shop-note">We couldn't find that order. <Link to="/orders">See all orders</Link></p>
            </main>
        );
    }

    if (state === "error" || !order) {
        return <main className="shop ct-page"><p className="shop-note">We couldn't load this order. Please refresh.</p></main>;
    }

    const a = order.shippingAddress || {};
    const t = order.tracking || {};
    const canCancel = ["pending", "confirmed"].includes(order.status);

    return (
        <main className="shop ct-page">
            {justPlaced && (
                <div className="ct-success" role="status">
                    <h2>Thank you! Your order is placed.</h2>
                    {order.paymentMethod === "cod"
                        ? <p>We've emailed your confirmation. You'll pay <b>{rupees(order.totalAmount)}</b> on delivery.</p>
                        : <p>Payment of <b>{rupees(order.totalAmount)}</b> received. We've emailed your confirmation.</p>}
                </div>
            )}

            <div className="ct-order-head">
                <div>
                    <h1 className="ct-title">Order {order.orderNumber}</h1>
                    <p className="ct-meta">Placed on {fmtDate(order.createdAt)}</p>
                </div>
                <span className={`ct-status ct-status-${order.status}`}>{label(order.status)}</span>
            </div>

            <div className="ct-layout">
                <section>
                    <ul className="ct-list">
                        {order.items.map((item) => (
                            <li key={item._id || `${item.product}-${item.variant}`} className="ct-item">
                                <div className="ct-thumb">
                                    {item.image ? <img src={item.image} alt={item.productName} /> : <span>No photo</span>}
                                </div>
                                <div className="ct-info">
                                    <span className="ct-name">{item.productName}</span>
                                    <p className="ct-meta">
                                        {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
                                    </p>
                                    <p className="ct-unit">{rupees(item.unitPrice)} × {item.quantity}</p>
                                </div>
                                <strong className="ct-line">{rupees(item.lineTotal)}</strong>
                            </li>
                        ))}
                    </ul>

                    <h2 className="ct-sub">Progress</h2>
                    <ol className="ct-timeline">
                        {(order.statusHistory || []).map((h, i) => (
                            <li key={h._id || i}>
                                <b>{label(h.status)}</b>
                                <small>{fmtDateTime(h.changedAt)}</small>
                                {h.note && <span>{h.note}</span>}
                            </li>
                        ))}
                    </ol>

                    {(t.carrier || t.trackingNumber || t.estimatedDelivery) && (
                        <>
                            <h2 className="ct-sub">Shipment</h2>
                            <p className="ct-meta">
                                {t.carrier && <>Carrier: {t.carrier}<br /></>}
                                {t.trackingNumber && <>Tracking number: {t.trackingNumber}<br /></>}
                                {t.estimatedDelivery && <>Estimated delivery: {fmtDate(t.estimatedDelivery)}<br /></>}
                                {t.trackingUrl && <a href={t.trackingUrl} target="_blank" rel="noreferrer" className="ct-textlink">Track your parcel</a>}
                            </p>
                        </>
                    )}
                </section>

                <aside className="ct-summary">
                    <h2>Summary</h2>
                    <div className="ct-sum-row"><span>Subtotal</span><span>{rupees(order.subtotal)}</span></div>
                    <div className="ct-sum-row"><span>Shipping</span><span>{order.shippingFee ? rupees(order.shippingFee) : "Free"}</span></div>
                    <div className="ct-sum-row ct-total"><span>Total</span><span>{rupees(order.totalAmount)}</span></div>
                    <p className="ct-meta">
                        Payment: {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod} ({order.paymentStatus})
                    </p>

                    <h2 className="ct-sub">Delivering to</h2>
                    <address className="ct-address">
                        {a.fullName}<br />
                        {a.addressLine1}<br />
                        {a.addressLine2 && <>{a.addressLine2}<br /></>}
                        {a.landmark && <>Near {a.landmark}<br /></>}
                        {a.city}, {a.state} {a.postalCode}<br />
                        {a.country}<br />
                        {a.phone}
                    </address>

                    {msg && <p className="ct-error" role="alert">{msg}</p>}
                    {canCancel && (
                        <button type="button" className="ct-remove" onClick={cancel} disabled={busy}>
                            {busy ? "Cancelling…" : "Cancel order"}
                        </button>
                    )}
                    <Link to="/orders" className="ct-textlink">All my orders</Link>
                    <Link to="/shop" className="ct-textlink">Continue shopping</Link>
                </aside>
            </div>
        </main>
    );
}
