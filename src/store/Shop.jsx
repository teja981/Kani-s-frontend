import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { storeApi, rupees, primaryImage } from "./StoreApi.js";
import { notifyCartChanged, useCartCount } from "./cartShared.js";
import { openCartDrawer } from "./CartDrawer.jsx";
export { LoginBox } from "./LoginBox.jsx"; // Cart.jsx imports it from here
import "./Shop.css";
import "./storefront.css"; // admin-style emerald and gold look for all shop pages
// Cart.css is imported by Cart.jsx, which is always loaded, so it is not imported here.
// That also removes the Cart.css / cart.css casing clash on Linux hosts.

/* ---------- Shop: collections + product grid ---------- */
export function Shop() {
    const [params, setParams] = useSearchParams();
    const collection = params.get("collection") || "";
    const sort = params.get("sort") || "newest";
    const query = params.get("q") || "";
    const [search, setSearch] = useState(query);

    const [collections, setCollections] = useState([]);
    const [products, setProducts] = useState([]);
    const [state, setState] = useState("loading"); // loading | ready | error

    // the header search changes ?q=, so keep this box in step with it
    useEffect(() => { setSearch(query); }, [query]);

    const set = (key, value) => {
        const next = new URLSearchParams(params);
        value ? next.set(key, value) : next.delete(key);
        setParams(next, { replace: true });
    };

    useEffect(() => {
        storeApi("/collections/store")
            .then((r) => setCollections(r.collections || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        let cancelled = false;
        setState("loading");
        const q = new URLSearchParams({ limit: "24", sort });
        if (collection) q.set("collection", collection);
        if (query) q.set("search", query);
        storeApi(`/products/store?${q}`)
            .then((r) => { if (!cancelled) { setProducts(r.products || []); setState("ready"); } })
            .catch(() => { if (!cancelled) setState("error"); });
        return () => { cancelled = true; };
    }, [collection, sort, query]);

    return (
        <main className="shop">
            <span className="sf-orb sf-orb-a" aria-hidden="true" />
            <span className="sf-orb sf-orb-b" aria-hidden="true" />
            <span className="sf-pattern" aria-hidden="true" />

            <header className="shop-head">
                <small className="sf-eyebrow">✦ The collection</small>
                <h1>{query ? `Results for “${query}”` : "The collection"}</h1>
                <p>Every piece here is live from our studio. When we add or sell out, this page changes.</p>
            </header>

            <div className="shop-bar">
                <div className="shop-chips">
                    <button className={!collection ? "on" : ""} onClick={() => set("collection", "")}>All</button>
                    {collections.map((c) => (
                        <button key={c._id} className={collection === c.slug ? "on" : ""} onClick={() => set("collection", c.slug)}>
                            {c.name}
                        </button>
                    ))}
                </div>
                <form className="shop-tools" onSubmit={(e) => { e.preventDefault(); set("q", search.trim()); }}>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sarees, lehengas…" aria-label="Search" />
                    <select value={sort} onChange={(e) => set("sort", e.target.value)} aria-label="Sort">
                        <option value="newest">Newest</option>
                        <option value="price_low">Price: low to high</option>
                        <option value="price_high">Price: high to low</option>
                        <option value="name">Name</option>
                    </select>
                </form>
            </div>

            {state === "loading" && (
                <div className="shop-grid">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="sf-skel" style={{ "--i": i }} />)}
                </div>
            )}
            {state === "error" && <p className="shop-note">We couldn't load products. Check your connection and refresh.</p>}
            {state === "ready" && products.length === 0 && <p className="shop-note">Nothing matches yet. Try another collection or clear your search.</p>}

            {state === "ready" && (
                <div className="shop-grid">
                    {products.map((p, i) => {
                        const sold = p.totalStock === 0;
                        const second = p.images?.[1]?.url;
                        return (
                            <Link key={p._id} to={`/shop/${p.slug}`} className="shop-card" style={{ "--i": i }}>
                                <div className="shop-img">
                                    {primaryImage(p) ? <img className="sf-img-a" src={primaryImage(p)} alt={p.images?.[0]?.altText || p.name} loading="lazy" /> : <span>No photo</span>}
                                    {second && <img className="sf-img-b" src={second} alt="" loading="lazy" />}
                                    {sold && <em className="shop-badge">Sold out</em>}
                                    {!sold && p.discountPercentage > 0 && <em className="shop-badge off">{p.discountPercentage}% off</em>}
                                </div>
                                <h3>{p.name}</h3>
                                <p className="shop-price">
                                    {rupees(p.price)}
                                    {p.compareAtPrice > p.price && <s>{rupees(p.compareAtPrice)}</s>}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

/* ---------- Product detail ---------- */
export function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [missing, setMissing] = useState(false);
    const [img, setImg] = useState(0);
    const [color, setColor] = useState("");
    const [variantId, setVariantId] = useState("");
    const [msg, setMsg] = useState("");
    const [added, setAdded] = useState(false);
    const cartCount = useCartCount();

    useEffect(() => {
        let cancelled = false;
        setProduct(null);
        setMissing(false);
        setImg(0);
        setMsg("");
        setAdded(false);
        storeApi(`/products/store/${slug}`)
            .then((r) => {
                if (cancelled) return;
                setProduct(r.product);
                const variants = r.product.variants || [];
                const first = variants.find((v) => v.stock > 0) || variants[0];
                if (first) { setColor(first.color); setVariantId(first._id); }
            })
            .catch(() => { if (!cancelled) setMissing(true); });
        return () => { cancelled = true; };
    }, [slug]);

    if (missing) return <main className="shop"><p className="shop-note">This piece is no longer available. <Link to="/shop">Back to the collection</Link></p></main>;
    if (!product) return <main className="shop"><p className="shop-note">Loading…</p></main>;

    const variants = product.variants || [];
    const images = [...(product.images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const colors = [...new Map(variants.map((v) => [v.color, v.colorCode])).entries()];
    const sizes = variants.filter((v) => v.color === color);
    const chosen = variants.find((v) => v._id === variantId);

    const pickColor = (c) => {
        setColor(c);
        const v = variants.find((x) => x.color === c && x.stock > 0) || variants.find((x) => x.color === c);
        setVariantId(v?._id || "");
    };

    const add = async () => {
        setMsg("");
        setAdded(false);
        try {
            await storeApi("/cart/items", { method: "POST", body: { productId: product._id, variantId, quantity: 1 } });
            setMsg("Added to your bag.");
            setAdded(true);
            notifyCartChanged();
            openCartDrawer(); // slide the bag open, like the big stores do
        } catch (err) {
            if (err.status === 401) navigate(`/account?next=${encodeURIComponent(`/shop/${slug}`)}`);
            else setMsg(err.message);
        }
    };

    return (
        <main className="shop shop-detail">
            <span className="sf-orb sf-orb-a" aria-hidden="true" />
            <span className="sf-orb sf-orb-b" aria-hidden="true" />
            <span className="sf-pattern" aria-hidden="true" />

            <Link to="/shop" className="shop-back">← All pieces</Link>
            <div className="shop-detail-grid">
                <div>
                    <div className="shop-main-img">
                        {images[img] ? <img key={img} src={images[img].url} alt={images[img].altText || product.name} /> : <span>No photo</span>}
                    </div>
                    {images.length > 1 && (
                        <div className="shop-thumbs">
                            {images.map((im, i) => (
                                <button key={im._id || i} className={i === img ? "on" : ""} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}>
                                    <img src={im.url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="shop-info">
                    <p className="shop-crumb">{product.collection?.name}</p>
                    <h1>{product.name}</h1>
                    <p className="shop-price big">
                        {rupees(product.price)}
                        {product.compareAtPrice > product.price && <><s>{rupees(product.compareAtPrice)}</s><em>{product.discountPercentage}% off</em></>}
                    </p>
                    {product.shortDescription && <p className="shop-lead">{product.shortDescription}</p>}

                    {colors.length > 1 && (
                        <div className="shop-opt">
                            <span>Colour: {color}</span>
                            <div>{colors.map(([c, code]) => (
                                <button key={c} className={`swatch ${c === color ? "on" : ""}`} style={code ? { background: code } : undefined} onClick={() => pickColor(c)} title={c} aria-label={c}>{!code && c}</button>
                            ))}</div>
                        </div>
                    )}

                    <div className="shop-opt">
                        <span>Size</span>
                        <div>{sizes.map((v) => (
                            <button key={v._id} disabled={v.stock === 0} className={`size ${v._id === variantId ? "on" : ""}`} onClick={() => setVariantId(v._id)}>{v.size}</button>
                        ))}</div>
                        {chosen && chosen.stock > 0 && chosen.stock <= 3 && <small className="shop-low">Only {chosen.stock} left</small>}
                    </div>

                    <button className="shop-btn" onClick={add} disabled={!chosen || chosen.stock === 0}>
                        {chosen && chosen.stock === 0 ? "Sold out" : "Add to bag"}
                    </button>
                    {msg && <p className="shop-msg" role="status">{msg}</p>}
                    {(added || cartCount > 0) && (
                        <div className="ct-after">
                            <button type="button" className="shop-btn" onClick={openCartDrawer}>
                                View bag{cartCount > 0 ? ` (${cartCount})` : ""}
                            </button>
                            <button type="button" className="ct-textlink" onClick={() => navigate("/checkout")}>Checkout →</button>
                            <Link to="/shop" className="ct-textlink">Keep shopping</Link>
                        </div>
                    )}

                    {product.description && <p className="shop-desc">{product.description}</p>}
                    <dl className="shop-facts">
                        {product.fabric && <><dt>Fabric</dt><dd>{product.fabric}</dd></>}
                        {product.material && <><dt>Material</dt><dd>{product.material}</dd></>}
                    </dl>
                </div>
            </div>
        </main>
    );
}