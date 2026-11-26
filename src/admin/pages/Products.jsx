
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import { rupees } from "../common.jsx";
import "./Products.css";

const blank = {
    name: "", sku: "", collection: "", price: "", compareAtPrice: "", shortDescription: "",
    description: "", material: "", fabric: "", status: "draft", featured: false,
    variants: [{ size: "", color: "", stock: 0 }],
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free"];

const STATUSES = [
    ["draft", "Draft", "Hidden"],
    ["active", "Active", "In store"],
    ["archived", "Archived", "Removed"],
];

const FILTERS = ["all", "active", "draft", "archived"];

const SPARKS = [
    { l: "6%", t: "8%", d: 0 },
    { l: "94%", t: "14%", d: 1.2 },
    { l: "88%", t: "86%", d: 2 },
    { l: "10%", t: "92%", d: .8 },
];

const stockOf = (p) =>
    (p.variants || []).reduce(
        (a, v) => a + (Number(v.stock) || 0),
        0
    );

/* ---------- icons ---------- */

const Ico = ({ children, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const ViewIcon = () => (
    <Ico>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
    </Ico>
);

const EditIcon = () => (
    <Ico>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </Ico>
);

const TrashIcon = () => (
    <Ico>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
    </Ico>
);

/* number that counts up when it appears */

function CountUp({ value }) {
    const [n, setN] = useState(0);

    useEffect(() => {
        let raf, start;

        const tick = (t) => {
            start ??= t;

            const k = Math.min((t - start) / 900, 1);

            setN(
                Math.round(value * (1 - Math.pow(1 - k, 3)))
            );

            if (k < 1) {
                raf = requestAnimationFrame(tick);
            }
        };

        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
    }, [value]);

    return <>{n}</>;
}

/* shown when a product has no photo */

function Garment() {
    return (
        <svg
            viewBox="0 0 200 330"
            aria-hidden="true"
            className="kp-garment"
        >
            <defs>
                <linearGradient id="kp-g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#23a06f" />
                    <stop offset="1" stopColor="#0d402f" />
                </linearGradient>

                <linearGradient id="kp-au" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#f3d98b" />
                    <stop offset=".5" stopColor="#d8a33d" />
                    <stop offset="1" stopColor="#f3d98b" />
                </linearGradient>
            </defs>

            <path
                d="M72 14 Q100 40 128 14 L142 112 Q100 128 58 112 Z"
                fill="url(#kp-g)"
            />

            <path
                d="M58 112 Q100 128 142 112 L192 308 Q100 332 8 308 Z"
                fill="url(#kp-g)"
            />

            <path
                d="M58 112 Q100 128 142 112"
                stroke="url(#kp-au)"
                strokeWidth="6"
                fill="none"
            />

            <path
                d="M8 308 Q100 332 192 308"
                stroke="url(#kp-au)"
                strokeWidth="7"
                fill="none"
            />
        </svg>
    );
}

/* 3D tilt + glare card */

function ProductCard({
    p,
    i,
    onView,
    onEdit,
    onArchive,
    onDelete,
}) {
    const ref = useRef(null);

    const stock = stockOf(p);
    const low = stock > 0 && stock <= 5;

    const img1 = p.images?.[0]?.url;
    const img2 = p.images?.[1]?.url;

    const off =
        p.compareAtPrice && p.compareAtPrice > p.price
            ? Math.round(
                ((p.compareAtPrice - p.price) / p.compareAtPrice) * 100
            )
            : 0;

    const move = (e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;

        const r = ref.current.getBoundingClientRect();

        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;

        const s = ref.current.style;

        s.setProperty("--ry", `${(x - 0.5) * 14}deg`);
        s.setProperty("--rx", `${(y - 0.5) * -14}deg`);
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
        <div className="kp-card-wrap" style={{ "--i": i }}>
            <article
                ref={ref}
                className={`kp-card ${p.status}`}
                onPointerMove={move}
                onPointerLeave={leave}
            >
                <span className="kp-glare" />

                <div className="kp-media">
                    {img1 ? (
                        <>
                            <img
                                className="kp-img kp-img-a"
                                src={img1}
                                alt={p.name}
                                loading="lazy"
                            />

                            {img2 && (
                                <img
                                    className="kp-img kp-img-b"
                                    src={img2}
                                    alt=""
                                    loading="lazy"
                                />
                            )}
                        </>
                    ) : (
                        <div className="kp-noimg">
                            <Garment />
                        </div>
                    )}

                    <div className="kp-badges">
                        {p.featured && (
                            <span className="kp-chip kp-gold">
                                ✦ Featured
                            </span>
                        )}

                        {off > 0 && (
                            <span className="kp-chip kp-red">
                                {off}% off
                            </span>
                        )}
                    </div>

                    <span className={`kp-status kp-s-${p.status}`}>
                        {p.status}
                    </span>

                    <div className="kp-quick">
                        <button
                            type="button"
                            className="kp-iconbtn kp-view"
                            title="View"
                            aria-label={`View ${p.name}`}
                            onClick={() => onView(p)}
                        >
                            <ViewIcon />
                        </button>

                        <button
                            type="button"
                            className="kp-iconbtn"
                            title="Edit"
                            aria-label={`Edit ${p.name}`}
                            onClick={() => onEdit(p)}
                        >
                            <EditIcon />
                        </button>

                        {p.status !== "archived" && (
                            <button
                                type="button"
                                className="kp-iconbtn"
                                title="Archive product"
                                aria-label={`Archive ${p.name}`}
                                onClick={() => onArchive(p)}
                            >
                                <TrashIcon />
                            </button>
                        )}

                        <button
                            type="button"
                            className="kp-iconbtn kp-danger"
                            title="Delete permanently"
                            aria-label={`Delete ${p.name} permanently`}
                            onClick={() => onDelete(p)}
                        >
                            <TrashIcon />
                        </button>
                    </div>
                </div>

                <div className="kp-body">
                    <small className="kp-coll">
                        {p.collection?.name || "No collection"}
                    </small>

                    <h3>{p.name}</h3>

                    <div className="kp-priceRow">
                        <strong>{rupees(p.price)}</strong>

                        {off > 0 && (
                            <s>{rupees(p.compareAtPrice)}</s>
                        )}
                    </div>

                    <div className="kp-stock">
                        <div className="kp-bar">
                            <i
                                style={{
                                    width: `${Math.min(100, stock * 4)}%`,
                                }}
                                className={
                                    stock === 0
                                        ? "out"
                                        : low
                                            ? "low"
                                            : ""
                                }
                            />
                        </div>

                        <span
                            className={
                                stock === 0
                                    ? "out"
                                    : low
                                        ? "low"
                                        : ""
                            }
                        >
                            {stock === 0
                                ? "Out of stock"
                                : low
                                    ? `Only ${stock} left`
                                    : `${stock} in stock`}
                        </span>
                    </div>

                    <small className="kp-sku">{p.sku}</small>
                </div>
            </article>
        </div>
    );
}

export default function Products() {
    const [products, setProducts] = useState([]);
    const [cols, setCols] = useState([]);

    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);

    const [files, setFiles] = useState([]);
    const [search, setSearch] = useState("");
    const [msg, setMsg] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [view, setView] = useState("cards");
    const [filter, setFilter] = useState("all");

    const [nv, setNv] = useState({
        size: "",
        color: "",
        stock: "",
    });

    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const [previewProduct, setPreviewProduct] = useState(null);

    /* Load products */

    const load = () => {
        setLoading(true);

        return api(
            `/products?limit=50&search=${encodeURIComponent(search)}`
        )
            .then((r) => setProducts(r.products))
            .catch((e) => setMsg(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();

        api("/collections")
            .then((r) => setCols(r.collections))
            .catch(() => { });
    }, []);

    /* local previews for newly chosen images */

    const previews = useMemo(
        () => files.map((f) => URL.createObjectURL(f)),
        [files]
    );

    useEffect(
        () => () => previews.forEach((u) => URL.revokeObjectURL(u)),
        [previews]
    );

    const set = (k, v) =>
        setForm((f) => ({
            ...f,
            [k]: v,
        }));

    const setVar = (i, k, v) =>
        setForm((f) => ({
            ...f,
            variants: f.variants.map((x, j) =>
                j === i
                    ? { ...x, [k]: v }
                    : x
            ),
        }));

    const startNew = () => {
        setEditId(null);
        setFiles([]);
        setMsg("");
        setForm(blank);
    };

    const startEdit = (p) => {
        setEditId(p._id);
        setFiles([]);
        setMsg("");

        setNv({
            size: "",
            color: p.variants?.[0]?.color || "",
            stock: "",
        });

        setForm({
            name: p.name,
            sku: p.sku,
            collection: p.collection?._id || "",
            price: p.price,
            compareAtPrice: p.compareAtPrice ?? "",
            shortDescription: p.shortDescription || "",
            description: p.description || "",
            material: p.material || "",
            fabric: p.fabric || "",
            status: p.status,
            featured: !!p.featured,
            variants: p.variants,
        });
    };

    /* add a new size to an existing product */

    const addVariant = async () => {
        setMsg("");

        if (!nv.size.trim() || !nv.color.trim()) {
            setMsg("Enter a size and colour for the new variant.");
            return;
        }

        setAdding(true);

        try {
            const r = await api(`/products/${editId}/variants`, {
                method: "POST",
                body: {
                    size: nv.size,
                    color: nv.color,
                    stock: Number(nv.stock) || 0,
                },
            });

            set("variants", r.product.variants);

            setNv({
                ...nv,
                size: "",
                stock: "",
            });

            load();
        } catch (err) {
            setMsg(err.message);
        } finally {
            setAdding(false);
        }
    };

    const onNvEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addVariant();
        }
    };

    /* remove an existing size/variant from a product */

    const removeVariant = async (v) => {
        setMsg("");

        if (form.variants.length <= 1) {
            setMsg(
                "A product needs at least one variant. Add another size before removing this one."
            );
            return;
        }

        if (!window.confirm(`Remove size ${v.size} / ${v.color}?`)) {
            return;
        }

        setRemovingId(v._id);

        try {
            const r = await api(
                `/products/${editId}/variants/${v._id}`,
                { method: "DELETE" }
            );

            set(
                "variants",
                r?.product?.variants ||
                form.variants.filter((x) => x._id !== v._id)
            );

            load();
        } catch (err) {
            setMsg(err.message);
        } finally {
            setRemovingId(null);
        }
    };

    /* Save product */

    const save = async (e) => {
        e.preventDefault();

        setMsg("");
        setSaving(true);

        const body = {
            ...form,
            price: Number(form.price),
            compareAtPrice:
                form.compareAtPrice === ""
                    ? null
                    : Number(form.compareAtPrice),
        };

        try {
            let id = editId;

            if (editId) {
                delete body.variants;

                await api(`/products/${editId}`, {
                    method: "PATCH",
                    body,
                });
            } else {
                body.variants = form.variants.map((v) => ({
                    ...v,
                    stock: Number(v.stock) || 0,
                }));

                id = (
                    await api("/products", {
                        method: "POST",
                        body,
                    })
                ).product._id;
            }

            if (files.length) {
                const fd = new FormData();

                files.forEach((f) => fd.append("images", f));

                await api(`/products/${id}/images`, {
                    method: "POST",
                    body: fd,
                });
            }

            setForm(null);
            load();
        } catch (err) {
            setMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    /* Archive product: keeps it in the database */

    const archive = async (p) => {
        const confirmed = window.confirm(
            `Archive "${p.name}"? It will disappear from the store.`
        );

        if (!confirmed) return;

        setMsg("");

        try {
            await api(`/products/${p._id}/archive`, {
                method: "PATCH",
            });

            setMsg("Product archived successfully.");
            await load();
        } catch (e) {
            setMsg(e.message);
        }
    };

    /* Permanently delete product */

    const deleteProduct = async (p) => {
        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${p.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setMsg("");

        try {
            await api(`/products/${p._id}`, {
                method: "DELETE",
            });

            if (previewProduct?._id === p._id) {
                setPreviewProduct(null);
            }

            setMsg("Product deleted permanently.");
            await load();
        } catch (e) {
            setMsg(e.message);
        }
    };

    /* Statistics */

    const stats = useMemo(
        () => ({
            total: products.length,
            active: products.filter(
                (p) => p.status === "active"
            ).length,
            draft: products.filter(
                (p) => p.status === "draft"
            ).length,
            low: products.filter(
                (p) =>
                    stockOf(p) <= 5 &&
                    p.status !== "archived"
            ).length,
        }),
        [products]
    );

    const shown = products.filter(
        (p) => filter === "all" || p.status === filter
    );

    const Backdrop = () => (
        <>
            <div className="kp-orb kp-orb-a" />
            <div className="kp-orb kp-orb-b" />
            <div className="kp-pattern" />

            {SPARKS.map((s, i) => (
                <i
                    key={i}
                    className="kp-spark"
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

    /* ---------------- FORM ---------------- */

    if (form) {
        return (
            <div className="kp-page">
                <Backdrop />

                <div className="kp-inner">
                    <header className="kp-head">
                        <div>
                            <small className="kp-eyebrow">
                                ✦ Catalogue
                            </small>

                            <h2>
                                {editId ? "Edit product" : "New product"}
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="kp-ghost"
                            onClick={() => {
                                setForm(null);
                                setMsg("");
                            }}
                        >
                            ← Back to products
                        </button>
                    </header>

                    <form
                        className="kp-glass kp-form"
                        onSubmit={save}
                    >
                        <span className="kp-sheen" />

                        <label className="kp-f">
                            Name
                            <input
                                required
                                value={form.name}
                                onChange={(e) =>
                                    set("name", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-f">
                            SKU
                            <input
                                required
                                value={form.sku}
                                onChange={(e) =>
                                    set("sku", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-f">
                            Collection

                            <select
                                required
                                value={form.collection}
                                onChange={(e) =>
                                    set("collection", e.target.value)
                                }
                            >
                                <option value="">
                                    Choose a collection
                                </option>

                                {cols.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="kp-f">
                            Status

                            <div
                                className="kp-seg"
                                role="radiogroup"
                                aria-label="Status"
                            >
                                {STATUSES.map(([v, label, hint]) => (
                                    <button
                                        key={v}
                                        type="button"
                                        role="radio"
                                        aria-checked={form.status === v}
                                        className={
                                            form.status === v ? "on" : ""
                                        }
                                        onClick={() => set("status", v)}
                                    >
                                        <b>{label}</b>
                                        <small>{hint}</small>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="kp-f">
                            Selling price (₹)
                            <input
                                type="number"
                                min="0"
                                required
                                value={form.price}
                                onChange={(e) =>
                                    set("price", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-f">
                            Original price (₹)
                            <input
                                type="number"
                                min="0"
                                value={form.compareAtPrice}
                                onChange={(e) =>
                                    set("compareAtPrice", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-f">
                            Fabric
                            <input
                                value={form.fabric}
                                onChange={(e) =>
                                    set("fabric", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-f">
                            Material
                            <input
                                value={form.material}
                                onChange={(e) =>
                                    set("material", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-f kp-span">
                            Short description
                            <input
                                value={form.shortDescription}
                                onChange={(e) =>
                                    set("shortDescription", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-f kp-span">
                            Description
                            <textarea
                                rows="4"
                                value={form.description}
                                onChange={(e) =>
                                    set("description", e.target.value)
                                }
                            />
                        </label>

                        <label className="kp-switch kp-span">
                            <input
                                type="checkbox"
                                checked={form.featured}
                                onChange={(e) =>
                                    set("featured", e.target.checked)
                                }
                            />

                            <span className="kp-track">
                                <i />
                            </span>

                            Show as featured
                        </label>

                        <div className="kp-span kp-section">
                            <h3>Variants</h3>

                            {editId ? (
                                <>
                                    <div className="kp-vchips">
                                        {form.variants.map((v, i) => (
                                            <span
                                                key={v._id || i}
                                                className="kp-vchip"
                                                style={{ "--i": i }}
                                            >
                                                {v.size} / {v.color}
                                                <b>{v.stock}</b>

                                                <button
                                                    type="button"
                                                    className="kp-vchip-x"
                                                    title="Remove this size"
                                                    aria-label={`Remove size ${v.size} ${v.color}`}
                                                    disabled={
                                                        removingId === v._id
                                                    }
                                                    onClick={() =>
                                                        removeVariant(v)
                                                    }
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    <p className="kp-muted">
                                        Change stock of existing sizes in
                                        Inventory. Use × to remove a size.
                                    </p>

                                    <div className="kp-addsize">
                                        <small className="kp-eyebrow">
                                            ✦ Add a new size
                                        </small>

                                        <div className="kp-sizes">
                                            {SIZES.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    className={
                                                        nv.size === s
                                                            ? "on"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setNv({
                                                            ...nv,
                                                            size: s,
                                                        })
                                                    }
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="kp-vrow">
                                            <input
                                                placeholder="Size"
                                                value={nv.size}
                                                onChange={(e) =>
                                                    setNv({
                                                        ...nv,
                                                        size: e.target.value,
                                                    })
                                                }
                                                onKeyDown={onNvEnter}
                                            />

                                            <input
                                                placeholder="Colour"
                                                value={nv.color}
                                                onChange={(e) =>
                                                    setNv({
                                                        ...nv,
                                                        color: e.target.value,
                                                    })
                                                }
                                                onKeyDown={onNvEnter}
                                            />

                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Stock"
                                                value={nv.stock}
                                                onChange={(e) =>
                                                    setNv({
                                                        ...nv,
                                                        stock: e.target.value,
                                                    })
                                                }
                                                onKeyDown={onNvEnter}
                                            />

                                            <button
                                                type="button"
                                                className="kp-btn kp-btn-sm"
                                                disabled={adding}
                                                onClick={addVariant}
                                            >
                                                <span>
                                                    {adding
                                                        ? "Adding…"
                                                        : "+ Add size"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {form.variants.map((v, i) => (
                                        <div
                                            className="kp-vrow"
                                            key={i}
                                        >
                                            <input
                                                required
                                                placeholder="Size"
                                                value={v.size}
                                                onChange={(e) =>
                                                    setVar(
                                                        i,
                                                        "size",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <input
                                                required
                                                placeholder="Colour"
                                                value={v.color}
                                                onChange={(e) =>
                                                    setVar(
                                                        i,
                                                        "color",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Stock"
                                                value={v.stock}
                                                onChange={(e) =>
                                                    setVar(
                                                        i,
                                                        "stock",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            {form.variants.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="kp-x"
                                                    aria-label="Remove variant"
                                                    onClick={() =>
                                                        set(
                                                            "variants",
                                                            form.variants.filter(
                                                                (_, j) => j !== i
                                                            )
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        className="kp-ghost"
                                        onClick={() =>
                                            set("variants", [
                                                ...form.variants,
                                                {
                                                    size: "",
                                                    color: "",
                                                    stock: 0,
                                                },
                                            ])
                                        }
                                    >
                                        + Add variant
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="kp-span kp-section">
                            <h3>Images</h3>

                            <label className="kp-drop">
                                <span className="kp-dropIcon">✦</span>
                                <b>Choose images</b>
                                <small>
                                    Up to 5, JPEG, PNG, WEBP or AVIF, 8 MB each
                                </small>

                                <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp,image/avif"
                                    onChange={(e) =>
                                        setFiles(
                                            [...e.target.files].slice(0, 5)
                                        )
                                    }
                                />
                            </label>

                            {previews.length > 0 && (
                                <div className="kp-previews">
                                    {previews.map((u, i) => (
                                        <div
                                            key={u}
                                            className="kp-prev"
                                            style={{ "--i": i }}
                                        >
                                            <img src={u} alt="" />

                                            <button
                                                type="button"
                                                aria-label="Remove image"
                                                onClick={() =>
                                                    setFiles(
                                                        files.filter(
                                                            (_, j) => j !== i
                                                        )
                                                    )
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {msg && (
                            <p
                                className="kp-error kp-span"
                                role="alert"
                            >
                                {msg}
                            </p>
                        )}

                        <div className="kp-span kp-actions">
                            <button
                                className="kp-btn"
                                disabled={saving}
                            >
                                <span>
                                    {saving
                                        ? "Saving…"
                                        : "Save product"}
                                </span>
                            </button>

                            <button
                                type="button"
                                className="kp-ghost"
                                onClick={() => {
                                    setForm(null);
                                    setMsg("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    /* ---------------- LIST ---------------- */

    return (
        <div className="kp-page">
            <Backdrop />

            <div className="kp-inner">
                <header className="kp-head">
                    <div>
                        <small className="kp-eyebrow">
                            ✦ Catalogue
                        </small>
                        <h2>Products</h2>
                    </div>

                    <button
                        className="kp-btn kp-btn-sm"
                        onClick={startNew}
                    >
                        <span>+ Add product</span>
                    </button>
                </header>

                <div className="kp-stats">
                    {[
                        ["Total", stats.total],
                        ["Active", stats.active],
                        ["Drafts", stats.draft],
                        ["Low stock", stats.low],
                    ].map(([l, n], i) => (
                        <div
                            key={l}
                            className="kp-stat"
                            style={{ "--i": i }}
                        >
                            <span className="kp-sheen" />
                            <strong>
                                <CountUp value={n} />
                            </strong>
                            <small>{l}</small>
                        </div>
                    ))}
                </div>

                <div className="kp-toolbar">
                    <label className="kp-search">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#e0b75f"
                            strokeWidth="2"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M20 20l-4-4" />
                        </svg>

                        <input
                            placeholder="Search name or SKU, press Enter"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            onKeyDown={(e) =>
                                e.key === "Enter" && load()
                            }
                        />
                    </label>

                    <div className="kp-filters">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={filter === f ? "on" : ""}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div
                        className="kp-viewtoggle"
                        role="group"
                        aria-label="View"
                    >
                        <button
                            type="button"
                            className={view === "cards" ? "on" : ""}
                            onClick={() => setView("cards")}
                        >
                            Cards
                        </button>

                        <button
                            type="button"
                            className={view === "table" ? "on" : ""}
                            onClick={() => setView("table")}
                        >
                            Table
                        </button>
                    </div>
                </div>

                {msg && (
                    <p className="kp-error" role="alert">
                        {msg}
                    </p>
                )}

                {loading ? (
                    <div className="kp-grid">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="kp-skel"
                                style={{ "--i": i }}
                            />
                        ))}
                    </div>
                ) : shown.length === 0 ? (
                    <div className="kp-empty kp-glass">
                        <Garment />

                        <p>
                            {products.length === 0
                                ? "No products yet. Add your first dress."
                                : "Nothing matches this filter."}
                        </p>
                    </div>
                ) : view === "cards" ? (
                    <div className="kp-grid">
                        {shown.map((p, i) => (
                            <ProductCard
                                key={p._id}
                                p={p}
                                i={i}
                                onView={setPreviewProduct}
                                onEdit={startEdit}
                                onArchive={archive}
                                onDelete={deleteProduct}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="kp-glass kp-tablewrap">
                        <table className="kp-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Collection</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {shown.map((p, i) => (
                                    <tr
                                        key={p._id}
                                        style={{ "--i": i }}
                                    >
                                        <td>
                                            {p.images?.[0]?.url ? (
                                                <img
                                                    className="kp-thumb"
                                                    src={p.images[0].url}
                                                    alt=""
                                                />
                                            ) : (
                                                <span className="kp-thumb" />
                                            )}
                                        </td>

                                        <td>
                                            {p.name}
                                            <br />
                                            <small className="kp-muted">
                                                {p.sku}
                                            </small>
                                        </td>

                                        <td>
                                            {p.collection?.name || "–"}
                                        </td>

                                        <td>{rupees(p.price)}</td>

                                        <td>{stockOf(p)}</td>

                                        <td>
                                            <span
                                                className={`kp-status-inline kp-s-${p.status}`}
                                            >
                                                {p.status}
                                            </span>
                                        </td>

                                        <td className="kp-rowact">
                                            <button
                                                type="button"
                                                className="kp-iconbtn kp-view"
                                                title="View"
                                                aria-label={`View ${p.name}`}
                                                onClick={() =>
                                                    setPreviewProduct(p)
                                                }
                                            >
                                                <ViewIcon />
                                            </button>

                                            <button
                                                type="button"
                                                className="kp-iconbtn"
                                                title="Edit"
                                                aria-label={`Edit ${p.name}`}
                                                onClick={() => startEdit(p)}
                                            >
                                                <EditIcon />
                                            </button>

                                            {p.status !== "archived" && (
                                                <button
                                                    type="button"
                                                    className="kp-iconbtn"
                                                    title="Archive product"
                                                    aria-label={`Archive ${p.name}`}
                                                    onClick={() => archive(p)}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                className="kp-iconbtn kp-danger"
                                                title="Delete permanently"
                                                aria-label={`Delete ${p.name} permanently`}
                                                onClick={() =>
                                                    deleteProduct(p)
                                                }
                                            >
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {previewProduct && (
                    <div
                        className="kp-preview-backdrop"
                        role="presentation"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setPreviewProduct(null);
                            }
                        }}
                    >
                        <section
                            className="kp-preview-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="kp-preview-title"
                        >
                            <button
                                type="button"
                                className="kp-preview-close"
                                aria-label="Close product preview"
                                onClick={() => setPreviewProduct(null)}
                            >
                                ×
                            </button>

                            <div className="kp-preview-media">
                                {previewProduct.images?.[0]?.url ? (
                                    <img
                                        src={previewProduct.images[0].url}
                                        alt={previewProduct.name}
                                    />
                                ) : (
                                    <Garment />
                                )}
                            </div>

                            <div className="kp-preview-content">
                                <small className="kp-eyebrow">
                                    ✦ Product preview
                                </small>

                                <h2 id="kp-preview-title">
                                    {previewProduct.name}
                                </h2>

                                <p className="kp-preview-collection">
                                    {previewProduct.collection?.name ||
                                        "No collection"}
                                </p>

                                <div className="kp-preview-price">
                                    {rupees(previewProduct.price)}

                                    {previewProduct.compareAtPrice >
                                        previewProduct.price && (
                                            <s>
                                                {rupees(
                                                    previewProduct.compareAtPrice
                                                )}
                                            </s>
                                        )}
                                </div>

                                <p>
                                    {previewProduct.shortDescription ||
                                        previewProduct.description ||
                                        "No product description added."}
                                </p>

                                <div className="kp-preview-meta">
                                    <span>
                                        <b>SKU</b>
                                        {previewProduct.sku || "—"}
                                    </span>

                                    <span>
                                        <b>Status</b>
                                        {previewProduct.status}
                                    </span>

                                    <span>
                                        <b>Stock</b>
                                        {stockOf(previewProduct)}
                                    </span>

                                    <span>
                                        <b>Material</b>
                                        {previewProduct.material || "—"}
                                    </span>

                                    <span>
                                        <b>Fabric</b>
                                        {previewProduct.fabric || "—"}
                                    </span>
                                </div>

                                <div className="kp-preview-variants">
                                    <b>Variants</b>

                                    <div>
                                        {(previewProduct.variants || []).map(
                                            (v, i) => (
                                                <span key={v._id || i}>
                                                    {v.size || "Size"} /{" "}
                                                    {v.color || "Colour"} ·{" "}
                                                    {v.stock} left
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="kp-preview-actions">
                                    <button
                                        type="button"
                                        className="kp-btn kp-btn-sm"
                                        onClick={() => {
                                            const p = previewProduct;
                                            setPreviewProduct(null);
                                            startEdit(p);
                                        }}
                                    >
                                        Edit product
                                    </button>

                                    <button
                                        type="button"
                                        className="kp-ghost"
                                        onClick={() =>
                                            setPreviewProduct(null)
                                        }
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
