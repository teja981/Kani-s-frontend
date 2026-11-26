
import { useEffect, useState } from "react";
import { api } from "../api.js";
import { rupees } from "../common.jsx";
import "./Orders.css";

const NEXT = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
};

const STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];

const FLOW = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
];

const SPARKS = [
    { l: "6%", t: "8%", d: 0 },
    { l: "94%", t: "14%", d: 1.2 },
    { l: "88%", t: "86%", d: 2 },
    { l: "10%", t: "92%", d: .8 },
];

const collectCod = (o) =>
    api(`/orders/admin/${o._id}/payment/collect-cod`, {
        method: "PATCH",
    });

const deleteAdminOrder = (o) =>
    api(`/orders/admin/${o._id}`, {
        method: "DELETE",
    });

function CountUp({ value, format = (n) => n }) {
    const [n, setN] = useState(0);

    useEffect(() => {
        let raf;
        let start;

        const tick = (t) => {
            start ??= t;
            const k = Math.min((t - start) / 900, 1);

            setN(
                Math.round(
                    value * (1 - Math.pow(1 - k, 3))
                )
            );

            if (k < 1) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
    }, [value]);

    return <>{format(n)}</>;
}

function Backdrop() {
    return (
        <>
            <div className="ko-orb ko-orb-a" />
            <div className="ko-orb ko-orb-b" />
            <div className="ko-pattern" />

            {SPARKS.map((s, i) => (
                <i
                    key={i}
                    className="ko-spark"
                    style={{
                        left: s.l,
                        top: s.t,
                        animationDelay: `${s.d}s`,
                    }}
                >
                    ✦
                </i>
            ))}
        </>
    );
}

const Badge = ({ s }) => (
    <span className={`ko-badge ko-s-${s}`}>
        {s}
    </span>
);

function Timeline({ status }) {
    if (status === "cancelled") {
        return (
            <div className="ko-cancelled">
                ✕ This order was cancelled
            </div>
        );
    }

    const idx = Math.max(0, FLOW.indexOf(status));

    return (
        <div className="ko-timeline" aria-label={`Order status: ${status}`}>
            <div className="ko-tl-line">
                <i
                    style={{
                        width: `${(idx / (FLOW.length - 1)) * 100}%`,
                    }}
                />
            </div>

            {FLOW.map((s, i) => (
                <div
                    key={s}
                    className={`ko-tl-step ${i < idx ? "done" : ""
                        } ${i === idx ? "now" : ""}`}
                >
                    <span>{i < idx ? "✓" : i + 1}</span>
                    <small>{s}</small>
                </div>
            ))}
        </div>
    );
}

export function Orders() {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("");
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(null);

    const [track, setTrack] = useState({
        carrier: "",
        trackingNumber: "",
        trackingUrl: "",
    });

    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);

        return api(
            `/orders/admin?limit=50${status ? `&status=${status}` : ""
            }${q ? `&q=${encodeURIComponent(q)}` : ""
            }`
        )
            .then((r) => setOrders(r.orders))
            .catch((e) => setMsg(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [status]);

    const run = async (fn) => {
        setMsg("");

        try {
            await fn();
            setOpen(null);
            await load();
        } catch (e) {
            setMsg(e.message);
        }
    };

    const move = (o, next) =>
        run(() =>
            api(`/orders/admin/${o._id}/status`, {
                method: "PATCH",
                body:
                    next === "shipped"
                        ? { status: next, ...track }
                        : { status: next },
            })
        );

    const toggle = (o) => {
        setTrack({
            carrier: "",
            trackingNumber: "",
            trackingUrl: "",
        });

        setOpen(open === o._id ? null : o._id);
    };

    const handleDelete = (o) => {
        const confirmed = window.confirm(
            `Are you sure you want to permanently delete order ${o.orderNumber}? This action cannot be undone.`
        );

        if (!confirmed) return;

        run(() => deleteAdminOrder(o));
    };

    const canDelete = (o) =>
        o.status === "cancelled" &&
        !["paid", "refund_pending", "refunded"].includes(
            o.paymentStatus
        );

    const count = (...s) =>
        orders.filter((o) => s.includes(o.status)).length;

    return (
        <div className="ko-page">
            <Backdrop />

            <div className="ko-inner">
                <header className="ko-head">
                    <div>
                        <small className="ko-eyebrow">✦ Sales</small>
                        <h2>Orders</h2>
                    </div>
                </header>

                <div className="ko-stats">
                    {[
                        ["Pending", count("pending")],
                        ["In progress", count("confirmed", "processing")],
                        ["Shipped", count("shipped")],
                        ["Delivered", count("delivered")],
                    ].map(([l, n], i) => (
                        <div
                            key={l}
                            className="ko-stat"
                            style={{ "--i": i }}
                        >
                            <span className="ko-sheen" />
                            <strong>
                                <CountUp value={n} />
                            </strong>
                            <small>{l}</small>
                        </div>
                    ))}
                </div>

                <div className="ko-toolbar">
                    <label className="ko-search">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <path d="M20 20l-4-4" />
                        </svg>

                        <input
                            placeholder="Order number, e.g. KST-20261115-AB12CD34"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && load()
                            }
                        />
                    </label>

                    <div
                        className="ko-filters"
                        role="group"
                        aria-label="Filter by status"
                    >
                        <button
                            type="button"
                            className={status === "" ? "on" : ""}
                            onClick={() => setStatus("")}
                        >
                            all
                        </button>

                        {STATUSES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={status === s ? "on" : ""}
                                onClick={() => setStatus(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {msg && (
                    <p className="ko-error" role="alert">
                        {msg}
                    </p>
                )}

                {loading ? (
                    <div className="ko-list">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="ko-skel"
                                style={{ "--i": i }}
                            />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="ko-empty ko-glass">
                        <span>✦</span>
                        <p>
                            No orders match. New orders will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="ko-list">
                        {orders.map((o, idx) => {
                            const a = o.shippingAddress || {};
                            const isOpen = open === o._id;

                            return (
                                <article
                                    key={o._id}
                                    className={`ko-order ko-glass ${isOpen ? "open" : ""
                                        }`}
                                    style={{ "--i": idx }}
                                >
                                    <span className="ko-sheen" />

                                    <div className="ko-row">
                                        <div className="ko-id">
                                            <b>{o.orderNumber}</b>
                                            <small>
                                                {new Date(
                                                    o.createdAt
                                                ).toLocaleString("en-IN")}
                                            </small>
                                        </div>

                                        <div className="ko-cust">
                                            {o.customer?.name || "–"}
                                        </div>

                                        <div className="ko-total">
                                            {rupees(o.totalAmount)}
                                        </div>

                                        <div className="ko-tags">
                                            <Badge s={o.status} />

                                            <span
                                                className={`ko-pay ko-p-${o.paymentStatus}`}
                                            >
                                                {o.paymentMethod?.toUpperCase()}
                                                {" · "}
                                                {o.paymentStatus}
                                            </span>
                                        </div>

                                        <button
                                            className={`ko-manage ${isOpen ? "on" : ""
                                                }`}
                                            onClick={() => toggle(o)}
                                            aria-expanded={isOpen}
                                        >
                                            {isOpen ? "Close" : "Manage"}
                                            <i>›</i>
                                        </button>
                                    </div>

                                    {isOpen && (
                                        <div className="ko-detail">
                                            <Timeline status={o.status} />

                                            <div className="ko-panels">
                                                <div
                                                    className="ko-panel"
                                                    style={{ "--i": 0 }}
                                                >
                                                    <h4>Items</h4>

                                                    {o.items.map((item, k) => (
                                                        <p
                                                            key={k}
                                                            className="ko-item"
                                                        >
                                                            <span>
                                                                {item.productName}
                                                                {" "}
                                                                <small>
                                                                    ({item.size},{" "}
                                                                    {item.color})
                                                                    {" × "}
                                                                    {item.quantity}
                                                                </small>
                                                            </span>

                                                            <b>
                                                                {rupees(item.lineTotal)}
                                                            </b>
                                                        </p>
                                                    ))}
                                                </div>

                                                <div
                                                    className="ko-panel"
                                                    style={{ "--i": 1 }}
                                                >
                                                    <h4>Ship to</h4>

                                                    <p>
                                                        {a.fullName}, {a.phone}
                                                        <br />
                                                        {a.addressLine1},{" "}
                                                        {a.addressLine2}
                                                        <br />
                                                        {a.city}, {a.state}{" "}
                                                        {a.postalCode}
                                                    </p>
                                                </div>

                                                <div
                                                    className="ko-panel"
                                                    style={{ "--i": 2 }}
                                                >
                                                    <h4>History</h4>

                                                    {o.statusHistory?.map(
                                                        (h, k) => (
                                                            <p
                                                                key={k}
                                                                className="ko-hist"
                                                            >
                                                                <i />
                                                                <span>
                                                                    <b>{h.status}</b>
                                                                    {h.note
                                                                        ? `: ${h.note}`
                                                                        : ""}
                                                                </span>
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {o.status === "processing" && (
                                                <div className="ko-track">
                                                    <input
                                                        placeholder="Courier"
                                                        value={track.carrier}
                                                        onChange={(e) =>
                                                            setTrack({
                                                                ...track,
                                                                carrier: e.target.value,
                                                            })
                                                        }
                                                    />

                                                    <input
                                                        placeholder="Tracking number"
                                                        value={track.trackingNumber}
                                                        onChange={(e) =>
                                                            setTrack({
                                                                ...track,
                                                                trackingNumber: e.target.value,
                                                            })
                                                        }
                                                    />

                                                    <input
                                                        placeholder="Tracking link (https://…)"
                                                        value={track.trackingUrl}
                                                        onChange={(e) =>
                                                            setTrack({
                                                                ...track,
                                                                trackingUrl: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div className="ko-actions">
                                                {(NEXT[o.status] || []).map(
                                                    (n) => (
                                                        <button
                                                            key={n}
                                                            className={
                                                                n === "cancelled"
                                                                    ? "ko-ghost ko-danger"
                                                                    : "ko-btn"
                                                            }
                                                            onClick={() =>
                                                                move(o, n)
                                                            }
                                                        >
                                                            <span>
                                                                Mark {n}
                                                            </span>
                                                        </button>
                                                    )
                                                )}

                                                {o.paymentMethod === "cod" &&
                                                    o.status === "delivered" &&
                                                    o.paymentStatus === "pending" && (
                                                        <button
                                                            className="ko-btn"
                                                            onClick={() =>
                                                                run(() =>
                                                                    collectCod(o)
                                                                )
                                                            }
                                                        >
                                                            <span>
                                                                Mark COD collected
                                                            </span>
                                                        </button>
                                                    )}

                                                {canDelete(o) && (
                                                    <button
                                                        type="button"
                                                        className="ko-delete-btn"
                                                        onClick={() =>
                                                            handleDelete(o)
                                                        }
                                                    >
                                                        <span>Delete Order</span>
                                                        <i>✕</i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Payments() {
    const [orders, setOrders] = useState([]);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(true);

    const load = () =>
        api("/orders/admin?limit=100")
            .then((r) => setOrders(r.orders))
            .catch((e) => setMsg(e.message))
            .finally(() => setLoading(false));

    useEffect(() => {
        load();
    }, []);

    const live = orders.filter((o) => o.status !== "cancelled");

    const sum = (list) =>
        list.reduce((a, o) => a + o.totalAmount, 0);

    const paid = sum(
        live.filter((o) => o.paymentStatus === "paid")
    );

    const waiting = sum(
        live.filter((o) => o.paymentStatus === "pending")
    );

    const pct =
        paid + waiting > 0
            ? Math.round((paid / (paid + waiting)) * 100)
            : 0;

    const R = 46;
    const C = 2 * Math.PI * R;

    return (
        <div className="ko-page">
            <Backdrop />

            <div className="ko-inner">
                <header className="ko-head">
                    <div>
                        <small className="ko-eyebrow">✦ Sales</small>
                        <h2>Payments</h2>
                    </div>
                </header>

                <div className="ko-paygrid">
                    <div className="ko-stat ko-big" style={{ "--i": 0 }}>
                        <span className="ko-sheen" />
                        <strong>
                            <CountUp value={paid} format={rupees} />
                        </strong>
                        <small>Collected</small>
                    </div>

                    <div className="ko-stat ko-big" style={{ "--i": 1 }}>
                        <span className="ko-sheen" />
                        <strong>
                            <CountUp value={waiting} format={rupees} />
                        </strong>
                        <small>Waiting to be collected</small>
                    </div>

                    <div className="ko-stat ko-ring" style={{ "--i": 2 }}>
                        <svg viewBox="0 0 120 120" aria-hidden="true">
                            <circle className="bg" cx="60" cy="60" r={R} />
                            <circle
                                className="fg"
                                cx="60"
                                cy="60"
                                r={R}
                                style={{
                                    strokeDasharray: C,
                                    strokeDashoffset: C * (1 - pct / 100),
                                }}
                            />
                        </svg>

                        <div>
                            <strong>
                                <CountUp value={pct} />%
                            </strong>
                            <small>collected</small>
                        </div>
                    </div>
                </div>

                {msg && (
                    <p className="ko-error" role="alert">
                        {msg}
                    </p>
                )}

                <h3 className="ko-sub">Latest 100 orders</h3>

                {loading ? (
                    <div className="ko-list">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="ko-skel"
                                style={{ "--i": i }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="ko-glass ko-tablewrap">
                        <table className="ko-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Order status</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.map((o, i) => (
                                    <tr
                                        key={o._id}
                                        style={{ "--i": Math.min(i, 14) }}
                                    >
                                        <td>{o.orderNumber}</td>
                                        <td>{o.paymentMethod?.toUpperCase()}</td>
                                        <td>{rupees(o.totalAmount)}</td>
                                        <td>
                                            <Badge s={o.paymentStatus} />
                                        </td>
                                        <td>
                                            <Badge s={o.status} />
                                        </td>
                                        <td>
                                            {o.paymentMethod === "cod" &&
                                                o.status === "delivered" &&
                                                o.paymentStatus === "pending" && (
                                                    <button
                                                        className="ko-link"
                                                        onClick={async () => {
                                                            try {
                                                                await collectCod(o);
                                                                load();
                                                            } catch (e) {
                                                                setMsg(e.message);
                                                            }
                                                        }}
                                                    >
                                                        Mark collected
                                                    </button>
                                                )}
                                        </td>
                                    </tr>
                                ))}

                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="ko-muted">
                                            No payments yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
