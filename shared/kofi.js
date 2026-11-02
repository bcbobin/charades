// Ko-fi tip panel. Any link with a data-kofi attribute opens Ko-fi's own donation panel in a
// bottom sheet instead of leaving the game. The link's href still points at Ko-fi, so it works
// as a normal link if this script fails to load.
(() => {
const PAGE = "https://ko-fi.com/bcbobin";
const PANEL = PAGE + "/?hidefeed=true&widget=true&embed=true&preview=true";

document.head.insertAdjacentHTML("beforeend", `<style>
.kofi-scrim { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.55); display: flex; align-items: flex-end; justify-content: center; }
.kofi-scrim[hidden] { display: none; }
.kofi-sheet {
  width: 100%; max-width: 440px; max-height: 92dvh; display: flex; flex-direction: column;
  background: #ffffff; color: #1f1f1f; border-radius: 20px 20px 0 0; overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px); font-family: "Nunito", system-ui, -apple-system, sans-serif;
  animation: kofi-up .22s ease-out;
}
.kofi-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 10px 4px 16px; }
.kofi-head span { font-weight: 900; font-size: 15px; }
.kofi-close { border: 0; background: #efefef; color: #1f1f1f; width: 34px; height: 34px; border-radius: 50%; font-size: 18px; cursor: pointer; }
.kofi-frame { border: 0; width: 100%; height: 640px; max-height: calc(92dvh - 80px); background: #fff; }
.kofi-foot { text-align: center; font-size: 12px; padding: 4px 0 10px; }
.kofi-foot a { color: #6b6b6b; font-weight: 700; }
@keyframes kofi-up { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .kofi-sheet { animation: none; } }
</style>`);

let scrim, frame, lastFocus;
function build() {
  scrim = document.createElement("div");
  scrim.className = "kofi-scrim"; scrim.hidden = true;
  scrim.innerHTML = `<div class="kofi-sheet" role="dialog" aria-modal="true" aria-label="Support on Ko-fi">
    <div class="kofi-head"><span>☕ Enjoying the game?</span><button class="kofi-close" aria-label="Close">✕</button></div>
    <iframe class="kofi-frame" title="Ko-fi donation panel"></iframe>
    <div class="kofi-foot"><a href="${PAGE}" target="_blank" rel="noopener">Open Ko-fi in a new tab</a></div>
  </div>`;
  frame = scrim.querySelector("iframe");
  scrim.addEventListener("click", e => { if (e.target === scrim) close(); });
  scrim.querySelector(".kofi-close").onclick = close;
  document.body.appendChild(scrim);
}
function open() {
  if (!scrim) build();
  if (!frame.src) frame.src = PANEL;   // load Ko-fi only when someone asks for it
  lastFocus = document.activeElement;
  scrim.hidden = false;
  scrim.querySelector(".kofi-close").focus();
}
function close() {
  scrim.hidden = true;
  if (lastFocus) lastFocus.focus();
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && scrim && !scrim.hidden) close(); });
document.addEventListener("click", e => {
  const a = e.target.closest("[data-kofi]");
  if (!a) return;
  e.preventDefault();
  open();
});
})();
