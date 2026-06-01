// Nav behaviour, split into three concerns:
//
// 1) CONTRAST observer — uses a 0-height intersection band positioned at
//    the bottom edge of the nav. A section "intersects" exactly when it
//    sits under the nav (no matter its height). This avoids the
//    midline-heuristic problem where a short section flips contrast
//    early or late depending on its size.
//
// 2) ACTIVE-LINK observer — uses a midline band to track what the user
//    is currently reading. Underline + opacity follow this, independent
//    of the nav background.
//
// Nav links are always visible (no mobile hamburger).

const NAV_HEIGHT_VAR = "--nav-height";

function readNavHeight() {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(NAV_HEIGHT_VAR)
    .trim();
  // Accept rem or px
  if (v.endsWith("rem")) return parseFloat(v) * 16;
  if (v.endsWith("px")) return parseFloat(v);
  return parseFloat(v) || 72;
}

export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll("[data-nav-link]"));
  // Key by the hash fragment only (e.g. "#projects"). Hrefs are absolute to
  // the home page (e.g. "/#projects") so they route from detail pages, so we
  // can't match on the full href.
  const linkByHash = new Map(links.map((a) => [a.hash, a]));

  const sections = Array.from(document.querySelectorAll("[data-section]"));
  if (!sections.length) return;

  // ---- 1) Contrast: which section sits under the nav band? ----
  function applyContrastFor(section) {
    nav.classList.toggle("is-on-purple", section.dataset.mode === "purple");
  }

  function buildContrastObserver() {
    const navH = readNavHeight();
    // 0-height intersection line at y = navH (just under the nav).
    // top inset = -(navH), bottom inset = -(viewport - navH - 1).
    // Using -100% for bottom collapses the root to a thin line at the top edge.
    const rootMargin = `-${navH}px 0px -${Math.max(0, window.innerHeight - navH - 1)}px 0px`;
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) applyContrastFor(entry.target);
        });
      },
      { rootMargin, threshold: 0 }
    );
  }

  let contrastObserver = buildContrastObserver();
  sections.forEach((s) => contrastObserver.observe(s));

  // Rebuild on resize — rootMargin depends on innerHeight.
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      contrastObserver.disconnect();
      contrastObserver = buildContrastObserver();
      sections.forEach((s) => contrastObserver.observe(s));
      syncContrastOnce();
    }, 150);
  });

  // Initial sync — find the section currently under the nav band synchronously,
  // because IntersectionObserver doesn't fire until after a paint.
  function syncContrastOnce() {
    const navH = readNavHeight();
    const target = sections.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= navH && r.bottom > navH;
    });
    if (target) applyContrastFor(target);
  }
  syncContrastOnce();

  // ---- 2) Active link: midline tracker ----
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const hash = `#${entry.target.id}`;
        links.forEach((a) => a.classList.remove("is-active"));
        const match = linkByHash.get(hash);
        if (match) match.classList.add("is-active");
      });
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((s) => activeObserver.observe(s));
}
