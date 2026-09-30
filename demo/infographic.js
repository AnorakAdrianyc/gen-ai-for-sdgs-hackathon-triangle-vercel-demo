const SVG = "http://www.w3.org/2000/svg";
const SHORT = {
  resident: "Resident",
  "case-record": "Case",
  "owners-corporation": "OC",
  "property-manager": "Manager",
  contractor: "Contractor",
  inspector: "Inspector",
  regulator: "Authority",
};

const POSITIONS = {
  resident: [110, 78],
  "case-record": [330, 78],
  "owners-corporation": [110, 230],
  "property-manager": [330, 230],
  contractor: [560, 150],
  inspector: [560, 310],
  regulator: [330, 390],
};

const mount = document.querySelector("#interactive");
const state = { role: "resident", step: 0 };

function nodeById(db, id) {
  if (id === "case-record") return { ...db.network.record, kind: "record" };
  const role = db.network.roles.find((item) => item.id === id);
  return role ? { ...role, kind: "role" } : null;
}

function render(db) {
  const step = db.network.journey[state.step];
  const role = db.network.roles.find((item) => item.id === state.role);
  const building = db.buildings.find((item) => item.id === db.network.sampleBuildingId);
  const fields = Object.keys(db.visibility);

  mount.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "diagram-wrap";

  const figure = document.createElement("div");
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("id", "network");
  svg.setAttribute("viewBox", "0 0 700 470");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Network of resident, owners corporation, manager, contractor, inspector, and authority desk around one case record",
  );

  db.network.edges.forEach((edge) => {
    const [x1, y1] = POSITIONS[edge.from];
    const [x2, y2] = POSITIONS[edge.to];
    const active =
      step.actors.includes(edge.from) || step.actors.includes(edge.to);
    const line = document.createElementNS(SVG, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", active ? "#c4a574" : "#3d5158");
    line.setAttribute("stroke-width", active ? "2.4" : "1.2");
    svg.append(line);
  });

  Object.entries(POSITIONS).forEach(([id, [x, y]]) => {
    const node = nodeById(db, id);
    const active = id === state.role || id === "case-record" || step.actors.includes(id);
    const group = document.createElementNS(SVG, "g");
    if (node.kind === "role") {
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-pressed", id === state.role ? "true" : "false");
      group.setAttribute("aria-label", node.name);
      group.dataset.role = id;
    }
    const circle = document.createElementNS(SVG, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", id === "case-record" ? 46 : 38);
    circle.setAttribute("fill", active ? "#243239" : "#182127");
    circle.setAttribute("stroke", active ? "#c4a574" : "#3d5158");
    circle.setAttribute("stroke-width", id === state.role ? "3" : "1.4");
    const title = document.createElementNS(SVG, "text");
    title.setAttribute("x", x);
    title.setAttribute("y", y - 2);
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("fill", "#e8e2d6");
    title.setAttribute("font-size", "11");
    title.setAttribute("font-family", "Segoe UI, Helvetica Neue, sans-serif");
    title.textContent = SHORT[id];
    const analogue = document.createElementNS(SVG, "text");
    analogue.setAttribute("x", x);
    analogue.setAttribute("y", y + 14);
    analogue.setAttribute("text-anchor", "middle");
    analogue.setAttribute("fill", "#c4a574");
    analogue.setAttribute("font-size", "10");
    analogue.setAttribute("font-family", "Segoe UI, Helvetica Neue, sans-serif");
    analogue.textContent =
    {
      resident: "Rider",
      "case-record": "The trip",
      "owners-corporation": "Account",
      "property-manager": "Dispatch",
      contractor: "Driver",
      inspector: "Inspection",
      regulator: "Safety",
    }[id];
    group.append(circle, title, analogue);
    svg.append(group);
  });

  svg.addEventListener("click", (event) => {
    const group = event.target.closest("g[data-role]");
    if (!group) return;
    state.role = group.dataset.role;
    render(db);
  });
  svg.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const group = event.target.closest("g[data-role]");
    if (!group) return;
    event.preventDefault();
    state.role = group.dataset.role;
    render(db);
  });
  figure.append(svg);

  const side = document.createElement("aside");
  side.className = "role-card";
  side.innerHTML = `<p class="kicker">${role.uberAnalogue}</p>
    <h2>${role.name}</h2>
    <p><strong>Signs in with</strong></p>
    <ul class="plain">${role.authenticatesWith.map((item) => `<li>${item}</li>`).join("")}</ul>
    <p><strong>Can see</strong></p>
    <ul class="plain">${role.canSee.map((item) => `<li>${item}</li>`).join("")}</ul>
    <p><strong>Can do</strong></p>
    <ul class="plain">${role.canDo.map((item) => `<li>${item}</li>`).join("")}</ul>
    <p><strong>Cannot</strong></p>
    <ul class="plain">${role.cannot.map((item) => `<li>${item}</li>`).join("")}</ul>`;

  wrap.append(figure, side);

  const steps = document.createElement("div");
  steps.className = "steps";
  steps.setAttribute("role", "group");
  steps.setAttribute("aria-label", "Case steps");
  db.network.journey.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "step";
    button.textContent = `${index + 1}. ${item.title}`;
    if (index === state.step) button.setAttribute("aria-current", "step");
    button.addEventListener("click", () => {
      state.step = index;
      state.role = item.actors[0];
      render(db);
    });
    steps.append(button);
  });

  const receipt = document.createElement("article");
  receipt.className = "receipt";
  receipt.innerHTML = `<p class="kicker">Sample case ${building.caseId} · ${building.name}</p>
    <h2>${step.title}</h2>
    <p>${step.message}</p>
    <p class="muted">Ride equivalent: ${step.uber}</p>
    <p><strong>Authentication at this step.</strong> ${step.authenticates}</p>
    <p><strong>What the record stores.</strong> ${step.record}</p>
    <p class="muted">Walk the eight steps. Each one lights the parties who have to be signed in. The same file drives the risk map.</p>`;

  const table = document.createElement("table");
  table.className = "matrix";
  const head = document.createElement("tr");
  ["Role", "Ride analogue", ...fields.map(labelFor)].forEach((label) => {
    const cell = document.createElement("th");
    cell.textContent = label;
    head.append(cell);
  });
  const thead = document.createElement("thead");
  thead.append(head);
  const tbody = document.createElement("tbody");
  db.network.roles.forEach((item) => {
    const row = document.createElement("tr");
    if (item.id === state.role) row.dataset.active = "true";
    const name = document.createElement("th");
    name.textContent = item.name;
    const analogue = document.createElement("td");
    analogue.textContent = item.uberAnalogue;
    row.append(name, analogue);
    fields.forEach((field) => {
      const cell = document.createElement("td");
      const allowed = db.visibility[field].includes(item.id);
      cell.textContent = allowed ? "Yes" : "—";
      if (allowed) cell.className = "yes";
      row.append(cell);
    });
    tbody.append(row);
  });
  table.append(thead, tbody);

  const caption = document.createElement("p");
  caption.className = "muted";
  caption.textContent =
    "Field access for the sample desk. “Yes” means that role is listed in visibility inside demo/data/buildings.json. Change role on the diagram to highlight a row, then open the same building on the risk map.";

  mount.append(wrap, steps, receipt, table, caption);
}

function labelFor(field) {
  const labels = {
    riskProfile: "Risk band",
    defectNarrative: "Defects",
    statutoryOrders: "Orders",
    tenderQuotes: "Prices",
    residentContact: "Access note",
    contractorLicence: "Licence",
  };
  return labels[field] ?? field;
}

async function main() {
  try {
    const response = await fetch("./data/buildings.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  } catch (error) {
    mount.innerHTML = `<p class="error">Could not read demo/data/buildings.json (${error.message}). Use a static server, for example npm run demo.</p>`;
  }
}

main();
