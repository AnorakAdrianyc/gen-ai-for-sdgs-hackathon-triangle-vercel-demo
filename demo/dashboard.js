const SVG = "http://www.w3.org/2000/svg";
const COLORS = {
  low: { wall: "#2f6d62", roof: "#9fd4c6", side: "#24584f" },
  medium: { wall: "#e6c200", roof: "#ffe14a", side: "#b89a00" },
  high: { wall: "#c62828", roof: "#ff3b30", side: "#8e1c1c" },
};

const state = {
  risk: "all",
  district: "all",
  query: "",
  role: "resident",
  selectedId: "north-terrace",
  yaw: 0.55,
  pitch: 1,
};

const app = document.querySelector("#app");

function sumPoints(building) {
  return Object.values(building.factorPoints).reduce((total, value) => total + value, 0);
}

function money(amount) {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: "HKD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function canSee(db, field) {
  return db.visibility[field].includes(state.role);
}

function visibleBuildings(db) {
  const query = state.query.trim().toLowerCase();
  return db.buildings.filter((building) => {
    if (state.risk !== "all" && building.risk.level !== state.risk) return false;
    if (state.district !== "all" && building.district !== state.district) return false;
    if (!query) return true;
    return (
      building.name.toLowerCase().includes(query) ||
      building.district.toLowerCase().includes(query) ||
      building.id.includes(query)
    );
  });
}

function project(x, y, z) {
  const cosYaw = Math.cos(state.yaw);
  const sinYaw = Math.sin(state.yaw);
  const xr = x * cosYaw - y * sinYaw;
  const yr = x * sinYaw + y * cosYaw;
  const scale = 0.78;
  return [
    (xr - yr) * Math.cos(Math.PI / 6) * scale,
    (xr + yr) * Math.sin(Math.PI / 6) * scale - z * state.pitch * scale,
    xr + yr,
  ];
}

function polygon(points, attrs) {
  const el = document.createElementNS(SVG, "polygon");
  el.setAttribute(
    "points",
    points.map((point) => `${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(" "),
  );
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

function facesCamera(world) {
  const [a, b, c] = world;
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const cosYaw = Math.cos(state.yaw);
  const sinYaw = Math.sin(state.yaw);
  const rx = nx * cosYaw - ny * sinYaw;
  const ry = nx * sinYaw + ny * cosYaw;
  // Camera sits above the south-east of the rotated plan and looks back toward it.
  return rx * -1 + ry * -1 + nz * -0.8 < 0;
}

function drawMap(db, shown) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("id", "map");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Schematic three-dimensional map of sample Hong Kong buildings coloured by risk band",
  );

  const landFaces = db.map.land.map((area) => {
    const points = area.polygon.map(([x, y]) => project(x, y, 0));
    const depth = points.reduce((total, point) => total + point[2], 0) / points.length;
    return { area, points, depth };
  });

  const blocks = shown.map((building) => {
    const { x, y, w, d, floors } = building.scene;
    const height = floors * 2.7;
    const world = (cx, cy, cz) => [cx, cy, cz];
    const groundW = {
      nw: world(x, y, 0),
      ne: world(x + w, y, 0),
      se: world(x + w, y + d, 0),
      sw: world(x, y + d, 0),
    };
    const topW = {
      nw: world(x, y, height),
      ne: world(x + w, y, height),
      se: world(x + w, y + d, height),
      sw: world(x, y + d, height),
    };
    const toScreen = (quad) => quad.map((point) => project(point[0], point[1], point[2]));
    const palette = COLORS[building.risk.level];
    const candidates = [
      { world: [topW.nw, topW.ne, topW.se, topW.sw], fill: palette.roof, roof: true },
      { world: [groundW.nw, groundW.ne, topW.ne, topW.nw], fill: palette.side },
      { world: [groundW.ne, groundW.se, topW.se, topW.ne], fill: palette.wall },
      { world: [groundW.se, groundW.sw, topW.sw, topW.se], fill: palette.side },
      { world: [groundW.sw, groundW.nw, topW.nw, topW.sw], fill: palette.wall },
    ];
    const faces = candidates
      .filter((face) => facesCamera(face.world))
      .map((face) => {
        const points = toScreen(face.world);
        const depth =
          points.reduce((total, point) => total + point[2], 0) / points.length +
          (face.roof ? 0.5 : 0);
        return { points, fill: face.fill, depth };
      })
      .sort((a, b) => a.depth - b.depth);
    const footprint = toScreen([groundW.nw, groundW.ne, groundW.se, groundW.sw]);
    const depth = (project(x, y, 0)[2] + project(x + w, y + d, 0)[2]) / 2;
    return { building, faces, footprint, depth };
  });

  const projected = [];
  for (const face of landFaces) projected.push(...face.points);
  for (const block of blocks) {
    for (const face of block.faces) projected.push(...face.points);
  }
  for (const area of db.map.land) {
    const x = area.polygon.reduce((total, point) => total + point[0], 0) / area.polygon.length;
    const y = area.polygon.reduce((total, point) => total + point[1], 0) / area.polygon.length;
    projected.push(project(x, y, 0));
  }
  for (const label of db.map.labels) projected.push(project(label.x, label.y, 0));

  const xs = projected.map((point) => point[0]);
  const ys = projected.map((point) => point[1]);
  const minX = Math.min(...xs) - 36;
  const minY = Math.min(...ys) - 28;
  const maxX = Math.max(...xs) + 36;
  const maxY = Math.max(...ys) + 28;
  svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

  landFaces
    .sort((a, b) => a.depth - b.depth)
    .forEach((face) => {
      svg.append(
        polygon(face.points, {
          fill: "#243239",
          stroke: "#3d5158",
          "stroke-width": "1.2",
        }),
      );
    });

  blocks
    .sort((a, b) => a.depth - b.depth)
    .forEach((block) => {
      const group = document.createElementNS(SVG, "g");
      const selected = block.building.id === state.selectedId;
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute(
        "aria-label",
        `${block.building.name}, ${block.building.district}, ${block.building.risk.level} risk`,
      );
      group.setAttribute("aria-pressed", selected ? "true" : "false");
      group.dataset.id = block.building.id;
      group.append(
        polygon(block.footprint, {
          fill: "#172126",
          stroke: "rgba(8, 12, 14, 0.35)",
          "stroke-width": "0.4",
        }),
      );
      block.faces.forEach((face) => {
        group.append(
          polygon(face.points, {
            fill: face.fill,
            stroke: selected ? "#f3efe6" : "rgba(8, 12, 14, 0.45)",
            "stroke-width": selected ? "1.6" : "0.6",
          }),
        );
      });
      svg.append(group);
    });

  const labels = [
    ...db.map.land.map((area) => {
      const x = area.polygon.reduce((total, point) => total + point[0], 0) / area.polygon.length;
      const y = area.polygon.reduce((total, point) => total + point[1], 0) / area.polygon.length;
      return { text: area.name, x, y, kind: "land" };
    }),
    ...db.map.labels.filter((label) => label.kind === "water"),
  ];
  labels.forEach((label) => {
    const [x, y] = project(label.x, label.y, 0);
    const text = document.createElementNS(SVG, "text");
    text.setAttribute("x", x.toFixed(1));
    text.setAttribute("y", y.toFixed(1));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("pointer-events", "none");
    text.setAttribute("fill", label.kind === "water" ? "#8fb8b4" : "#e7eeea");
    text.setAttribute("stroke", "#143036");
    text.setAttribute("stroke-width", "3");
    text.setAttribute("paint-order", "stroke");
    text.setAttribute("font-size", "13");
    text.setAttribute("font-family", "Segoe UI, Helvetica Neue, sans-serif");
    text.textContent = label.text;
    svg.append(text);
  });

  svg.addEventListener("click", (event) => {
    const group = event.target.closest("g[data-id]");
    if (!group) return;
    state.selectedId = group.dataset.id;
    render(db);
  });
  svg.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const group = event.target.closest("g[data-id]");
    if (!group) return;
    event.preventDefault();
    state.selectedId = group.dataset.id;
    render(db);
  });
  return svg;
}

function field(term, value) {
  return `<div class="fact"><dl><dt>${term}</dt><dd>${value}</dd></dl></div>`;
}

function detail(db, building, role) {
  const factors = db.scoring.factors
    .map((factor) => {
      const points = building.factorPoints[factor.id];
      const width = Math.round((points / factor.max) * 100);
      return `<div class="factor"><span>${factor.label}</span>
        <div class="bar ${building.risk.level}"><span style="width:${width}%"></span></div>
        <span class="muted">${points} / ${factor.max}</span></div>`;
    })
    .join("");

  const defects = canSee(db, "defectNarrative")
    ? `<div class="note"><strong>Defects in the sample record</strong>${
        building.defects.length
          ? `<ul class="plain">${building.defects
              .map((defect) => `<li>${defect.summary} <span class="muted">${defect.reported}</span></li>`)
              .join("")}</ul>`
          : "<p class=\"muted\">None logged.</p>"
      }</div>`
    : `<p class="locked">Defect narratives are hidden from this role.</p>`;

  const orders = canSee(db, "statutoryOrders")
    ? `<div class="note"><strong>Statutory orders</strong>${
        building.orders.length
          ? `<ul class="plain">${building.orders
              .map((order) => `<li>${order.id}: ${order.topic} <span class="muted">${order.status}, issued ${order.issued}</span></li>`)
              .join("")}</ul>`
          : "<p class=\"muted\">No open orders in the sample record.</p>"
      }</div>`
    : `<p class="locked">Statutory orders are hidden from a ${role.name.toLowerCase()}.</p>`;

  const contact = canSee(db, "residentContact")
    ? field("Access note", `${building.residentContact.unit}. ${building.residentContact.channel}.`)
    : `<p class="locked">Resident access notes stay with the OC and the manager until access is granted.</p>`;

  let tender;
  if (!canSee(db, "tenderQuotes")) {
    const own =
      state.role === "contractor"
        ? " A contractor would see only the quote they submitted."
        : "";
    tender = `<p class="locked">Tender prices are hidden from this role. The sample tender status is “${building.tender.status}”.${own}</p>`;
  } else if (!building.tender.quotes.length) {
    tender = `<div class="note"><strong>Tender</strong><p class="muted">Status: ${building.tender.status}. No quotes in the file.</p></div>`;
  } else {
    const showLicence = canSee(db, "contractorLicence");
    tender = `<div class="note"><strong>Tender · ${building.tender.status}</strong>
      <p>${building.tender.pack ?? ""}</p>
      <ul class="plain">${building.tender.quotes
        .map((quote) => {
          const licence = showLicence ? ` · ${quote.licence}` : "";
          const awarded = quote.awarded ? " · awarded" : "";
          return `<li>${quote.contractor}${licence}${awarded}: ${money(quote.amountHkd)}</li>`;
        })
        .join("")}</ul></div>`;
  }

  return `<h2>${building.name}</h2>
    <p class="muted">${building.district} · ${building.region} · sample record ${building.id}</p>
    <p class="count">Signed in as <strong>${role.name}</strong>, the ${role.uberAnalogue.toLowerCase()} on this network. Fields follow <code>visibility</code> in the data file.</p>
    <div class="roles" role="group" aria-label="View the record as">
      ${db.network.roles
        .map(
          (item) =>
            `<button class="role" type="button" data-role="${item.id}" aria-pressed="${item.id === state.role}">${item.name}</button>`,
        )
        .join("")}
    </div>
    <div class="score"><strong>${building.risk.score}</strong><span class="band ${building.risk.level}">${building.risk.level}</span></div>
    <p class="muted">Score is the sum of factor points. ${sumPoints(building) === building.risk.score ? "The file total matches the sum." : "The stored score does not match the sum."}</p>
    ${factors}
    ${field("Completed", String(building.yearBuilt))}
    ${field("Sample flats", String(building.units))}
    ${field("Sample WGS84", `${building.coordinates.lat.toFixed(3)}, ${building.coordinates.lng.toFixed(3)}`)}
    ${field("Parties", `${building.ownersCorporation.name} (${building.ownersCorporation.verified ? "verified" : "not verified"}). ${building.management.name}.`)}
    ${field("Last inspection in the file", building.compliance.lastInspection)}
    ${defects}
    ${orders}
    ${contact}
    ${tender}
    <details>
      <summary>Record used for this panel</summary>
      <pre>${JSON.stringify(building, null, 2)}</pre>
    </details>`;
}

function render(db) {
  const shown = visibleBuildings(db);
  if (!shown.some((building) => building.id === state.selectedId)) {
    state.selectedId = shown[0]?.id ?? state.selectedId;
  }
  const selected = db.buildings.find((building) => building.id === state.selectedId);
  const role = db.network.roles.find((item) => item.id === state.role);
  const districts = [...new Set(db.buildings.map((building) => building.district))].sort();
  const counts = { low: 0, medium: 0, high: 0 };
  for (const building of db.buildings) counts[building.risk.level] += 1;

  app.innerHTML = "";
  const filters = document.createElement("aside");
  filters.className = "panel";
  filters.innerHTML = `<p class="count">${db.buildings.length} sample buildings · ${counts.high} high · ${counts.medium} medium · ${counts.low} low</p>
    <div class="filters" role="group" aria-label="Risk band">
      ${["all", "high", "medium", "low"]
        .map(
          (level) =>
            `<button class="chip" type="button" data-risk="${level}" aria-pressed="${state.risk === level}">${level}</button>`,
        )
        .join("")}
    </div>
    <label class="district">District
      <select id="district">
        <option value="all">All districts</option>
        ${districts.map((district) => `<option value="${district}" ${district === state.district ? "selected" : ""}>${district}</option>`).join("")}
      </select>
    </label>
    <label class="search">Search
      <input id="query" type="search" value="${state.query.replaceAll('"', "&quot;")}" placeholder="Name or district" />
    </label>
    <ol class="list">${shown
      .slice()
      .sort((a, b) => b.risk.score - a.risk.score)
      .map(
        (building) =>
          `<li><button type="button" data-id="${building.id}" aria-current="${building.id === state.selectedId}">
            <span>${building.name}<br /><small>${building.district}</small></span>
            <span class="band ${building.risk.level}">${building.risk.level}</span>
          </button></li>`,
      )
      .join("") || "<li class=\"muted\">No sample buildings match.</li>"}</ol>`;

  const stage = document.createElement("section");
  stage.className = "stage";
  stage.innerHTML = `<div class="stage-bar">
      <span>Drag to rotate · schematic, not a survey</span>
      <span>
        <button type="button" id="pitch-down">Flatter</button>
        <button type="button" id="pitch-up">Taller</button>
        <button type="button" id="reset-view">Reset view</button>
      </span>
    </div>
    <div class="map-scroll"></div>`;

  const detailPanel = document.createElement("aside");
  detailPanel.className = "panel detail";
  detailPanel.innerHTML = selected
    ? detail(db, selected, role)
    : "<p>No building selected.</p>";

  app.append(filters, stage, detailPanel);
  stage.querySelector(".map-scroll").append(drawMap(db, shown));

  filters.querySelectorAll("[data-risk]").forEach((button) => {
    button.addEventListener("click", () => {
      state.risk = button.dataset.risk;
      render(db);
    });
  });
  filters.querySelector("#district").addEventListener("change", (event) => {
    state.district = event.target.value;
    render(db);
  });
  const query = filters.querySelector("#query");
  query.addEventListener("input", (event) => {
    state.query = event.target.value;
    const caret = event.target.selectionStart;
    render(db);
    const next = document.querySelector("#query");
    next.focus();
    next.setSelectionRange(caret, caret);
  });
  filters.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      render(db);
    });
  });
  detailPanel.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role;
      render(db);
    });
  });

  const scroll = stage.querySelector(".map-scroll");
  scroll.addEventListener("pointerdown", (event) => {
    if (event.target.closest("g[data-id]")) return;
    scroll.setPointerCapture(event.pointerId);
    scroll.dataset.dragging = "true";
    scroll.dataset.x = String(event.clientX);
    scroll.dataset.yaw = String(state.yaw);
  });
  scroll.addEventListener("pointermove", (event) => {
    if (scroll.dataset.dragging !== "true") return;
    state.yaw = Number(scroll.dataset.yaw) + (event.clientX - Number(scroll.dataset.x)) * 0.008;
    const map = drawMap(db, shown);
    scroll.replaceChildren(map);
  });
  const endDrag = () => {
    scroll.dataset.dragging = "false";
  };
  scroll.addEventListener("pointerup", endDrag);
  scroll.addEventListener("pointercancel", endDrag);

  document.querySelector("#pitch-down").addEventListener("click", () => {
    state.pitch = Math.max(0.45, state.pitch - 0.15);
    render(db);
  });
  document.querySelector("#pitch-up").addEventListener("click", () => {
    state.pitch = Math.min(1.6, state.pitch + 0.15);
    render(db);
  });
  document.querySelector("#reset-view").addEventListener("click", () => {
    state.yaw = 0.55;
    state.pitch = 1;
    render(db);
  });
}

async function main() {
  try {
    const response = await fetch("./data/buildings.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const db = await response.json();
    render(db);
  } catch (error) {
    app.innerHTML = `<p class="error">Could not read demo/data/buildings.json (${error.message}). Open this folder through a static server, for example npm run demo.</p>`;
  }
}

main();
