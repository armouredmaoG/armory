/*** /HOME/ Transition between 1st and 2nd section ***/
(function () {
    const sourceBuiltTl = gsap.timeline({
        scrollTrigger: {
            trigger: "[source-transition-1]",
            start: "top bottom",
            end: "bottom bottom",
            // markers: true,
            scrub: true,
        },
    });
    sourceBuiltTl
        .to(".progress_fixed", {
            opacity: 0,
        })
        .to(
            ".hero_wrap",
            {
                opacity: 0,
                pointerEvents: "none",
            },
            "<"
        )
        .to(
            "#built",
            {
                opacity: 1,
            },
            "<0.4"
        )
        .to(
            window.CloudShaderAPI,
            {
                progress: 1,
                duration: 1,
            },
            "<0.2"
        );
})();

/*** /HOME/ Transition between 4th and 5th section ***/
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "[drone-transition-trigger]",
                start: "top bottom",
                end: "bottom bottom",
                scrub: true,
            },
        });

        // Fade out the video section
        tl.to(
            "#drone-view",
            {
                opacity: 0,
                ease: "none",
            },
            0
        ); // The '0' makes it start at the exact beginning of the timeline

        // Fade in the content section at the same time
        tl.to(
            "[redefine-content-sec]",
            {
                opacity: 1,
                ease: "none",
            },
            "+=0.1"
        )
            .to('[static-content="1"]', {
                opacity: 1,
                ease: "none",
            })
            .to('[static-content="1"] h2 .word', {
                opacity: 1,
                color: startColor,
                stagger: 0.1,
                ease: "none",
            })
            .to('[static-content="1"] h2 .word', {
                opacity: 1,
                color: endColor,
                stagger: 0.1,
                ease: "none",
            })
            .to('[static-content="1"]', {
                opacity: 0,
                ease: "none",
            })
            .to('[static-content="2"]', {
                opacity: 1,
                ease: "none",
            })
            .to('[static-content="2"] h2 .word', {
                opacity: 1,
                color: startColor,
                stagger: 0.1,
                ease: "none",
            })
            .to('[static-content="2"] h2 .word', {
                opacity: 1,
                color: endColor,
                stagger: 0.1,
                ease: "none",
            })
            .to('[static-content="2"] .u-button-wrapper', {
                opacity: 1,
                ease: "none",
            });
    }
});