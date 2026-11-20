import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    motion,
    useScroll,
    useTransform,
    useInView,
    useReducedMotion,
    animate,
} from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import "./Insights.css";

/* =====================================================
   CONTENT  (all numbers / quotes below are PLACEHOLDERS.
   Replace them with your real, sourced figures.)
===================================================== */

const heroLines = [["Where", "tradition", "meets"], ["what", "women", "want."]];

const introText =
    "Millions of women wear traditional attire for the moments that matter most. Yet finding pieces that are beautifully made, comfortable to wear and truly ready for the occasion is still harder than it should be.";

// outer -> inner (size is % of the container width)
const rings = [
    { label: "Indian ethnic wear buyers", value: "₹1.9L Cr", size: 100, cls: "r1" },
    { label: "Saree buyers", value: "₹78K Cr", size: 70, cls: "r2" },
    { label: "Occasion-wear shoppers", value: "₹24K Cr", size: 44, cls: "r3" },
    { label: "Kani's Studio", value: "₹3K Cr", size: 24, cls: "r4" },
];

const bigStats = [
    { value: 18, suffix: "%", label: "Yearly growth in ethnic wear demand" },
    { value: 450, suffix: "M+", label: "Women who wear traditional attire" },
    { value: 7, suffix: " in 10", label: "Shoppers who say good options are hard to find" },
];

const bars = [
    { label: "Quality of fabric", value: 91 },
    { label: "Comfortable fall and drape", value: 84 },
    { label: "Designs ready for the occasion", value: 78 },
    { label: "Fair and honest pricing", value: 69 },
];

const questions = [
    "What do you look for first in a saree?",
    "Which occasions do you shop for?",
    "What disappoints you most when buying online?",
    "How much do fabric and finish matter?",
    "What would you change about the last piece you bought?",
];

const voices = [
    {
        name: "Lakshmi",
        quote: "I wanted something that looked rich in photos and still felt light after hours of wearing it.",
    },
    {
        name: "Divya",
        quote: "Most shops show a lot but explain nothing. I want to know the fabric and how it will feel.",
    },
    {
        name: "Meena",
        quote: "For family functions I just want one piece I can trust, without searching through hundreds.",
    },
];

/* =====================================================
   HELPERS
===================================================== */

function Counter({ to, prefix = "", suffix = "", decimals = 0, duration = 1.6 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    const [n, setN] = useState(0);

    useEffect(() => {
        if (!inView) return;
        const controls = animate(0, to, {
            duration,
            ease: "easeOut",
            onUpdate: (v) => setN(v),
        });
        return () => controls.stop();
    }, [inView, to, duration]);

    return (
        <span ref={ref}>
            {prefix}
            {n.toFixed(decimals)}
            {suffix}
        </span>
    );
}

/* paragraph whose words light up as you scroll */
function ScrollWords({ text }) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 0.9", "end 0.5"],
    });
    const words = text.split(" ");

    return (
        <p className="ins-scrollwords" ref={ref}>
            {words.map((w, i) => (
                <ScrollWord
                    key={i}
                    word={w}
                    start={i / words.length}
                    end={(i + 1) / words.length}
                    progress={scrollYProgress}
                    reduce={reduce}
                />
            ))}
        </p>
    );
}

function ScrollWord({ word, start, end, progress, reduce }) {
    const opacity = useTransform(progress, [start, end], [0.16, 1]);
    return (
        <motion.span style={{ opacity: reduce ? 1 : opacity }}>{word} </motion.span>
    );
}

/* =====================================================
   SECTIONS
===================================================== */

function Hero() {
    const { scrollY } = useScroll();
    const patternY = useTransform(scrollY, [0, 600], [0, 140]);
    const copyY = useTransform(scrollY, [0, 500], [0, -50]);
    const copyOpacity = useTransform(scrollY, [0, 450], [1, 0.2]);

    const goDown = () =>
        document
            .getElementById("ins-market")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });

    let n = 0;

    return (
        <section className="ins-hero">
            <motion.div className="ins-hero-pattern" style={{ y: patternY }} aria-hidden="true" />
            <div className="ins-glow" aria-hidden="true" />

            <motion.div className="ins-hero-inner" style={{ y: copyY, opacity: copyOpacity }}>
                <motion.span
                    className="ins-kicker"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                >
                    <i /> Insights
                </motion.span>

                <h1 aria-label="Where tradition meets what women want.">
                    {heroLines.map((line, li) => (
                        <span className="h1-line" key={li} aria-hidden="true">
                            {line.map((w) => {
                                const i = n++;
                                const word = (
                                    <span className="word-mask" key={w}>
                                        <motion.span
                                            className="word"
                                            initial={{ y: "115%", rotate: 4 }}
                                            animate={{ y: "0%", rotate: 0 }}
                                            transition={{
                                                duration: 0.9,
                                                delay: 0.25 + i * 0.09,
                                                ease: [0.2, 0.8, 0.2, 1],
                                            }}
                                        >
                                            {w}
                                        </motion.span>
                                    </span>
                                );
                                return li === 1 ? <em key={w}>{word}</em> : word;
                            })}
                        </span>
                    ))}
                </h1>

                <motion.p
                    className="ins-hero-sub"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.0 }}
                >
                    A closer look at the space Kani's Studio was created to fill.
                </motion.p>

                <motion.button
                    type="button"
                    className="ins-scroll"
                    onClick={goDown}
                    aria-label="Scroll down"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                >
                    <span className="ins-scroll-line">
                        <motion.i
                            animate={{ y: ["-100%", "100%"] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </span>
                    Scroll
                </motion.button>
            </motion.div>
        </section>
    );
}

function Market() {
    return (
        <section className="ins-market" id="ins-market">
            <div className="ins-wrap">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="section-kicker">THE SPACE WE FILL</span>
                </motion.div>

                <ScrollWords text={introText} />

                <div className="ins-market-grid">
                    {/* nested circles */}
                    <div className="ins-rings">
                        <div className="ins-orbit" aria-hidden="true" />
                        {rings.map((r, i) => (
                            <motion.div
                                key={r.label}
                                className={`ins-ring ${r.cls}`}
                                style={{ width: `${r.size}%`, transformOrigin: "50% 100%" }}
                                initial={{ opacity: 0, scale: 0.55 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.9, delay: i * 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                            >
                                <span className="ins-ring-label">{r.label}</span>
                                <strong>{r.value}</strong>
                            </motion.div>
                        ))}
                    </div>

                    {/* big stats */}
                    <div className="ins-stat-list">
                        {bigStats.map((s, i) => (
                            <motion.div
                                className="ins-stat-row"
                                key={s.label}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ delay: i * 0.15 }}
                            >
                                <motion.span
                                    className="ins-stat-line"
                                    variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
                                    transition={{ duration: 1, delay: i * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                                />
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0, y: 24 },
                                        show: { opacity: 1, y: 0 },
                                    }}
                                    transition={{ duration: 0.7, delay: 0.2 + i * 0.15 }}
                                >
                                    <strong>
                                        <Counter to={s.value} suffix={s.suffix} />
                                    </strong>
                                    <span>{s.label}</span>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function BarRow({ label, value, index }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });

    return (
        <div className="ins-bar" ref={ref}>
            <div className="ins-bar-top">
                <span>{label}</span>
                <b>
                    <Counter to={value} suffix="%" duration={1.4} />
                </b>
            </div>
            <div className="ins-bar-track">
                <motion.span
                    className="ins-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: inView ? `${value}%` : 0 }}
                    transition={{ duration: 1.4, delay: index * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                />
            </div>
        </div>
    );
}

function Survey() {
    return (
        <section className="ins-survey">
            <div className="ins-wrap">
                <motion.h2
                    className="ins-h2"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                >
                    We asked women what <em>matters most.</em>
                </motion.h2>

                <div className="ins-survey-grid">
                    <div className="ins-bars">
                        <p className="ins-bars-note">Share of respondents who rated each point as important</p>
                        {bars.map((b, i) => (
                            <BarRow key={b.label} {...b} index={i} />
                        ))}
                    </div>

                    <motion.aside
                        className="ins-qcard"
                        initial={{ opacity: 0, y: 50, scale: 0.97 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                        <h3>Questions we asked</h3>
                        <ol>
                            {questions.map((q, i) => (
                                <motion.li
                                    key={q}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                                >
                                    {q}
                                </motion.li>
                            ))}
                        </ol>
                        <Link to="/contact" className="ins-qlink">
                            Share your thoughts <ArrowRight size={16} />
                        </Link>
                    </motion.aside>
                </div>
            </div>
        </section>
    );
}

function Voices() {
    return (
        <section className="ins-voices">
            <div className="ins-wrap">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="section-kicker">IN THEIR WORDS</span>
                    <h2 className="ins-h2">What women told us</h2>
                </motion.div>

                <div className="ins-voice-grid">
                    {voices.map((v, i) => (
                        <motion.figure
                            className="ins-voice"
                            key={v.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -8 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.7, delay: i * 0.14, ease: [0.2, 0.8, 0.2, 1] }}
                        >
                            <Quote size={28} className="ins-quote-icon" />
                            <blockquote>{v.quote}</blockquote>
                            <figcaption>
                                <span className="ins-avatar">{v.name[0]}</span>
                                {v.name}
                            </figcaption>
                        </motion.figure>
                    ))}
                </div>
            </div>
        </section>
    );
}

function InsightsCta() {
    return (
        <section className="ins-cta">
            <div className="ins-hero-pattern ins-cta-pattern" aria-hidden="true" />
            <motion.div
                className="ins-cta-inner"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8 }}
            >
                <h2>
                    Help us design what <em>you</em> would wear.
                </h2>
                <p>Tell us what you look for, and see how we are building it into every piece.</p>
                <div className="ins-cta-actions">
                    <Link className="ks-btn-gold ks-shine" to="/contact">
                        Share your thoughts <ArrowRight size={17} />
                    </Link>
                    <Link className="ks-btn-outline" to="/construction">
                        See the construction
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}

/* =====================================================
   PAGE
===================================================== */

export default function Insights() {
    return (
        <main className="ins-page">
            <Hero />
            <Market />
            <Survey />
            <Voices />
            <InsightsCta />
        </main>
    );
}