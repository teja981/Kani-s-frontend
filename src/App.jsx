import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  useReducedMotion,
  animate,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowUp,
  Menu,
  X,
  Leaf,
  Heart,
  Gem,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Search,
  ShoppingBag,
  User,
  Package,
  Home as HomeIcon,
  ChevronDown,
  LogIn,
  LogOut, // CHANGED: logout icon
} from "lucide-react";
import About from "./About.jsx";
import Insights from "./Insights.jsx";
import Contact from "./Contact.jsx";

import AdminApp from "./admin/AdminApp.jsx";
import { Shop, ProductPage } from "./store/Shop.jsx";
import CustomerAuth from "./store/CustomerAuth.jsx";
import { Cart } from "./store/Cart.jsx";
import { Checkout } from "./store/Checkout.jsx";
import { MyOrders, OrderPage } from "./store/Orders.jsx";
import { storeApi } from "./store/StoreApi.js";
import { CartDock, openCartDrawer } from "./store/CartDrawer.jsx";
import { useCartCount } from "./store/cartShared.js";
import { logoutCustomer, useCustomer } from "./store/customerSession.js"; // CHANGED: logout + server-side sign-in check
import "./header.css";
import "./headerFx.js";


const BRAND = {
  name: "Kani's Studio",
  person: "Bharathi",
  email: "kanisstudio.business@gmail.com",
  phone: "+91 93466 05559",
  address: "Kani's Studio, Dhanavaipeta, Opposite Fastrack, Rajahmundry",
};

const benefits = [
  "Timeless craftsmanship",
  "Premium fabrics",
  "Made for every occasion",
  "Thoughtful details",
  "Timeless craftsmanship",
  "Premium fabrics",
];

/* Replace these placeholder numbers with your real ones */
const stats = [
  { value: 120, suffix: "+", label: "Handpicked sarees" },
  { value: 15, suffix: "", label: "Weaving traditions" },
  { value: 8, suffix: "", label: "Years of curation" },
  { value: 500, suffix: "+", label: "Happy occasions" },
];

const occasions = [
  { icon: <Gem size={26} />, title: "Bridal & wedding", text: "Rich weaves for the biggest day of your life." },
  { icon: <Sparkles size={26} />, title: "Festive", text: "Colour and gold for every celebration." },
  { icon: <Heart size={26} />, title: "Family functions", text: "Graceful drapes for the people you love." },
  { icon: <Leaf size={26} />, title: "Everyday grace", text: "Soft, easy pieces for daily elegance." },
];

const sparkles = [
  { l: "5%", t: "16%", s: 14, d: 0 },
  { l: "46%", t: "9%", s: 10, d: 1.2 },
  { l: "91%", t: "20%", s: 16, d: 0.6 },
  { l: "50%", t: "84%", s: 12, d: 1.8 },
  { l: "7%", t: "74%", s: 10, d: 2.4 },
  { l: "94%", t: "72%", s: 13, d: 0.9 },
];

/* ================================
   SMALL HELPERS
================================ */

function useIsMobile(breakpoint = 650) {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return mobile;
}

/* Fade + slide in when scrolled into view */
function Reveal({ children, delay = 0, y = 34, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.75, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Button that gently follows the mouse (laptops only) */
function Magnetic({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16 });
  const sy = useSpring(y, { stiffness: 220, damping: 16 });

  const onMove = (e) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.28);
    y.set((e.clientY - r.top - r.height / 2) * 0.28);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: "inline-block" }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

function Botanical({ className = "" }) {
  return (
    <svg
      className={`botanical ${className}`}
      viewBox="0 0 220 150"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 132C61 108 86 75 112 40C133 12 159 7 198 17"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M51 111C28 104 20 85 25 68C45 73 57 89 51 111Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M83 79C62 69 58 50 67 34C84 43 92 61 83 79Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M113 42C98 26 102 9 116 1C129 17 128 32 113 42Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M83 80C103 62 122 66 134 80C117 92 99 92 83 80Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M117 41C135 24 154 29 163 44C145 56 128 55 117 41Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M157 18C173 1 191 3 202 15C187 29 170 31 157 18Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 132H215" stroke="currentColor" strokeWidth="1" opacity=".55" />
    </svg>
  );
}

/* ================================
   LOGIN GATE
   Sends visitors to the customer login page (/account)
   unless they are signed in. After login, CustomerAuth
   returns them to the page they asked for via ?next=

   We check "/cart" because checkout already relies on it
   returning 401 when signed out. If your backend has a
   dedicated route (e.g. "/auth/customer/profile"), put it in
   AUTH_CHECK_PATH below.

   Only a real 401 means "signed out". A network error or a 500
   never logs the customer out.
================================ */

const AUTH_CHECK_PATH = "/cart";

function RequireCustomer({ children }) {
  const location = useLocation();
  const [state, setState] = useState("checking"); // "checking" | "in" | "out"

  useEffect(() => {
    let cancelled = false;
    storeApi(AUTH_CHECK_PATH)
      .then(() => !cancelled && setState("in"))
      .catch((err) => {
        if (cancelled) return;
        setState(err?.status === 401 ? "out" : "in");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking") return null;
  if (state === "out") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/account?next=${next}`} replace />;
  }
  return children;
}

/* ================================
   SPLASH INTRO
================================ */

function Splash({ onDone }) {
  const first = "KANI'S".split("");
  const second = "STUDIO".split("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      document.body.style.overflow = "";
      onDone();
    }, 3300);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [onDone]);

  return (
    <motion.div
      className="splash"
      initial={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.77, 0, 0.18, 1] }}
    >
      <div className="splash-name">
        <div className="splash-line splash-line-main">
          {first.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 45, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                delay: 0.2 + i * 0.1,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        <div className="splash-line splash-line-sub">
          {second.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 + i * 0.08 }}
            >
              {ch}
            </motion.span>
          ))}
          <motion.i
            initial={{ opacity: 0, rotate: -90, scale: 0 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            ✦
          </motion.i>
        </div>
      </div>

      <motion.div
        className="splash-tagline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.8 }}
      >
        Curated elegance · Made with love
      </motion.div>

      <div className="splash-bar">
        <motion.i
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.4, delay: 0.4, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ================================
   HEADER (Amazon-style)
   Row 1: logo, collection, search, account, orders, bag
   Row 2: page links (desktop). Collapses after you scroll.
   Styles live in header.css (every class starts with kh-).
================================ */

const navItems = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "Our Story", path: "/about" },
  { label: "Insights", path: "/insights" },
  { label: "Contact", path: "/contact" },
];

const EASE = [0.22, 1, 0.36, 1];

function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const count = useCartCount();
  // CHANGED: ask the server who is signed in (works even if the browser can't read the CSRF cookie)
  const { customer } = useCustomer();
  const signedIn = !!customer;

  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [q, setQ] = useState("");
  const [loggingOut, setLoggingOut] = useState(false); // CHANGED
  const acctRef = useRef(null);

  const currentPath = location.pathname;

  // "Shop" stays highlighted on product pages like /shop/some-saree
  const isActive = (path) =>
    currentPath === path || (path !== "/" && currentPath.startsWith(path + "/"));

  // CHANGED: sign out. Clears the cookies on the server, refreshes the bag count,
  // then sends the customer to the sign-in page.
  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutCustomer();
      setAcctOpen(false);
      setMenuOpen(false);
      navigate("/account", { replace: true });
    } catch (err) {
      alert(err.message || "Could not sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  // scroll state. The gap between 40 and 120 stops the header flickering
  // when the second row collapses and the page height changes.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setCompact((c) => (c ? y > 40 : y > 120));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // keep the search box in step with /shop?q=...
  useEffect(() => {
    if (currentPath === "/shop") {
      setQ(new URLSearchParams(location.search).get("q") || "");
    } else {
      setQ("");
    }
  }, [currentPath, location.search]);

  // close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setAcctOpen(false);
  }, [location.pathname]);

  // lock page scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // close the account dropdown on outside click or Escape
  useEffect(() => {
    if (!acctOpen) return;
    const onDown = (e) => {
      if (acctRef.current && !acctRef.current.contains(e.target)) setAcctOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setAcctOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [acctOpen]);

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    setMenuOpen(false);
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  };

  const clearSearch = () => {
    setQ("");
    if (currentPath === "/shop") navigate("/shop");
  };

  const openBag = () => {
    setAcctOpen(false);
    setMenuOpen(false);
    openCartDrawer();
  };

  const signInHref = `/account?next=${encodeURIComponent(currentPath + location.search)}`;

  return (
    <header className={`kh-header ${scrolled ? "is-scrolled" : ""} ${compact ? "is-compact" : ""}`}>
      <div className="kh-top">
        <Link className="kh-brand" to="/" aria-label="Kani's Studio home">
          <span>KANI'S</span>
          <b>STUDIO</b>
          <i>✦</i>
        </Link>

        <Link
          to="/shop"
          className={`kh-home ${currentPath.startsWith("/shop") ? "active" : ""}`}
          aria-label="The collection"
        >
          <HomeIcon size={18} />
          <span>Collection</span>
        </Link>

        <form className="kh-search" role="search" onSubmit={submitSearch}>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search sarees, lehengas…"
            aria-label="Search the collection"
          />
          <AnimatePresence>
            {q && (
              <motion.button
                type="button"
                className="kh-search-clear"
                aria-label="Clear search"
                onClick={clearSearch}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.18 }}
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
          <button type="submit" className="kh-search-go" aria-label="Search">
            <Search size={20} />
          </button>
        </form>

        <div className="kh-actions">
          {/* account dropdown */}
          <div
            className="kh-account"
            ref={acctRef}
            onPointerEnter={(e) => e.pointerType === "mouse" && setAcctOpen(true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setAcctOpen(false)}
          >
            <button
              type="button"
              className="kh-act"
              aria-haspopup="menu"
              aria-expanded={acctOpen}
              onClick={() => setAcctOpen((o) => !o)}
            >
              <User size={24} className="kh-act-ico" />
              <span className="kh-act-text">
                <small>{signedIn ? "Hello" : "Hello, Sign in"}</small>
                <b>
                  Account <ChevronDown size={14} />
                </b>
              </span>
            </button>

            <AnimatePresence>
              {acctOpen && (
                <motion.div
                  className="kh-menu"
                  role="menu"
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: EASE }}
                >
                  {signedIn ? (
                    <>
                      <p className="kh-menu-title">Your account</p>
                      <Link className="kh-menu-link" role="menuitem" to="/orders">
                        <Package size={18} /> My orders
                      </Link>
                      <button type="button" className="kh-menu-link" role="menuitem" onClick={openBag}>
                        <ShoppingBag size={18} /> Your bag{count > 0 ? ` (${count})` : ""}
                      </button>
                      <div className="kh-menu-sep" />
                      <Link className="kh-menu-link" role="menuitem" to="/shop">
                        <HomeIcon size={18} /> Browse the collection
                      </Link>
                      {/* CHANGED: sign out */}
                      <div className="kh-menu-sep" />
                      <button
                        type="button"
                        className="kh-menu-link"
                        role="menuitem"
                        onClick={doLogout}
                        disabled={loggingOut}
                      >
                        <LogOut size={18} /> {loggingOut ? "Signing out…" : "Sign out"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="kh-menu-title">Welcome</p>
                      <Link className="kh-menu-cta" to={signInHref}>
                        Sign in
                      </Link>
                      <p className="kh-menu-note">
                        New customer? <Link to="/account">Start here</Link>
                      </p>
                      <div className="kh-menu-sep" />
                      <Link className="kh-menu-link" role="menuitem" to="/orders">
                        <Package size={18} /> My orders
                      </Link>
                      <Link className="kh-menu-link" role="menuitem" to="/shop">
                        <HomeIcon size={18} /> Browse the collection
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link className="kh-act kh-orders" to="/orders">
            <span className="kh-act-text">
              <small>Track your</small>
              <b>Orders</b>
            </span>
          </Link>

          {/* CHANGED: always-visible logout when signed in */}
          {signedIn && (
            <button
              type="button"
              className="kh-act kh-logout"
              onClick={doLogout}
              disabled={loggingOut}
              aria-label="Sign out"
            >
              <LogOut size={22} />
              <b>{loggingOut ? "…" : "Logout"}</b>
            </button>
          )}

          <button
            type="button"
            className="kh-act kh-cart"
            onClick={openBag}
            aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <span className="kh-cart-ico">
              <ShoppingBag size={26} />
              {count > 0 && (
                <em key={count} className="kh-badge">
                  {count}
                </em>
              )}
            </span>
            <b>Bag</b>
          </button>

          <button
            type="button"
            className="kh-menubtn"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? "x" : "m"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: "grid", placeItems: "center" }}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* second row (desktop) */}
      <div className="kh-sub">
        <nav className="kh-sub-in" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item.path) ? "active" : ""}
            >
              {item.label}
              {isActive(item.path) && (
                <motion.span
                  layoutId="kh-underline"
                  className="kh-underline"
                  transition={{ duration: 0.4, ease: EASE }}
                />
              )}
            </Link>
          ))}
          <span className="kh-sub-note">✦ CURATED ELEGANCE</span>
        </nav>
      </div>

      {/* mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="kh-mnav"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            {navItems.map((item, i) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
              >
                <Link to={item.path} className={isActive(item.path) ? "active" : ""}>
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <div className="kh-mnav-sep" />
            <Link className="kh-mnav-small" to="/orders">
              My orders
            </Link>
            <Link className="kh-mnav-small" to={signedIn ? "/orders" : signInHref}>
              {signedIn ? "My account" : "Sign in"}
            </Link>
            <a
              className="kh-mnav-small"
              href="#bag"
              onClick={(e) => {
                e.preventDefault();
                openBag();
              }}
            >
              Your bag{count > 0 ? ` (${count})` : ""}
            </a>
            {/* CHANGED: sign out (mobile) */}
            {signedIn && (
              <button
                type="button"
                className="kh-mnav-small kh-mnav-btn"
                onClick={doLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ================================
   STATS STRIP
================================ */

function CountUp({ to, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

function StatsStrip() {
  return (
    <section className="ks-stats" aria-label="Kani's Studio in numbers">
      <Reveal>
        <span className="section-kicker">KANI'S STUDIO IN NUMBERS</span>
      </Reveal>
      <div className="ks-stats-grid">
        {stats.map((s, i) => (
          <motion.div
            className="ks-stat"
            key={s.label}
            initial={{ opacity: 0, y: 34, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -8 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <strong>
              <CountUp to={s.value} suffix={s.suffix} />
            </strong>
            <i>✦</i>
            <span>{s.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ================================
   SHOP BY OCCASION
================================ */

function Occasions() {
  return (
    <section className="ks-occasions" aria-label="Shop by occasion">
      <div className="ks-occasion-grid">
        {occasions.map((o, i) => (
          <motion.div
            key={o.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.65, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to="/shop" className="ks-occasion">
              <span className="ks-occasion-icon">{o.icon}</span>
              <h3>{o.title}</h3>
              <p>{o.text}</p>
              <span className="ks-occasion-go">
                Explore <ArrowUpRight size={16} />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ================================
   CTA BANNER
================================ */

function CtaBanner() {
  return (
    <section className="ks-cta">
      <motion.div
        className="ks-cta-botanical-wrap"
        animate={{ y: [0, -12, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <Botanical className="ks-cta-botanical" />
      </motion.div>

      <motion.div
        className="ks-cta-inner"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="section-kicker">YOUR NEXT OCCASION</span>
        <h2>
          Drape yourself in <em>grace.</em>
        </h2>
        <p>Let us help you find the piece that tells your story.</p>
        <div className="ks-cta-actions">
          <Magnetic>
            <Link className="ks-btn-gold ks-shine" to="/shop">
              Explore the collection <ArrowRight size={17} />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link className="ks-btn-outline" to="/contact">
              Talk to our studio
            </Link>
          </Magnetic>
        </div>
      </motion.div>
    </section>
  );
}

/* ================================
   FOOTER
================================ */

function SiteFooter() {
  return (
    <footer className="ks-footer">
      <motion.div
        className="ks-footer-grid"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
      >
        <div className="ks-footer-brand">
          <div className="ks-footer-logo">
            KANI'S <b>STUDIO</b> <i>✦</i>
          </div>
          <p>
            Curated elegance, made with love. Timeless Indian attire for every
            moment.
          </p>
        </div>

        <div>
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/about">Our Story</Link>
          <Link to="/insights">Insights</Link>
        </div>

        <div>
          <h4>Visit &amp; write</h4>
          <span>
            <Heart size={15} /> {BRAND.person}
          </span>
          <a href={`mailto:${BRAND.email}`}>
            <Mail size={15} /> {BRAND.email}
          </a>
          <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`}>
            <Phone size={15} /> {BRAND.phone}
          </a>
          <span>
            <MapPin size={15} /> {BRAND.address}
          </span>
        </div>
      </motion.div>

      <div className="ks-footer-bottom">
        <span>© {new Date().getFullYear()} Kani's Studio. All rights reserved.</span>
        <span>Crafted with care ✿</span>
      </div>
    </footer>
  );
}

/* ================================
   HERO TITLE (word-by-word mask reveal)
================================ */

function HeroTitle({ ready }) {
  const lines = [["Elegance", "woven"], ["into", "every"], ["moment."]];
  let n = 0;

  return (
    <h1 aria-label="Elegance woven into every moment.">
      {lines.map((line, li) => (
        <span className="h1-line" key={li} aria-hidden="true">
          {line.map((w) => {
            const i = n++;
            const word = (
              <span className="word-mask" key={w}>
                <motion.span
                  className="word"
                  initial={{ y: "115%", rotate: 4 }}
                  animate={ready ? { y: "0%", rotate: 0 } : { y: "115%", rotate: 4 }}
                  transition={{
                    duration: 0.9,
                    delay: ready ? 0.25 + i * 0.09 : 0,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                >
                  {w}
                </motion.span>
              </span>
            );
            return li === 2 ? <em key={w}>{word}</em> : word;
          })}
        </span>
      ))}
    </h1>
  );
}

/* ================================
   HOMEPAGE
================================ */

function Home({ ready }) {
  const { scrollY } = useScroll();
  const small = useIsMobile(650);
  const reduce = useReducedMotion();

  // scroll effect (phones + laptops)
  const sy = useTransform(scrollY, [0, 700], [0, small ? 40 : 90]);
  const sScale = useTransform(scrollY, [0, 700], [1, small ? 1.05 : 1.09]);
  const sRotate = useTransform(scrollY, [0, 700], [0, small ? 1.5 : 2.5]);
  const haloY = useTransform(scrollY, [0, 700], [0, small ? -20 : -50]);
  const copyY = useTransform(scrollY, [0, 600], [0, small ? 0 : -40]);
  const hintOpacity = useTransform(scrollY, [0, 140], [1, 0]);

  // mouse effect (laptops/desktops only)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 80, damping: 18 });
  const smy = useSpring(my, { stiffness: 80, damping: 18 });
  const moveX = useTransform(smx, [-0.5, 0.5], [-18, 18]);
  const moveY = useTransform(smy, [-0.5, 0.5], [-12, 12]);
  const tiltY = useTransform(smx, [-0.5, 0.5], [-7, 7]);
  const tiltX = useTransform(smy, [-0.5, 0.5], [5, -5]);

  const onPointerMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const show = (delay = 0, y = 24) => ({
    initial: { opacity: 0, y },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y },
    transition: { duration: 0.8, delay: ready ? delay : 0 },
  });

  // "Scroll to explore" -> smooth scroll to the next section
  const scrollToExplore = () => {
    document
      .getElementById("highlights")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <section className="hero" id="home">
        {/* floating gold sparkles */}
        {!reduce &&
          sparkles.map((s, i) => (
            <motion.span
              key={i}
              className="hero-sparkle"
              aria-hidden="true"
              style={{ left: s.l, top: s.t, fontSize: s.s }}
              initial={{ opacity: 0 }}
              animate={
                ready
                  ? { opacity: [0.2, 0.9, 0.2], y: [0, -16, 0], rotate: [0, 90, 180] }
                  : { opacity: 0 }
              }
              transition={{
                duration: 5 + i,
                delay: ready ? s.d : 0,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ✦
            </motion.span>
          ))}

        <motion.div className="hero-copy" style={{ y: copyY }}>
          <motion.div className="eyebrow" {...show(0.1, 12)}>
            <span className="flower-mark">✿</span>
            <span className="gold-dot">•</span>
            <span>Curated elegance · Made with love</span>
          </motion.div>

          <HeroTitle ready={ready} />

          <motion.div
            className="gold-rule"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: ready ? 1 : 0 }}
            transition={{ duration: 0.8, delay: ready ? 0.8 : 0 }}
            style={{ originX: 0 }}
          />

          <motion.p className="hero-description" {...show(0.9, 16)}>
            Discover timeless Indian attire, thoughtfully selected for the woman
            who carries tradition with effortless grace.
          </motion.p>

          <motion.div className="hero-actions" {...show(1.05, 16)}>
            <Magnetic>
              <Link className="ks-btn-gold ks-shine" to="/shop">
                Explore the collection <ArrowRight size={17} />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link className="ks-btn-outline" to="/about">
                Our story
              </Link>
            </Magnetic>
          </motion.div>

          <motion.button
            type="button"
            className="explore-link"
            onClick={scrollToExplore}
            aria-label="Scroll down to explore"
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ delay: ready ? 1.3 : 0 }}
            style={{ opacity: hintOpacity }}
          >
            <span className="scroll-icon">
              <motion.i
                animate={{ y: [-6, 6, -6], opacity: [1, 0.35, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            <span>Scroll to explore</span>
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{ display: "inline-flex" }}
            >
              <ArrowRight size={16} style={{ transform: "rotate(90deg)" }} />
            </motion.span>
          </motion.button>

          <Botanical className="copy-botanical" />
        </motion.div>

        <motion.div
          className="hero-visual"
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          initial={{ opacity: 0, scale: 0.96, clipPath: "inset(0 0 100% 0)" }}
          animate={
            ready
              ? { opacity: 1, scale: 1, clipPath: "inset(0 0 0% 0)" }
              : { opacity: 0, scale: 0.96, clipPath: "inset(0 0 100% 0)" }
          }
          transition={{
            duration: 1.3,
            delay: ready ? 0.3 : 0,
            ease: [0.77, 0, 0.18, 1],
          }}
        >
          <motion.div className="image-halo" style={{ y: haloY }} />

          <motion.div
            className="hero-photo"
            style={{
              y: sy,
              scale: sScale,
              rotate: sRotate,
              x: moveX,
              translateY: moveY,
              rotateX: tiltX,
              rotateY: tiltY,
              transformPerspective: 1000,
            }}
          >
            <motion.div
              className="hero-float"
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src="/images/hero-reference.png"
                alt="Model wearing an emerald green and gold traditional saree"
              />
            </motion.div>
          </motion.div>

          <span className="image-caption">THE ART OF INDIAN ELEGANCE</span>
        </motion.div>

        <div className="top-botanical"><Botanical /></div>
      </section>

      <div className="benefit-strip" id="highlights" aria-label="Kani's Studio highlights">
        <div className="marquee-track">
          {[...benefits, ...benefits].map((item, index) => (
            <span className="benefit-item" key={`${item}-${index}`}>
              {item}<i>✦</i>
            </span>
          ))}
        </div>
      </div>

      <StatsStrip />

      <section className="below-fold tight" id="collections">
        <Reveal>
          <span className="section-kicker">A WORLD OF GRACE</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2>Tradition, with a touch of <em>you.</em></h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p>Explore pieces chosen to make your moments feel unforgettable.</p>
        </Reveal>
      </section>

      <Occasions />

      <section className="below-fold" id="contact">
        <Reveal>
          <span className="section-kicker">WE WOULD LOVE TO HEAR FROM YOU</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2>Find something <em>beautiful.</em></h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p>Get in touch with Kani's Studio for help with your next occasion.</p>
          <Link className="ks-page-link" to="/contact">
            Contact our studio <ArrowRight size={17} />
          </Link>
        </Reveal>
      </section>

      <CtaBanner />
    </main>
  );
}

/* ================================
   CRAFTSMANSHIP PAGE
================================ */

function Craftsmanship() {
  const details = [
    {
      icon: <Gem size={25} />,
      title: "Thoughtful details",
      description:
        "The little details bring character, beauty and individuality to every look.",
    },
    {
      icon: <Leaf size={25} />,
      title: "Timeless elegance",
      description:
        "A celebration of Indian style that feels graceful beyond passing trends.",
    },
    {
      icon: <Heart size={25} />,
      title: "Chosen with care",
      description:
        "A thoughtful approach to selecting pieces for meaningful occasions.",
    },
  ];

  return (
    <main className="ks-inner-page">
      <section className="ks-page-hero ks-craft-hero">
        <span className="section-kicker">THE ART BEHIND THE BEAUTY</span>
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Beauty in every <em>detail.</em>
        </motion.h1>
        <div className="gold-rule" />
        <p>
          Discover the thought, artistry and attention to detail that inspire
          the Kani's Studio experience.
        </p>
        <Botanical className="ks-page-botanical" />
      </section>

      <section className="ks-craft-feature">
        <motion.div
          className="ks-craft-image"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
        >
          <img
            src="/images/hero-reference.png"
            alt="Traditional Indian attire with intricate styling"
          />
        </motion.div>
        <motion.div
          className="ks-craft-copy"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="section-kicker">THE STUDIO PHILOSOPHY</span>
          <h2>Tradition, thoughtfully <em>celebrated.</em></h2>
          <p>
            We believe elegance lives in the details. The way a fabric falls,
            the richness of a colour and the feeling of wearing something
            special all come together to create a memorable look.
          </p>
          <Link className="ks-page-link" to="/about">
            Discover our story <ArrowRight size={17} />
          </Link>
        </motion.div>
      </section>

      <section className="ks-craft-values">
        <div className="ks-section-heading">
          <span className="section-kicker">WHAT MATTERS TO US</span>
          <h2>Our approach to <em>elegance.</em></h2>
        </div>

        <div className="ks-value-grid">
          {details.map((item, index) => (
            <motion.article
              className="ks-value-card"
              key={item.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
            >
              <div className="ks-value-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ================================
   SCROLL PROGRESS + BACK TO TOP
================================ */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.3 });
  return <motion.div className="scroll-progress" style={{ scaleX }} />;
}

function BackToTop() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (y) => setShow(y > 700));
  }, [scrollY]);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          className="back-to-top"
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ================================
   ROUTE SCROLL HANDLING
================================ */

// Shop pages already leave room under the fixed header (header.css:
// main.shop { padding-top }). Every other page gets a spacer instead.
const SHOP_PATHS = /^\/(shop|cart|checkout|orders)(\/|$)/;

function RouteContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  // Admin and the customer sign-in page are full-screen and have their own look
  const hideChrome = isAdmin || location.pathname === "/account";
  const needsSpacer = !hideChrome && !SHOP_PATHS.test(location.pathname);

  // Splash plays once per browser session; skipped for reduced-motion users
  const [ready, setReady] = useState(() => {
    if (typeof window === "undefined") return true;
    let seen = false;
    try {
      seen = sessionStorage.getItem("ks-splash") === "1";
    } catch {
      seen = false;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return seen || reduce;
  });

  const finishSplash = useCallback(() => {
    try {
      sessionStorage.setItem("ks-splash", "1");
    } catch {
      /* storage unavailable, ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      const timer = window.setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);

  return (
    <>
      <AnimatePresence>
        {!ready && !isAdmin && <Splash key="splash" onDone={finishSplash} />}
      </AnimatePresence>

      {!hideChrome && <ScrollProgress />}
      {!hideChrome && <SiteHeader />}
      {needsSpacer && <div className="kh-spacer" aria-hidden="true" />}

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Routes>
          <Route path="/" element={<Home ready={ready} />} />
          <Route path="/about" element={<About />} />

          {/* Customer sign-in / register / forgot / reset / verify (public) */}
          <Route path="/account" element={<CustomerAuth />} />

          {/* Customer storefront: sign-in required, live data from the admin */}
          <Route path="/shop" element={<RequireCustomer><Shop /></RequireCustomer>} />
          <Route path="/shop/:slug" element={<RequireCustomer><ProductPage /></RequireCustomer>} />
          <Route path="/cart" element={<RequireCustomer><Cart /></RequireCustomer>} />
          <Route path="/checkout" element={<RequireCustomer><Checkout /></RequireCustomer>} />
          <Route path="/orders" element={<RequireCustomer><MyOrders /></RequireCustomer>} />
          <Route path="/orders/:orderId" element={<RequireCustomer><OrderPage /></RequireCustomer>} />

          {/* Old link keeps working */}
          <Route path="/collections" element={<Navigate to="/shop" replace />} />

          <Route path="/craftsmanship" element={<Craftsmanship />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>

      {/* One bag drawer for the whole site. The header bag icon opens it. */}
      {!hideChrome && <CartDock />}

      {!hideChrome && <SiteFooter />}
      {!hideChrome && <BackToTop />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteContent />
    </BrowserRouter>
  );
}