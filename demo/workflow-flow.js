const toolbar = document.querySelector(".flow-toolbar");
const nodes = document.querySelectorAll(".flow-node[data-step]");
const rows = document.querySelectorAll("[data-flow-row]");

function setHighlight(step) {
  const n = Number(step);
  toolbar.querySelectorAll("[data-flow-step]").forEach((button) => {
    if (Number(button.dataset.flowStep) === n) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  nodes.forEach((node) => {
    const nodeStep = Number(node.dataset.step);
    if (n === 0) node.dataset.active = "false";
    else if (nodeStep === n) node.dataset.active = "true";
    else node.dataset.active = "dim";
  });
  rows.forEach((row) => {
    const rowStep = Number(row.dataset.flowRow);
    if (n === 0) row.removeAttribute("data-active");
    else if (rowStep === n) row.dataset.active = "true";
    else row.removeAttribute("data-active");
  });
}

toolbar?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-flow-step]");
  if (!button) return;
  const step = button.dataset.flowStep;
  setHighlight(step);
  if (Number(step) === 0) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  document.querySelector(`.flow-node[data-step="${step}"]`)?.scrollIntoView({ block: "nearest", behavior });
});

setHighlight(0);
