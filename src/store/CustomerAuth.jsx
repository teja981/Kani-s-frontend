import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, User, ShoppingBag, Check, CreditCard, Package, Truck } from "lucide-react";
import { storeApi } from "./StoreApi.js";
import { notifyCartChanged } from "./cartShared.js";
import { notifyAuthChanged } from "./customerSession.js"; // tells the navbar the user signed in
import "./CustomerAuth.css";

/* ---- Backend mounts: app.use("/api/v1/auth/customer", customerAuthRoutes) ----
   storeApi.js already prefixes "/api/v1" (BASE), so paths here must NOT repeat it. */
const AUTH_BASE = "/auth/customer";
const LOGIN_PATH = `${AUTH_BASE}/login`;
const REGISTER_PATH = `${AUTH_BASE}/register`;
/* ------------------------------------------------------------------ */

// same rule the migration used: letters, numbers, "_" and "." (3-30 chars)
const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

const LAYERS = [-18, -12, -6, 0, 6, 12, 18];
const SPARKS = [
    { l: "8%", t: "18%", d: 0 }, { l: "46%", t: "10%", d: 1.4 }, { l: "88%", t: "22%", d: 0.7 },
    { l: "12%", t: "78%", d: 2 }, { l: "52%", t: "88%", d: 1 }, { l: "92%", t: "70%", d: 2.6 },
];
const PERKS = [
    ["Live collection", "New pieces the moment they drop."],
    ["Try in 3D", "See the drape turn before you buy."],
    ["Track every order", "From packing to your doorstep."],
];
const STEPS = [[CreditCard, "Paid"], [Package, "Packed"], [Truck, "Shipped"], [Check, "Delivered"]];

function Defs() {
    return (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <defs>
                <linearGradient id="ca-green" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#23a06f" /><stop offset="1" stopColor="#0d402f" />
                </linearGradient>
                <linearGradient id="ca-gold" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#f3d98b" /><stop offset=".5" stopColor="#d8a33d" /><stop offset="1" stopColor="#f3d98b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function Garment() {
    return (
        <svg viewBox="0 0 200 330" aria-hidden="true">
            <path d="M72 14 Q100 40 128 14 L142 112 Q100 128 58 112 Z" fill="url(#ca-green)" />
            <path d="M58 112 Q100 128 142 112 L192 308 Q100 332 8 308 Z" fill="url(#ca-green)" />
            <path d="M92 130 L70 312 M108 130 L130 312 M100 132 L100 322" stroke="#fff" strokeOpacity=".16" strokeWidth="2" fill="none" />
            <path d="M58 112 Q100 128 142 112" stroke="url(#ca-gold)" strokeWidth="6" fill="none" />
            <path d="M8 308 Q100 332 192 308" stroke="url(#ca-gold)" strokeWidth="7" fill="none" />
            <path d="M72 14 Q100 40 128 14" stroke="url(#ca-gold)" strokeWidth="3" fill="none" />
        </svg>
    );
}

function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
}
const LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"];

export default function CustomerAuth() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const rawNext = params.get("next") || "/shop";
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/shop";

    const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
    const [form, setForm] = useState({ username: "", password: "", confirm: "", terms: false });
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [welcome, setWelcome] = useState(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const isReg = mode === "register";

    const score = useMemo(() => strength(form.password), [form.password]);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    const switchMode = (m) => { setMode(m); setError(""); };

    const onMove = (e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
    };

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        const username = form.username.trim().toLowerCase();

        if (isReg) {
            if (!USERNAME_RE.test(username)) return setError("Username must be 3-30 characters: letters, numbers, _ or .");
            if (form.password.length < 8) return setError("Use at least 8 characters for your password.");
            if (form.password !== form.confirm) return setError("The two passwords don't match.");
            if (!form.terms) return setError("Please accept the terms to create your account.");
        }

        setBusy(true);
        try {
            // the backend sets httpOnly auth + CSRF cookies; storeApi sends them automatically
            if (isReg) {
                await storeApi(REGISTER_PATH, { method: "POST", body: { username, password: form.password } });
            }

            const res = await storeApi(LOGIN_PATH, { method: "POST", body: { username, password: form.password } });
            notifyCartChanged();
            notifyAuthChanged(); // navbar switches to "Hi, name / Logout"

            const c = res?.customer || res?.user || {};
            setWelcome(c.username || username);
            setTimeout(() => navigate(next, { replace: true }), 1200);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
            setBusy(false);
        }
    };

    const heading = isReg
        ? ["Join the studio", "Save your bag, track orders and try pieces in 3D."]
        : ["Welcome back", "Sign in to continue your shopping."];

    const cta = busy && !welcome
        ? (isReg ? "Creating account…" : "Signing in…")
        : (isReg ? "Create account" : "Sign in");

    return (
        <div className="ca-page" onPointerMove={onMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })}>
            <Defs />
            <div className="ca-orb ca-orb-a" /><div className="ca-orb ca-orb-b" /><div className="ca-orb ca-orb-c" />
            <div className="ca-pattern" />
            {SPARKS.map((s, i) => (
                <i key={i} className="ca-spark" style={{ left: s.l, top: s.t, animationDelay: `${s.d}s` }}>✦</i>
            ))}

            <div className="ca-grid">
                {/* left: 3D garment + live buying animation */}
                <section className="ca-left">
                    <Link to="/" className="ca-brand" aria-label="Kani's Studio home">KANI'S <b>STUDIO</b> <i>✦</i></Link>

                    <div className="ca-stage">
                        <div className="ca-tilt" style={{ transform: `rotateX(${tilt.y * -14}deg) rotateY(${tilt.x * 18}deg)` }}>
                            <div className="ca-spin">
                                {LAYERS.map((z) => (
                                    <div key={z} className="ca-layer" style={{ transform: `translateZ(${z}px)`, filter: `brightness(${0.62 + ((z + 18) / 36) * 0.38})` }}>
                                        <Garment />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ca-floor" />
                    </div>

                    <div className="ca-buy" aria-hidden="true">
                        <div className="ca-row">
                            <div className="ca-prod">
                                <div className="ca-thumb"><Garment /></div>
                                <div><strong>Emerald Banarasi</strong><small>₹4,999</small></div>
                            </div>
                            <div className="ca-addbtn">
                                <span className="ca-add-a">Add to bag</span>
                                <span className="ca-add-b"><Check size={14} /> Added</span>
                            </div>
                            <div className="ca-bag"><ShoppingBag size={24} /><em className="ca-badge">1</em></div>
                            <div className="ca-fly"><Garment /></div>
                        </div>
                        <div className="ca-track">
                            <div className="ca-line"><span className="ca-fill" /></div>
                            <div className="ca-dots">
                                {STEPS.map(([Icon, label], i) => (
                                    <div key={label} className={`ca-dot ca-d${i + 1}`}><span><Icon size={14} /></span><small>{label}</small></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="ca-perks">
                        {PERKS.map(([t, d]) => (
                            <div key={t} className="ca-perk"><strong>{t}</strong><small>{d}</small></div>
                        ))}
                    </div>
                </section>

                {/* right: glass auth card */}
                <section className="ca-right">
                    <form className="ca-glass" onSubmit={submit}>
                        <span className="ca-sheen" />

                        <div className="ca-tabs" role="tablist">
                            <span className="ca-ind" style={{ transform: `translateX(${isReg ? "100%" : "0"})` }} />
                            <button type="button" role="tab" aria-selected={!isReg} className={!isReg ? "on" : ""} onClick={() => switchMode("login")}>Sign in</button>
                            <button type="button" role="tab" aria-selected={isReg} className={isReg ? "on" : ""} onClick={() => switchMode("register")}>Create account</button>
                        </div>

                        <div key={mode} className="ca-head ca-in">
                            <h1>{heading[0]}</h1>
                            <p className="ca-sub">{heading[1]}</p>
                        </div>

                        <label className="ca-field">
                            <User size={18} />
                            <input
                                type="text" required autoComplete="username" placeholder="Username"
                                minLength={isReg ? 3 : undefined} maxLength={30}
                                autoCapitalize="none" spellCheck={false}
                                value={form.username} onChange={set("username")}
                            />
                        </label>

                        <label className="ca-field">
                            <Lock size={18} />
                            <input
                                type={show ? "text" : "password"} required minLength={isReg ? 8 : undefined}
                                autoComplete={isReg ? "new-password" : "current-password"} placeholder="Password"
                                value={form.password} onChange={set("password")}
                            />
                            <button type="button" className="ca-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                                {show ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </label>

                        {isReg && (
                            <div className="ca-in ca-reg">
                                <div className="ca-meter" aria-live="polite">
                                    <div className="ca-bars">{[1, 2, 3, 4].map((n) => <i key={n} className={score >= n ? `on s${score}` : ""} />)}</div>
                                    <small>{form.password ? LABELS[score] : "Use 8+ characters with a mix of letters, numbers and symbols"}</small>
                                </div>
                                <label className="ca-field">
                                    <Lock size={18} />
                                    <input type={show ? "text" : "password"} required autoComplete="new-password" placeholder="Confirm password" value={form.confirm} onChange={set("confirm")} />
                                    {form.confirm && form.confirm === form.password && <Check size={18} className="ca-ok" />}
                                </label>
                                <label className="ca-terms">
                                    <input type="checkbox" checked={form.terms} onChange={set("terms")} />
                                    <span>I agree to the terms and privacy policy.</span>
                                </label>
                            </div>
                        )}

                        {error && <p className="ca-error" role="alert">{error}</p>}

                        <button className="ca-btn" disabled={busy}>
                            <span>{cta}</span> <ArrowRight size={18} />
                        </button>

                        <p className="ca-switch">
                            {isReg ? "Already have an account?" : "New to Kani's Studio?"}{" "}
                            <button type="button" onClick={() => switchMode(isReg ? "login" : "register")}>{isReg ? "Sign in" : "Create one"}</button>
                        </p>
                    </form>

                    {welcome !== null && (
                        <div className="ca-welcome" role="status">
                            <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
                            <p>{welcome ? `Welcome, ${welcome}` : "Welcome"}</p>
                            <small>Taking you back to the collection…</small>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
