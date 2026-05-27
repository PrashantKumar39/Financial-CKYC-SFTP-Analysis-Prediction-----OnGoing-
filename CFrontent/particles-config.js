// particles.js loaded from CDN in index.html
particlesJS("particles-js", {
    particles: {
        number: { value: 50, density: { enable: true, value_area: 900 } },
        color: { value: "#3b82f6" },
        shape: { type: "circle" },
        opacity: { value: 0.25, random: true },
        size: { value: 2, random: true },
        line_linked: {
            enable: true,
            distance: 130,
            color: "#3b82f6",
            opacity: 0.1,
            width: 1
        },
        move: {
            enable: true,
            speed: 1.0,
            direction: "none",
            random: true,
            out_mode: "out"
        }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: true, mode: "grab" },
            onclick: { enable: true, mode: "push" },
            resize: true
        },
        modes: {
            grab: { distance: 160, line_linked: { opacity: 0.4 } },
            push: { particles_nb: 3 }
        }
    },
    retina_detect: true
});