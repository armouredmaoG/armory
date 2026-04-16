/**** STICKY SECTION ****/

(function () {
    if (!window.matchMedia("(min-width: 1025px)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const startColor = "#ff4d17";
    const endColor = "#000";

    // â”€â”€â”€ 1. Dynamic trigger spacer generation â”€â”€â”€
    // Rule: N content wraps â†’ N-1 trigger spacers
    function generateTriggerSpacers() {
        const wraps = document.querySelectorAll(".sticky_content_wrap");
        const existingTrigger = document.querySelector("[sticky-trigger-group]");

        if (!existingTrigger || wraps.length < 2) return;

        const triggerCount = wraps.length - 1;
        const parent = existingTrigger.parentElement;

        // Remove all existing trigger spacers first
        parent
            .querySelectorAll("[sticky-trigger-group]")
            .forEach((el) => el.remove());

        // Clone the original trigger N-1 times
        for (let i = 0; i < triggerCount; i++) {
            const spacer = existingTrigger.cloneNode(true);
            parent.appendChild(spacer);
        }
    }

    // â”€â”€â”€ 2. Scroll-driven crossfade â”€â”€â”€
    function initStickyScroll() {
        const wraps = document.querySelectorAll(".sticky_content_wrap");
        const triggers = document.querySelectorAll("[sticky-trigger-group]");

        if (wraps.length < 2 || triggers.length === 0) return;

        const getTargets = (wrap) => {
            const container = wrap.querySelector(".u-display-contents");
            //   return container ? Array.from(container.children) : [];
            return container ? container.querySelector(".u-content-wrapper") : [];
        };

        // Set initial state
        wraps.forEach((wrap, i) => {
            // Text initial state
            gsap.set(getTargets(wrap), { opacity: i === 0 ? 1 : 0 });
        });

        // For each trigger spacer, crossfade from wrap[i] â†’ wrap[i+1]
        triggers.forEach((trigger, i) => {
            const current = wraps[i];
            const next = wraps[i + 1];

            if (!current || !next) return;

            const currentTargets = getTargets(current);
            const nextTargets = getTargets(next);

            // 1. Text Animation: forward-stagger order, time-based.
            ScrollTrigger.create({
                trigger: trigger,
                start: "top center",
                onEnter: () => {
                    // Scrolling down: current text moves UP out of view, next text slides UP into view
                    gsap.to(currentTargets, {
                        opacity: 0,
                        y: -10,
                        duration: 0.3,
                        stagger: 0.1,
                        overwrite: true,
                    });
                    gsap.fromTo(
                        nextTargets,
                        { y: 10 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.3,
                            stagger: 0.1,
                            delay: 0.2,
                            overwrite: true,
                        }
                    );
                },
                onLeaveBack: () => {
                    // Scrolling up: maintain the exact same unified upwards motion behavior requested
                    gsap.to(nextTargets, {
                        opacity: 0,
                        y: -10, // Exiting text moves upward
                        duration: 0.3,
                        stagger: 0.1,
                        overwrite: true,
                    });
                    gsap.to(currentTargets, {
                        opacity: 1,
                        y: 0,
                        duration: 0.3,
                        stagger: 0.1,
                        delay: 0.2,
                        overwrite: true,
                    });
                },
            });

            // 2. Parallax Media Animation: strictly scrub-based.
            const currentTab = current.querySelector(".tab_right");
            const nextTab = next.querySelector(".tab_right");

            if (currentTab && nextTab) {
                gsap
                    .timeline({
                        scrollTrigger: {
                            trigger: trigger,
                            start: "top bottom",
                            end: "bottom bottom",
                            scrub: true,
                        },
                    })
                    .to(currentTab, { y: "-=50%", ease: "none" }, 0)
                    .to(nextTab, { y: "0%", ease: "none" }, 0);
            }
        });
    }

    // â”€â”€â”€ 3. Heading word color split â”€â”€â”€
    function initHeadingColorSplit() {
        const wraps = document.querySelectorAll(".sticky_content_wrap");
        const triggers = document.querySelectorAll("[sticky-trigger-group]");

        // Split all headings & set initial color
        wraps.forEach((wrap) => {
            const heading = wrap.querySelector(".u-heading h2");
            if (!heading) return;
            new SplitText(heading, { types: "words", wordsClass: "headWord" });
            //   gsap.set(heading.querySelectorAll(".headWord"), { color: startColor });
        });
        // Track active timelines per wrap so we can kill the ENTIRE timeline
        const activeTimelines = new Map();

        const playColorIn = (wrap) => {
            const words = wrap.querySelectorAll(".headWord");
            const heading = wrap.querySelector(".u-heading");
            if (!words.length || !heading) return;

            // Kill any existing timeline for this wrap first
            if (activeTimelines.has(wrap)) {
                activeTimelines.get(wrap).kill();
            }

            gsap.set(words, { opacity: 0 });
            const tl = gsap
                .timeline()
                .to(heading, {
                    opacity: 1,
                    duration: 0,
                })
                .to(words, {
                    opacity: 1,
                    color: startColor,
                    duration: 0.3,
                    ease: "power2.inOut",
                    stagger: 0.1,
                })
                .to(
                    words,
                    {
                        color: endColor,
                        duration: 0.3,
                        stagger: 0.1,
                        ease: "power2.inOut",
                    },
                    0.3
                );

            activeTimelines.set(wrap, tl);
        };

        const hideHeading = (wrap) => {
            const heading = wrap.querySelector(".u-heading");
            const words = wrap.querySelectorAll(".headWord");
            if (!heading) return;

            // Kill the entire timeline, not just individual tweens
            if (activeTimelines.has(wrap)) {
                activeTimelines.get(wrap).kill();
                activeTimelines.delete(wrap);
            }

            gsap.set(heading, { opacity: 0 });
            gsap.set(words, { opacity: 0 });
        };

        triggers.forEach((trigger, i) => {
            const current = wraps[i];
            const next = wraps[i + 1];
            if (!current || !next) return;

            ScrollTrigger.create({
                trigger: trigger,
                start: "top center",
                onEnter: () => {
                    hideHeading(current);
                    playColorIn(next);
                },
                onLeaveBack: () => {
                    hideHeading(next);
                    playColorIn(current);
                },
            });
        });
    }

    // â”€â”€â”€ 4. Progress bar â”€â”€â”€
    const progressBar = document.querySelector("[sticky-scroll-indicator]");
    const capabilitiesSection = document.querySelector("#capabilities");

    if (progressBar && capabilitiesSection) {
        ScrollTrigger.create({
            trigger: capabilitiesSection,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                gsap.set(progressBar, { width: `${self.progress * 100}%` });
            },
        });
    }

    // â”€â”€â”€ Init â”€â”€â”€
    generateTriggerSpacers();
    initStickyScroll();
    initHeadingColorSplit();
})();