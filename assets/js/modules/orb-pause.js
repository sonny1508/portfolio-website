// Pause orb animations when the tab is backgrounded to save CPU.
// Toggles .is-paused on .bg-canvas; CSS sets animation-play-state.

export function initOrbPause() {
  const canvas = document.querySelector(".bg-canvas");
  if (!canvas) return;

  const update = () => {
    canvas.classList.toggle("is-paused", document.hidden);
  };
  document.addEventListener("visibilitychange", update);
  update();
}
