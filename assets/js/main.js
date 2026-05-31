// Vanilla JS bundle entry. Hugo concatenates module files when we
// pass through resources.Get; for now we inline-import via ES modules
// inside a single bundled file. The build pipeline emits one bundle.

import { initNav } from "./modules/nav.js";
import { initProjects } from "./modules/projects.js";
import { initReveal } from "./modules/reveal.js";
import { initOrbPause } from "./modules/orb-pause.js";

function ready(fn) {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}

ready(() => {
  initNav();
  initProjects();
  initReveal();
  initOrbPause();
});
