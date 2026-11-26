import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import { rupees } from "../common.jsx";
import "./Collections.css";

const empty = { name: "", description: "", displayOrder: 0 };
const FILTERS = ["all", "active", "inactive"];
const SPARKS = [
    { l: "6%", t: "8%", d: 0 }, { l: "94%", t: "14%", d: 1.2 },
    { l: "88%", t: "86%", d: 2 }, { l: "10%", t: "92%", d: .8 },
];

/* ---------- icons ---------- */
const Ico = ({ children }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const EyeIcon = () => <Ico><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Ico>;
const EditIcon = () => <Ico><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></Ico>;
const TrashIcon = () => <Ico><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></Ico>;

/* number that counts up when it appears */
function CountUp({ value }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        let raf, start;
        const tick = (t) => {
            start ??= t;
            const k = Math.min((t - start) / 900, 1);
            setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
            if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <>{n}</>;
}

/* the three icon buttons: view / edit / delete */
function Actions({ c, onView, onEdit, onDelete }) {
    return (
        <div className="ksc-icons">
            <button type="button" className="ksc-ibtn" title="View products" aria-label={`View products in ${c.name}`} onClick={() => onView(c)}><EyeIcon /></button>
            <button type="button" className="ksc-ibtn" title="Edit" aria-label={`Edit ${c.name}`} onClick={() => onEdit(c)}><EditIcon /></button>
            <button type="button" className="ksc-ibtn ksc-ibtn-danger" title="Delete" aria-label={`Delete ${c.name}`} onClick={() => onDelete(c)}><TrashIcon /></button>
        </div>
    );
}

/* 3D tilt + glare card (writes CSS variables, so no React re-render on mouse move) */
function CollectionCard({ c, i, onToggle, onView, onEdit, onDelete }) {
    const ref = useRef(null);
    const on = c.status === "active";

    const move = (e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const s = ref.current.style;
        s.setProperty("--ry", `${(x - 0.5) * 16}deg`);
        s.setProperty("--rx", `${(y - 0.5) * -16}deg`);
        s.setProperty("--mx", `${x * 100}%`);
        s.setProperty("--my", `${y * 100}%`);
    };
    const leave = () => {
        const s = ref.current?.style;
        if (!s) return;
        s.setProperty("--ry", "0deg");
        s.setProperty("--rx", "0deg");
    };

    return (
        <div className="ksc-card-wrap" style={{ "--i": i }}>
            <article ref={ref} className={`ksc-card ${on ? "is-on" : "is-off"}`} onPointerMove={move} onPointerLeave={leave}>
                <span className="ksc-glare" />
                <div className="ksc-cardTop">
                    <span className="ksc-order">{String(c.displayOrder).padStart(2, "0")}</span>
                    <span className={`ksc-status ${on ? "ksc-s-active" : "ksc-s-inactive"}`}>
                        <i /> {on ? "In store" : "Hidden"}
                    </span>
                </div>
                <h3>{c.name}</h3>
                <p className="ksc-desc">{c.description || "No description added yet."}</p>
                <div className="ksc-cardFoot">
                    <small className="ksc-slug">/{c.slug}</small>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={on ? `Hide ${c.name} from store` : `Show ${c.name} in store`}
                        className={`ksc-switch ${on ? "on" : ""}`}
                        onClick={() => onToggle(c)}
                    >
                        <span className="ksc-switchTrack"><i /></span>
                        <span className="ksc-switchLabel">{on ? "Visible" : "Hidden"}</span>
                    </button>
                </div>
                <Actions c={c} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </article>
        </div>
    );
}

export default function Collections() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState(empty);
    const [editId, setEditId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState("all");
    const [view, setView] = useState("cards");
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState("");
    const [viewing, setViewing] = useState(null);       // collection whose products are shown
    const [viewProducts, setViewProducts] = useState([]);
    const [viewLoading, setViewLoading] = useState(false);
    const pageRef = useRef(null);
    const toastTimer = useRef(null);

    const load = () =>
        api("/collections")
            .then((r) => setList(r.collections))
            .catch((e) => setMessage(e.message))
            .finally(() => setLoading(false));

    useEffect(() => { load(); return () => clearTimeout(toastTimer.current); }, []);

    const say = (t) => {
        setToast(t);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 2400);
    };

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    /* soft spotlight that follows the mouse across the page */
    const spot = (e) => {
        if (e.pointerType !== "mouse" || !pageRef.current) return;
        const r = pageRef.current.getBoundingClientRect();
        pageRef.current.style.setProperty("--px", `${e.clientX - r.left}px`);
        pageRef.current.style.setProperty("--py", `${e.clientY - r.top}px`);
    };

    const closeForm = () => { setShowForm(false); setForm(empty); setEditId(null); setMessage(""); };

    const openAdd = () => {
        if (showForm && !editId) return closeForm();
        setEditId(null); setForm(empty); setMessage(""); setShowForm(true);
    };

    const startEdit = (c) => {
        setEditId(c._id);
        setForm({ name: c.name, description: c.description || "", displayOrder: c.displayOrder ?? 0 });
        setMessage("");
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const save = async (e) => {
        e.preventDefault();
        setMessage("");
        setSaving(true);
        const body = { ...form, displayOrder: Number(form.displayOrder) || 0 };
        try {
            if (editId) {
                await api(`/collections/${editId}`, { method: "PATCH", body });
                say("Collection updated");
            } else {
                await api("/collections", { method: "POST", body });
                say("Collection added");
            }
            closeForm();
            load();
        } catch (err) {
            setMessage(err.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async (c) => {
        if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
        try {
            await api(`/collections/${c._id}`, { method: "DELETE" });
            setList((l) => l.filter((x) => x._id !== c._id));
            if (viewing?._id === c._id) setViewing(null);
            if (editId === c._id) closeForm();
            say("Collection deleted");
        } catch (err) {
            setMessage(err.message);
        }
    };

    /* show the products that belong to a collection */
    const openView = async (c) => {
        setViewing(c);
        setViewProducts([]);
        setViewLoading(true);
        try {
            const r = await api("/products?limit=100");
            setViewProducts((r.products || []).filter((p) => (p.collection?._id || p.collection) === c._id));
        } catch (err) {
            setMessage(err.message);
        } finally {
            setViewLoading(false);
        }
    };

    /* updates the screen instantly, then confirms with the server (undo if it fails) */
    const toggle = async (c) => {
        const next = c.status === "active" ? "inactive" : "active";
        setList((l) => l.map((x) => (x._id === c._id ? { ...x, status: next } : x)));
        try {
            await api(`/collections/${c._id}`, { method: "PATCH", body: { status: next } });
            say(next === "active" ? `${c.name} is now in the store` : `${c.name} is hidden from the store`);
        } catch (err) {
            setList((l) => l.map((x) => (x._id === c._id ? { ...x, status: c.status } : x)));
            setMessage(err.message);
        }
    };

    const stats = useMemo(() => ({
        total: list.length,
        active: list.filter((c) => c.status === "active").length,
        hidden: list.filter((c) => c.status !== "active").length,
    }), [list]);

    const shown = list.filter((c) => filter === "all" || c.status === filter);

    const tiles = [
        ["Total", stats.total, "all"],
        ["In store", stats.active, "active"],
        ["Hidden", stats.hidden, "inactive"],
    ];

    return (
        <div className="ksc-page" ref={pageRef} onPointerMove={spot}>
            <div className="ksc-spot" />
            <div className="ksc-orb ksc-orb-a" /><div className="ksc-orb ksc-orb-b" />
            <div className="ksc-pattern" />
            {SPARKS.map((s, i) => (
                <i key={i} className="ksc-spark" style={{ left: s.l, top: s.t, animationDelay: `${s.d}s` }}>✦</i>
            ))}

            <div className="ksc-inner">
                <header className="ksc-head">
                    <div>
                        <small className="ksc-eyebrow">✦ Catalogue</small>
                        <h2>Collections</h2>
                    </div>
                    <button type="button" className={`ksc-btn ksc-btn-sm ${showForm ? "is-open" : ""}`} onClick={openAdd}>
                        <span><b className="ksc-plus">+</b> {showForm ? "Close" : "Add collection"}</span>
                    </button>
                </header>

                <div className="ksc-stats">
                    {tiles.map(([l, n, f], i) => (
                        <button
                            key={l}
                            type="button"
                            className={`ksc-stat ${filter === f ? "on" : ""}`}
                            style={{ "--i": i }}
                            onClick={() => setFilter(f)}
                            aria-pressed={filter === f}
                        >
                            <span className="ksc-sheen" />
                            <strong><CountUp value={n} /></strong>
                            <small>{l}</small>
                        </button>
                    ))}
                </div>

                <div className={`ksc-formWrap ${showForm ? "open" : ""}`}>
                    <div className="ksc-formInner">
                        <form className="ksc-glass ksc-form" onSubmit={save}>
                            <span className="ksc-sheen" />
                            <label className="ksc-f">Name
                                <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
                            </label>
                            <label className="ksc-f">Display order
                                <input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", e.target.value)} />
                            </label>
                            <label className="ksc-f ksc-span">Description
                                <input value={form.description} onChange={(e) => set("description", e.target.value)} />
                            </label>
                            <div className="ksc-span ksc-actions">
                                <button className="ksc-btn" disabled={saving}>
                                    <span>{saving ? "Saving…" : editId ? "Save changes" : "Add collection"}</span>
                                </button>
                                <button type="button" className="ksc-ghost" onClick={closeForm}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>

                {message && <p className="ksc-error" role="alert">{message}</p>}

                <div className="ksc-toolbar">
                    <div className="ksc-filters">
                        {FILTERS.map((f) => (
                            <button key={f} type="button" className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>
                        ))}
                    </div>
                    <div className="ksc-viewtoggle" role="group" aria-label="View">
                        <button type="button" className={view === "cards" ? "on" : ""} onClick={() => setView("cards")}>Cards</button>
                        <button type="button" className={view === "table" ? "on" : ""} onClick={() => setView("table")}>Table</button>
                    </div>
                </div>

                {loading ? (
                    <div className="ksc-grid">
                        {[0, 1, 2, 3].map((i) => <div key={i} className="ksc-skel" style={{ "--i": i }} />)}
                    </div>
                ) : shown.length === 0 ? (
                    <div className="ksc-empty ksc-glass">
                        <span className="ksc-emptyIcon">✦</span>
                        <p>{list.length === 0 ? "No collections yet. Add your first one." : "Nothing matches this filter."}</p>
                    </div>
                ) : view === "cards" ? (
                    <div className="ksc-grid">
                        {shown.map((c, i) => (
                            <CollectionCard key={c._id} c={c} i={i} onToggle={toggle} onView={openView} onEdit={startEdit} onDelete={remove} />
                        ))}
                    </div>
                ) : (
                    <div className="ksc-glass ksc-tablewrap">
                        <table className="ksc-table">
                            <thead><tr><th>Name</th><th>Slug</th><th>Order</th><th>Status</th><th></th></tr></thead>
                            <tbody>
                                {shown.map((c, i) => {
                                    const on = c.status === "active";
                                    return (
                                        <tr key={c._id} style={{ "--i": i }}>
                                            <td>{c.name}<br /><small className="ksc-muted">{c.description}</small></td>
                                            <td>{c.slug}</td>
                                            <td>{c.displayOrder}</td>
                                            <td>
                                                <button type="button" className="ksc-linkplain" onClick={() => toggle(c)} title={on ? "Hide from store" : "Show in store"}>
                                                    <span className={`ksc-status ${on ? "ksc-s-active" : "ksc-s-inactive"}`}><i /> {on ? "In store" : "Hidden"}</span>
                                                </button>
                                            </td>
                                            <td className="ksc-rowact">
                                                <Actions c={c} onView={openView} onEdit={startEdit} onDelete={remove} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* products-in-collection panel */}
            {viewing && (
                <div className="ksc-modal" role="dialog" aria-modal="true" aria-label={`Products in ${viewing.name}`} onClick={() => setViewing(null)}>
                    <div className="ksc-modalBox ksc-glass" onClick={(e) => e.stopPropagation()}>
                        <div className="ksc-modalHead">
                            <div>
                                <small className="ksc-eyebrow">✦ Collection</small>
                                <h3>{viewing.name}</h3>
                            </div>
                            <button type="button" className="ksc-ibtn" aria-label="Close" onClick={() => setViewing(null)}>×</button>
                        </div>
                        {viewLoading ? (
                            <p className="ksc-muted">Loading products…</p>
                        ) : viewProducts.length === 0 ? (
                            <p className="ksc-muted">No products in this collection yet.</p>
                        ) : (
                            <ul className="ksc-plist">
                                {viewProducts.map((p) => (
                                    <li key={p._id}>
                                        {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" /> : <span className="ksc-pthumb" />}
                                        <div>
                                            <b>{p.name}</b>
                                            <small className="ksc-muted">{p.sku} · {p.status}</small>
                                        </div>
                                        <strong>{rupees(p.price)}</strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <div className={`ksc-toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
        </div>
    );
}
