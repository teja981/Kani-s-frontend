import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { LOW_STOCK } from "../common.jsx";
import "./Inventory.css";

const SPARKS = [
    { l: "6%", t: "8%", d: 0 }, { l: "94%", t: "14%", d: 1.2 },
    { l: "88%", t: "86%", d: 2 }, { l: "10%", t: "92%", d: .8 },
];

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

/* shown when a product has no photo */
function Garment() {
    return (
        <svg viewBox="0 0 200 330" aria-hidden="true">
            <defs>
                <linearGradient id="ki-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#23a06f" /><stop offset="1" stopColor="#0d402f" />
                </linearGradient>
            </defs>
            <path d="M72 14 Q100 40 128 14 L142 112 Q100 128 58 112 Z" fill="url(#ki-g)" />
            <path d="M58 112 Q100 128 142 112 L192 308 Q100 332 8 308 Z" fill="url(#ki-g)" />
            <path d="M8 308 Q100 332 192 308" stroke="#e0b75f" strokeWidth="7" fill="none" />
        </svg>
    );
}

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [lowOnly, setLowOnly] = useState(false);
    const [edits, setEdits] = useState({});
    const [msg, setMsg] = useState("");
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [savedId, setSavedId] = useState(null);

    const load = () =>
        api("/products?limit=50&status=active")
            .then((r) => setProducts(r.products))
            .catch((e) => setMsg(e.message))
            .finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const save = async (p, v) => {
        setMsg("");
        setSavingId(v._id);
        try {
            await api(`/products/${p._id}/variants/${v._id}/stock`, { method: "PATCH", body: { stock: Number(edits[v._id]) } });
            setEdits((e) => { const n = { ...e }; delete n[v._id]; return n; });
            setSavedId(v._id);
            setTimeout(() => setSavedId((id) => (id === v._id ? null : id)), 1600);
            load();
        } catch (err) { setMsg(err.message); }
        finally { setSavingId(null); }
    };

    /* + / − buttons */
    const step = (v, d) => {
        const cur = edits[v._id] === undefined || edits[v._id] === "" ? v.stock : Number(edits[v._id]);
        setEdits({ ...edits, [v._id]: String(Math.max(0, cur + d)) });
    };
    const reset = (v) => setEdits((e) => { const n = { ...e }; delete n[v._id]; return n; });

    const stats = useMemo(() => {
        const all = products.flatMap((p) => p.variants);
        return {
            variants: all.length,
            units: all.reduce((a, v) => a + v.stock, 0),
            low: all.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK).length,
            out: all.filter((v) => v.stock === 0).length,
        };
    }, [products]);

    const term = q.trim().toLowerCase();
    const groups = products
        .map((p) => ({
            p,
            vs: p.variants.filter((v) => (!lowOnly || v.stock <= LOW_STOCK)
                && (!term || p.name.toLowerCase().includes(term) || (v.sku || "").toLowerCase().includes(term))),
        }))
        .filter((g) => g.vs.length);

    const cap = Math.max(20, LOW_STOCK * 4); // stock level that fills the bar

    return (
        <div className="ki-page">
            <div className="ki-orb ki-orb-a" /><div className="ki-orb ki-orb-b" />
            <div className="ki-pattern" />
            {SPARKS.map((s, i) => (
                <i key={i} className="ki-spark" style={{ left: s.l, top: s.t, animationDelay: `${s.d}s` }}>✦</i>
            ))}

            <div className="ki-inner">
                <header className="ki-head">
                    <small className="ki-eyebrow">✦ Stock</small>
                    <h2>Inventory</h2>
                </header>

                <div className="ki-stats">
                    {[["Variants", stats.variants, ""], ["Units in stock", stats.units, ""], ["Low stock", stats.low, "warn"], ["Out of stock", stats.out, "bad"]].map(([l, n, c], i) => (
                        <div key={l} className={`ki-stat ${c}`} style={{ "--i": i }}>
                            <span className="ki-sheen" />
                            <strong><CountUp value={n} /></strong>
                            <small>{l}</small>
                        </div>
                    ))}
                </div>

                <div className="ki-toolbar">
                    <label className="ki-search">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
                        <input placeholder="Search product or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
                    </label>
                    <label className="ki-switch">
                        <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
                        <span className="ki-track"><i /></span>
                        Show only low stock ({LOW_STOCK} or fewer)
                    </label>
                </div>

                {msg && <p className="ki-error" role="alert">{msg}</p>}

                {loading ? (
                    <div className="ki-list">{[0, 1, 2].map((i) => <div key={i} className="ki-skel" style={{ "--i": i }} />)}</div>
                ) : groups.length === 0 ? (
                    <div className="ki-empty ki-glass">
                        <div className="ki-emptyIcon"><Garment /></div>
                        <p>Nothing to show. Active products with stock appear here.</p>
                    </div>
                ) : (
                    <div className="ki-list">
                        {groups.map(({ p, vs }, gi) => {
                            const total = p.variants.reduce((a, v) => a + v.stock, 0);
                            const img = p.images?.[0]?.url;
                            return (
                                <section key={p._id} className="ki-prod ki-glass" style={{ "--i": gi }}>
                                    <span className="ki-sheen" />
                                    <div className="ki-phead">
                                        <div className="ki-pimg">{img ? <img src={img} alt="" loading="lazy" /> : <Garment />}</div>
                                        <div className="ki-pname">
                                            <h3>{p.name}</h3>
                                            <small>{p.variants.length} variant{p.variants.length === 1 ? "" : "s"}</small>
                                        </div>
                                        <div className="ki-ptotal"><strong>{total}</strong><small>total units</small></div>
                                    </div>

                                    <div className="ki-vlist">
                                        <div className="ki-vhead"><span>Variant</span><span>Stock level</span><span>Set stock to</span></div>
                                        {vs.map((v, vi) => {
                                            const out = v.stock === 0;
                                            const low = !out && v.stock <= LOW_STOCK;
                                            const raw = edits[v._id];
                                            const dirty = raw !== undefined && raw !== "";
                                            return (
                                                <div key={v._id} className={`ki-v ${dirty ? "dirty" : ""} ${savedId === v._id ? "saved" : ""}`} style={{ "--j": vi }}>
                                                    <div className="ki-vinfo">
                                                        <b>{v.size} / {v.color}</b>
                                                        <small>{v.sku}</small>
                                                    </div>

                                                    <div className="ki-level">
                                                        <div className="ki-bar">
                                                            <i className={out ? "out" : low ? "low" : ""} style={{ width: `${Math.min(100, (v.stock / cap) * 100)}%` }} />
                                                        </div>
                                                        <span className={`ki-pill ${out ? "out" : low ? "low" : "ok"}`}>
                                                            {out ? "Out" : low ? `Low · ${v.stock}` : v.stock}
                                                        </span>
                                                    </div>

                                                    <div className="ki-edit">
                                                        <div className="ki-stepper">
                                                            <button type="button" aria-label="Decrease" onClick={() => step(v, -1)}>−</button>
                                                            <input type="number" min="0" value={raw ?? ""} placeholder={v.stock}
                                                                onChange={(e) => setEdits({ ...edits, [v._id]: e.target.value })}
                                                                aria-label={`Set stock for ${v.size} ${v.color}`} />
                                                            <button type="button" aria-label="Increase" onClick={() => step(v, 1)}>+</button>
                                                        </div>
                                                        <button className="ki-save" disabled={!dirty || savingId === v._id} onClick={() => save(p, v)}>
                                                            {savingId === v._id ? "…" : savedId === v._id ? "✓ Saved" : "Save"}
                                                        </button>
                                                        <button type="button" className={`ki-undo ${raw !== undefined ? "show" : ""}`} aria-label="Cancel change"
                                                            tabIndex={raw !== undefined ? 0 : -1} onClick={() => reset(v)}>×</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
