gsap.registerPlugin(SplitText);
function runIntroAnimations(blockSelector) {
    const startColor = "#ff4d17";
    const endColor = "#ffffff";

    const contentBlock = document.querySelector(blockSelector);
    console.log(contentBlock);

    const textSplit = contentBlock.querySelector("h1");
    const subheadingBlocks = contentBlock.querySelectorAll("[subheading]");

    if (!textSplit) return;

    new SplitText(textSplit, {
        type: "words",
        wordsClass: "word",
        autoSplit: true,
        onSplit: function (self) {
            const words = self.words;

            const tl = gsap.timeline();

            tl.to(words, {
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
                    0.4
                )
                .to(
                    subheadingBlocks,
                    {
                        opacity: 1,
                        duration: 0.6,
                        ease: "power2.inOut",
                    },
                    "<"
                );
            if (document.querySelector(".progress_fixed")) {
                tl.to(".progress_fixed", {
                    opacity: 1,
                });
            }
        },
    });
}

function runBlockAnimations(sectionSelector) {
    const startColor = "#ff4d17";
    const endColor = "#ffffff";

    const section = document.querySelector(sectionSelector);

    const textAnimateEl = section.querySelector("[animate-block]");
    console.log(textAnimateEl);
    if (!textAnimateEl) return;

    const textSplit = textAnimateEl.querySelector("h2");
    const paraWrap = textAnimateEl.querySelector("[subheading]");
    const textAnimateTrigger = section.querySelector("[text-trig='1']");
    const textAnimateTrigger2 = section.querySelector("[text-trig='2']");

    if (textSplit) {
        new SplitText(textSplit, {
            type: "words",
            wordsClass: "word",
            autoSplit: true,
            onSplit: function (self) {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: textAnimateTrigger,
                        start: "top center",
                        end: "bottom bottom",
                        scrub: true,
                        // markers: true,
                    },
                });
                const words = self.words;
                tl.to(textSplit, { opacity: 1, duration: 0 })
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

                gsap
                    .timeline({
                        scrollTrigger: {
                            trigger: textAnimateTrigger2,
                            start: "top 90%",
                            end: "bottom bottom",
                            scrub: true,
                        },
                    })
                    .to(
                        paraWrap,
                        {
                            y: "0%",
                            opacity: 1,
                            ease: "power2.out",
                        },
                        "<"
                    );
            },
        });
    }
}

function runHeadingAnimations(
    headingSelector,
    triggerSelector,
    triggerStartD,
    triggerEndD,
    triggerStartM,
    triggerEndM
) {
    const startM = triggerStartM ?? triggerStartD;
    const endM = triggerEndM ?? triggerEndD;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const start = isMobile ? startM : triggerStartD;
    const end = isMobile ? endM : triggerEndD;

    const el = document.querySelector(headingSelector);
    //
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: triggerSelector,
            start: start,
            end: end,
            scrub: true,
            // markers: true,
        },
    });

    tl.to(el.querySelectorAll(".word"), {
        opacity: 1,
        color: startColor,
        duration: 0.3,
        ease: "power2.inOut",
        stagger: 0.1,
    }).to(
        el.querySelectorAll(".word"),
        {
            color: endColor,
            duration: 0.3,
            stagger: 0.1,
            ease: "power2.inOut",
        },
        0.3
    );
}
function runHeadingBlockAnimations(
    headingSelector,
    subheadingSelector,
    triggerSelector,
    triggerStartD,
    triggerEndD,
    triggerStartM,
    triggerEndM
) {
    const startM = triggerStartM ?? triggerStartD;
    const endM = triggerEndM ?? triggerEndD;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const start = isMobile ? startM : triggerStartD;
    const end = isMobile ? endM : triggerEndD;

    const el = document.querySelector(headingSelector);
    const subEl = document.querySelector(subheadingSelector);
    //
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: triggerSelector,
            start: start,
            end: end,
            scrub: true,
            // markers: true,
        },
    });

    tl.to(el.querySelectorAll(".word"), {
        opacity: 1,
        color: startColor,
        duration: 0.3,
        ease: "power2.inOut",
        stagger: 0.1,
    })
        .to(
            el.querySelectorAll(".word"),
            {
                color: endColor,
                duration: 0.3,
                stagger: 0.1,
                ease: "power2.inOut",
            },
            0.3
        )
        .to(
            subEl,
            {
                opacity: 1,
                duration: 0.3,
                ease: "power2.inOut",
            },
            0.5
        );
}