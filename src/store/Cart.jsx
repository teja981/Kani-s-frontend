import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storeApi, rupees } from "./StoreApi.js";
import { notifyCartChanged } from "./cartShared.js";
import { LoginBox } from "./Shop.jsx";
import "./Cart.css";

/* ---------- Cart page ---------- */
export function Cart() {
    const [cart, setCart] = useState(null);
    const [state, setState] = useState("loading"); // loading | login | ready | error
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState("");

    const load = useCallback(async () => {
        try {
            const r = await storeApi("/cart");
            setCart(r.cart);
            setState("ready");
        } catch (err) {
            setState(err.status === 401 ? "login" : "error");
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const run = async (key, call) => {
        setBusy(key);
        setMsg("");
        try {
            const r = await call();
            setCart(r.cart);
            notifyCartChanged();
        } catch (err) {
            if (err.status === 401) setState("login");
            else setMsg(err.message);
        } finally {
            setBusy("");
        }
    };

    const itemUrl = (item) => `/cart/items/${item.productId}/${item.variantId}`;
    const setQty = (item, quantity) =>
        run(item.itemId, () => storeApi(itemUrl(item), { method: "PATCH", body: { quantity } }));
    const remove = (item) =>
        run(item.itemId, () => storeApi(itemUrl(item), { method: "DELETE" }));
    const clear = () => {
        if (window.confirm("Remove everything from your cart?")) {
            run("clear", () => storeApi("/cart", { method: "DELETE" }));
        }
    };

    if (state === "loading") {
        return <main className="shop ct-page"><p className="shop-note">Loading your cart…</p></main>;
    }

    if (state === "login") {
        return (
            <main className="shop ct-page ct-narrow">
                <h1 className="ct-title">Your cart</h1>
                <LoginBox message="Sign in to see your cart." button="Sign in" onDone={load} />
            </main>
        );
    }

    if (state === "error") {
        return (
            <main className="shop ct-page">
                <p className="shop-note">We couldn't load your cart. Check your connection and refresh.</p>
            </main>
        );
    }

    const items = cart?.items || [];

    if (items.length === 0) {
        return (
            <main className="shop ct-page ct-empty">
                <h1 className="ct-title">Your cart is empty</h1>
                <p>Pieces you add will appear here.</p>
                <Link to="/shop" className="shop-btn ct-linkbtn">Browse the collection</Link>
                <p><Link to="/orders" className="ct-textlink">View my orders</Link></p>
            </main>
        );
    }

    return (
        <main className="shop ct-page">
            <h1 className="ct-title">Your cart</h1>

            {msg && <p className="ct-error" role="alert">{msg}</p>}

            <div className="ct-layout">
                <ul className="ct-list">
                    {items.map((item) => (
                        <li key={item.itemId} className={`ct-item ${item.isAvailable ? "" : "ct-item-off"}`}>
                            <div className="ct-thumb">
                                {item.image ? <img src={item.image} alt={item.name} /> : <span>No photo</span>}
                            </div>

                            <div className="ct-info">
                                {item.slug
                                    ? <Link to={`/shop/${item.slug}`} className="ct-name">{item.name}</Link>
                                    : <span className="ct-name">{item.name}</span>}
                                <p className="ct-meta">
                                    {[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
                                </p>
                                <p className="ct-unit">{rupees(item.unitPrice)} each</p>

                                {!item.isAvailable && (
                                    <p className="ct-warn">
                                        {item.availableStock > 0
                                            ? `Only ${item.availableStock} left. Please lower the quantity.`
                                            : "This item is no longer available. Please remove it."}
                                    </p>
                                )}

                                <div className="ct-row">
                                    <div className="ct-qty" aria-label="Quantity">
                                        <button
                                            type="button"
                                            onClick={() => setQty(item, item.quantity - 1)}
                                            disabled={busy === item.itemId || item.quantity <= 1}
                                            aria-label="Decrease quantity"
                                        >−</button>
                                        <span>{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQty(item, item.quantity + 1)}
                                            disabled={busy === item.itemId || item.quantity >= item.availableStock}
                                            aria-label="Increase quantity"
                                        >+</button>
                                    </div>
                                    <button
                                        type="button"
                                        className="ct-remove"
                                        onClick={() => remove(item)}
                                        disabled={busy === item.itemId}
                                    >Remove</button>
                                </div>
                                {item.quantity >= item.availableStock && item.availableStock > 0 && (
                                    <small className="ct-low">Maximum available quantity reached</small>
                                )}
                            </div>

                            <strong className="ct-line">{rupees(item.lineTotal)}</strong>
                        </li>
                    ))}
                </ul>

                <aside className="ct-summary">
                    <h2>Order summary</h2>
                    <div className="ct-sum-row"><span>Items</span><span>{cart.totalItems}</span></div>
                    <div className="ct-sum-row"><span>Subtotal</span><span>{rupees(cart.subtotal)}</span></div>
                    <div className="ct-sum-row"><span>Shipping</span><span>Free</span></div>
                    <div className="ct-sum-row ct-total"><span>Total</span><span>{rupees(cart.subtotal)}</span></div>

                    {cart.hasUnavailableItems ? (
                        <p className="ct-warn">Fix the highlighted items to continue.</p>
                    ) : (
                        <Link to="/checkout" className="shop-btn ct-linkbtn ct-block">Proceed to checkout</Link>
                    )}

                    <Link to="/shop" className="ct-textlink">Continue shopping</Link>
                    <button type="button" className="ct-remove" onClick={clear} disabled={busy === "clear"}>
                        Clear cart
                    </button>
                </aside>
            </div>
        </main>
    );
}