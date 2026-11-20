// cartShared.js: tiny helpers shared by the shop pages and the cart panel
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { storeApi } from "./StoreApi.js";

export const CART_EVENT = "ks-cart-changed";
export const OPEN_EVENT = "ks-cart-open";

/** Call after anything that changes the cart so the cart count refreshes. */
export const notifyCartChanged = () => window.dispatchEvent(new Event(CART_EVENT));

/**
 * Opens the cart panel from anywhere on the shop pages.
 *   openCart()                       -> your cart
 *   openCart("checkout")             -> straight to checkout
 *   openCart("orders")               -> order history
 *   openCart("order", orderId)       -> one order
 */
export const openCart = (step = "cart", orderId) =>
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { step, orderId } }));

/** The backend sets this readable cookie at customer login. */
export const isSignedIn = () => document.cookie.includes("customerCsrfToken=");

/** Number of items in the cart. */
export function useCartCount() {
    const { pathname } = useLocation();
    const [count, setCount] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const load = () => {
            if (!isSignedIn()) {
                setCount(0);
                return;
            }
            storeApi("/cart")
                .then((r) => { if (!cancelled) setCount(r.cart?.totalItems || 0); })
                .catch(() => { if (!cancelled) setCount(0); });
        };

        load();
        window.addEventListener(CART_EVENT, load);
        return () => {
            cancelled = true;
            window.removeEventListener(CART_EVENT, load);
        };
    }, [pathname]);

    return count;
}