// Scroll reveal — fade + lift on first viewport entry.
// Unobserves each element after revealing so it doesn't replay on re-scroll.

export function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  // If the user prefers reduced motion, just mark everything revealed immediately.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.05 }
  );

  els.forEach((el) => io.observe(el));
}
