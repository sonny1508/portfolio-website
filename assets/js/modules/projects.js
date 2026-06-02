// Projects section: tab filtering + pagination.
//
// - Tabs filter cards by data-category. "all" shows everything.
// - Switching tabs resets to page 1.
// - Pagination shows 4 cards per page from the filtered set.
// - Prev/Next buttons hide entirely (opacity 0, no pointer events)
//   when at the start/end of pagination, not just disabled.
// - Ghost slots are appended to make every page occupy the full 4-slot
//   grid shape, so height doesn't jump between a full page and a partial one.
// - Page/tab changes fade the grid out, swap content, then fade back in
//   so switching feels smooth rather than an instant jump. Honors
//   prefers-reduced-motion by skipping the fade.

const PAGE_SIZE = 4;
const FADE_MS = 200; // matches --dur-fast

export function initProjects() {
  const root = document.querySelector("[data-projects]");
  if (!root) return;

  const grid = root.querySelector("[data-projects-grid]");
  const cards = Array.from(grid.querySelectorAll("[data-card]"));
  const tabs = Array.from(root.querySelectorAll("[data-tab]"));
  const prev = root.querySelector("[data-page-prev]");
  const next = root.querySelector("[data-page-next]");
  const indicator = root.querySelector("[data-page-indicator]");

  // Build a single ghost template (cloned from a real card so layout
  // dimensions match exactly), then clone it as needed each render.
  const ghostTemplate = (() => {
    if (!cards[0]) return null;
    const t = cards[0].cloneNode(true);
    t.classList.add("card--ghost");
    t.removeAttribute("href");
    t.setAttribute("aria-hidden", "true");
    t.setAttribute("tabindex", "-1");
    t.removeAttribute("data-card");
    t.removeAttribute("data-category");
    t.removeAttribute("data-tags");
    return t;
  })();

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let activeTab = "all";
  let page = 1;
  let switching = false;

  // Fade the grid out, run the mutation + re-render while it's hidden,
  // then fade back in. Under reduced motion just swap instantly.
  function transition(mutate) {
    if (reduceMotion) {
      mutate();
      render();
      return;
    }
    if (switching) return;
    switching = true;
    grid.classList.add("is-switching");
    window.setTimeout(() => {
      mutate();
      render();
      requestAnimationFrame(() => {
        grid.classList.remove("is-switching");
        switching = false;
      });
    }, FADE_MS);
  }

  function filtered() {
    if (activeTab === "all") return cards;
    return cards.filter((c) => c.dataset.category === activeTab);
  }

  function clearGhosts() {
    grid.querySelectorAll(".card--ghost").forEach((g) => g.remove());
  }

  function renderGhosts(count) {
    clearGhosts();
    if (!ghostTemplate) return;
    for (let i = 0; i < count; i++) {
      grid.appendChild(ghostTemplate.cloneNode(true));
    }
  }

  function render() {
    const list = filtered();
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const visibleSet = new Set(list.slice(start, end));

    cards.forEach((c) => {
      c.hidden = !visibleSet.has(c);
    });

    // Pad with ghost slots so the grid always occupies PAGE_SIZE cells
    renderGhosts(PAGE_SIZE - visibleSet.size);

    // Pagination button visibility
    prev.hidden = page <= 1;
    next.hidden = page >= totalPages;

    // Indicator text
    if (totalPages <= 1) {
      indicator.textContent =
        list.length === 0
          ? "No projects yet"
          : `${list.length} ${list.length === 1 ? "project" : "projects"}`;
    } else {
      indicator.textContent = `Page ${page} of ${totalPages}`;
    }
  }

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab === activeTab) return;
      transition(() => {
        tabs.forEach((t) => {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        activeTab = btn.dataset.tab;
        page = 1;
      });
    });
  });

  prev.addEventListener("click", () => {
    if (page > 1) transition(() => page--);
  });
  next.addEventListener("click", () => {
    transition(() => page++);
  });

  render();
}
