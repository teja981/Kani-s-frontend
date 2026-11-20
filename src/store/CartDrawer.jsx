import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { storeApi, rupees } from "./StoreApi.js";
import { notifyCartChanged, useCartCount } from "./cartShared.js";
import "./CartDrawer.css";

/* Same routes the full Cart page uses:
   GET    /cart                                  -> { cart: { items, subtotal, totalItems } }
   PATCH  /cart/items/:productId/:variantId      -> { quantity }
   DELETE /cart/items/:productId/:variantId
   Each item: itemId, productId, variantId, name, image, color, size,
              unitPrice, quantity, lineTotal, availableStock, isAvailable, slug */
const CART_PATH = "/cart";
const itemPath = (line) => `/cart/items/${line.productId}/${line.variantId}`;

const OPEN_EVENT = "ks-open-cart";

/** Call from anywhere (header bag icon, product page) to slide the bag open. */
export function openCartDrawer() {
    window.dispatchEvent(new Event(OPEN_EVENT));
}

/* Turn an API cart item into a simple line */
function toLine(it) {
    return {
        id: it.itemId,
        productId: it.productId,
        variantId: it.variantId,
        slug: it.slug,
        name: it.name || "Piece",
        image: it.image || "",
        color: it.color || "",
        size: it.size || "",
        price: Number(it.unitPrice ?? 0),
        qty: Number(it.quantity ?? 1),
        max: Number(it.availableStock ?? 0),
        ok: it.isAvailable !== false,
    };
}

/* The header bag icon is the entry point now, so this component draws
   only the drawer. Mount it once (App.jsx does). */
export function CartDock() {
    const navigate = useNavigate();
    const location = useLocation();
    const count = useCartCount();

    const [open, setOpen] = useState(false);
    const [lines, setLines] = useState([]);
    const [state, setState] = useState("idle"); // idle | loading | ready | login | error
    const [busyId, setBusyId] = useState("");
    const [err, setErr] = useState("");

    const load = useCallback(async () => {
        setState((s) => (s === "ready" ? s : "loading"));
        try {
            const res = await storeApi(CART_PATH);
            setLines((res?.cart?.items || []).map(toLine));
            setState("ready");
        } catch (e) {
            setState(e.status === 401 ? "login" : "error");
        }
    }, []);

    // open from anywhere
    useEffect(() => {
        const onOpen = () => setOpen(true);
        window.addEventListener(OPEN_EVENT, onOpen);
        return () => window.removeEventListener(OPEN_EVENT, onOpen);
    }, []);

    // refresh whenever it opens or the cart count changes
    useEffect(() => { if (open) load(); }, [open, count, load]);

    // close on route change, Esc, and lock page scroll while open
    useEffect(() => { setOpen(false); }, [location.pathname]);
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);

    const change = async (line, qty) => {
        if (qty < 1 || qty > line.max) return;
        setBusyId(line.id); setErr("");
        try {
            await storeApi(itemPath(line), { method: "PATCH", body: { quantity: qty } });
            notifyCartChanged();
            await load();
        } catch (e) {
            if (e.status === 401) setState("login");
            else setErr(e.message || "Couldn't update your bag.");
        }
        setBusyId("");
    };

    const remove = async (line) => {
        setBusyId(line.id); setErr("");
        try {
            await storeApi(itemPath(line), { method: "DELETE" });
            notifyCartChanged();
            await load();
        } catch (e) {
            if (e.status === 401) setState("login");
            else setErr(e.message || "Couldn't remove that piece.");
        }
        setBusyId("");
    };

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const pieces = lines.reduce((sum, l) => sum + l.qty, 0);
    const blocked = lines.some((l) => !l.ok);
    const go = (path) => { setOpen(false); navigate(path); };

    return (
        <>
            <div className={`cd-backdrop ${open ? "on" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

            <aside className={`cd-drawer ${open ? "on" : ""}`} role="dialog" aria-modal="true" aria-label="Your bag" aria-hidden={!open}>
                <header className="cd-head">
                    <div>
                        <h2>Your bag</h2>
                        {state === "ready" && lines.length > 0 && <p>{pieces} {pieces === 1 ? "piece" : "pieces"}</p>}
                    </div>
                    <button type="button" className="cd-x" onClick={() => setOpen(false)} aria-label="Close bag"><X size={20} /></button>
                </header>

                <div className="cd-body">
                    {state === "loading" && <p className="cd-note">Opening your bag…</p>}
                    {state === "error" && <p className="cd-note">We couldn't load your bag. <button type="button" className="cd-link" onClick={load}>Try again</button></p>}
                    {state === "login" && (
                        <div className="cd-empty">
                            <ShoppingBag size={38} />
                            <p>Sign in to see your bag.</p>
                            <button type="button" className="cd-btn" onClick={() => go(`/account?next=${encodeURIComponent(location.pathname)}`)}>Sign in</button>
                        </div>
                    )}
                    {state === "ready" && lines.length === 0 && (
                        <div className="cd-empty">
                            <ShoppingBag size={38} />
                            <p>Your bag is empty.</p>
                            <button type="button" className="cd-btn" onClick={() => go("/shop")}>Browse the collection</button>
                        </div>
                    )}

                    {state === "ready" && lines.map((l) => (
                        <article key={l.id} className={`cd-line ${busyId === l.id ? "busy" : ""}`}>
                            <div className="cd-img">{l.image ? <img src={l.image} alt={l.name} /> : <span>No photo</span>}</div>
                            <div className="cd-info">
                                <h3>{l.name}</h3>
                                {(l.color || l.size) && <p className="cd-meta">{[l.color, l.size].filter(Boolean).join(" · ")}</p>}
                                {!l.ok && (
                                    <p className="cd-meta">
                                        {l.max > 0 ? `Only ${l.max} left. Lower the quantity.` : "No longer available. Remove it."}
                                    </p>
                                )}
                                <div className="cd-row">
                                    <div className="cd-qty">
                                        <button type="button" onClick={() => change(l, l.qty - 1)} disabled={l.qty <= 1 || busyId === l.id} aria-label="Decrease quantity"><Minus size={14} /></button>
                                        <span aria-live="polite">{l.qty}</span>
                                        <button type="button" onClick={() => change(l, l.qty + 1)} disabled={l.qty >= l.max || busyId === l.id} aria-label="Increase quantity"><Plus size={14} /></button>
                                    </div>
                                    <strong>{rupees(l.price * l.qty)}</strong>
                                </div>
                            </div>
                            <button type="button" className="cd-del" onClick={() => remove(l)} disabled={busyId === l.id} aria-label={`Remove ${l.name}`}><Trash2 size={16} /></button>
                        </article>
                    ))}
                    {err && <p className="cd-err" role="alert">{err}</p>}
                </div>

                {state === "ready" && lines.length > 0 && (
                    <footer className="cd-foot">
                        <div className="cd-sub"><span>Subtotal</span><strong>{rupees(subtotal)}</strong></div>
                        <small>Shipping and payment are chosen at checkout.</small>
                        {blocked
                            ? <small className="cd-err">Fix the highlighted pieces to check out.</small>
                            : <button type="button" className="cd-btn" onClick={() => go("/checkout")}>Checkout <ArrowRight size={17} /></button>}
                        <button type="button" className="cd-link" onClick={() => go("/cart")}>View full bag</button>
                    </footer>
                )}
            </aside>
        </>
    );
}