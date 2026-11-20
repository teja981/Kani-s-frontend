import { useCallback, useEffect, useState } from "react";
import { storeApi } from "./StoreApi.js";
import { notifyCartChanged } from "./cartShared.js";

const EVENT = "customer-auth-changed";

/** Call after login / register / logout so every component re-checks who is signed in. */
export const notifyAuthChanged = () => window.dispatchEvent(new Event(EVENT));

/** Returns the signed-in customer, or null when signed out. */
export async function getCustomer() {
    try {
        const res = await storeApi("/auth/customer/profile");
        return res?.customer || null;
    } catch (e) {
        if (e.status === 401 || e.status === 403) return null;
        throw e;
    }
}

/** Clears the auth + CSRF cookies on the server, then refreshes cart and navbar. */
export async function logoutCustomer() {
    await storeApi("/auth/customer/logout", { method: "POST" });
    notifyCartChanged();
    notifyAuthChanged();
}

/** { customer, loading, refresh } - customer is null when signed out. */
export function useCustomer() {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setCustomer(await getCustomer());
        } catch {
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        window.addEventListener(EVENT, refresh);
        return () => window.removeEventListener(EVENT, refresh);
    }, [refresh]);

    return { customer, loading, refresh };
}
