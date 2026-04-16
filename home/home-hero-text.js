gsap.set("[detected-info]", { opacity: 0 });

function setupHeroAnimations({ frameCount, label }) {
    const f = (frame) => frame / (frameCount - 1);

    const ANIMATIONS = [
        {
            sel: "#home-hero h1",
            to: { opacity: 0 },
            start: f(20),
            end: f(65),
        },
        {
            sel: "#home-hero [subheading]",
            to: { opacity: 0 },
            start: f(20),
            end: f(65),
        },
        {
            sel: "[detected-info]",
            to: { opacity: 1 },
            start: f(67),
            end: f(100),
            out: [f(110), f(160)],
        },
        {
            sel: "[last-dialogue]",
            to: { opacity: 1 },
            start: f(600),
            end: f(680),
        },
        {
            sel: "[product_label]",
            to: { opacity: 1 },
            start: f(600),
            end: f(680),
        },
    ];

    const DIALOGUE_ANIMATIONS = [
        {
            sel: '[dialogue="1"]',
            start: f(170),
            end: f(190),
            out: [f(280), f(300)],
        },
        {
            sel: '[dialogue="2"]',
            start: f(394),
            end: f(414),
            out: [f(470), f(490)],
        },
        {
            sel: '[dialogue="3"]',
            start: f(500),
            end: f(520),
            out: [f(530), f(590)],
        },
    ];

    const master = gsap.timeline({ paused: true });

    master.set({}, {}, 1);

    ANIMATIONS.forEach(({ sel, to, start, end, out }) => {
        if (to) {
            master.to(
                sel,
                {
                    ...to,
                    duration: end - start,
                    ease: "none",
                },
                start
            );
        }

        if (out) {
            master.to(
                sel,
                {
                    opacity: 0,
                    duration: out[1] - out[0],
                    ease: "none",
                },
                out[0]
            );
        }
    });

    DIALOGUE_ANIMATIONS.forEach(({ sel, start, end, out }) => {
        const words = document.querySelectorAll(`${sel} .word`);
        const duration = end - start;

        master.to(
            words,
            {
                opacity: 1,
                color: startColor,
                duration: duration * 0.6,
                ease: "power2.inOut",
                stagger: { each: duration / words.length },
            },
            start
        );

        master.to(
            words,
            {
                color: endColor,
                duration: duration * 0.6,
                ease: "power2.inOut",
                stagger: { each: duration / words.length },
            },
            start + duration * 0.4
        );

        if (out) {
            master.to(
                sel,
                {
                    opacity: 0,
                    duration: out[1] - out[0],
                    ease: "none",
                },
                out[0]
            );
        }
    });

    ScrollTrigger.create({
        trigger: "[hero-wrap]",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
            master.progress(self.progress);
            gsap.set(".progress_bar_line", {
                height: `${self.progress * 100}%`,
            });
        },
    });
}

// Run immediately if seq:init already fired, otherwise wait
if (window.__seqInit?.["hero-seq"]) {
    setupHeroAnimations(window.__seqInit["hero-seq"]);
} else {
    window.addEventListener("seq:init", ({ detail }) => {
        if (detail.label === "hero-seq") setupHeroAnimations(detail);
    });
}