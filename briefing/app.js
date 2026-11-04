(() => {
  const $ = (s) => document.querySelector(s);
  const app = $("#app");

  // ── Tema claro / oscuro ──
  const root = document.documentElement;
  try { const t = localStorage.getItem("tema"); if (t) root.dataset.theme = t; } catch {}
  $("#tema").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("tema", root.dataset.theme); } catch {}
  });

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtNum = (v, d = 2) => typeof v === "number" ? v.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";
  const fmtPct = (v) => typeof v === "number" ? `${v > 0 ? "+" : ""}${v.toFixed(2).replace(".", ",")}\u00a0%` : "";
  const cls = (v) => typeof v !== "number" || Math.abs(v) < 0.005 ? "flat" : v > 0 ? "up" : "down";
  const arrow = (v) => typeof v !== "number" || Math.abs(v) < 0.005 ? "•" : v > 0 ? "▲" : "▼";
  const fechaLarga = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  function spark(serie, v) {
    if (!Array.isArray(serie) || serie.length < 2) return "";
    const min = Math.min(...serie), max = Math.max(...serie), r = max - min || 1;
    const pts = serie.map((y, i) => `${(i / (serie.length - 1)) * 100},${26 - ((y - min) / r) * 24}`).join(" ");
    const color = cls(v) === "up" ? "var(--up)" : cls(v) === "down" ? "var(--down)" : "var(--muted)";
    return `<svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function tile(m) {
    const mes = m.variacion_mes_pct;
    return `<div class="tile" title="${esc(m.fuente || "")}">
      <div class="name">${esc(m.nombre)}</div>
      <div class="val">${fmtNum(m.valor, m.decimales ?? 2)}<span>${esc(m.unidad || "")}</span></div>
      <div class="chg"><span class="${cls(m.variacion_pct)}">${arrow(m.variacion_pct)} ${fmtPct(m.variacion_pct)}</span>${typeof mes === "number" ? `<span class="${cls(mes)}" title="Variación en el último mes">1M ${fmtPct(mes)}</span>` : ""}</div>
      ${spark(m.serie, mes)}
      ${m.vigencia ? `<div class="src">Vigencia ${esc(m.vigencia)}</div>` : ""}
    </div>`;
  }

  function indicadores(d) {
    const grupos = {};
    (d.mercados || []).forEach((m) => (grupos[m.grupo] ||= []).push(m));
    const orden = ["Divisas", "Materias primas", "Bolsas", "Tasas", "Riesgo"];
    const mercados = orden.filter((g) => grupos[g]).map((g) =>
      `<div class="ind-group"><h3>${esc(g)}</h3><div class="grid">${grupos[g].map(tile).join("")}</div></div>`).join("");
    const macro = (d.macro || []).length ? `<div class="ind-group"><h3>Macro · último dato oficial</h3><div class="macro">${d.macro.map((m) => `
      <div class="tile">
        <div class="name">${esc(m.nombre)}</div>
        <div class="val">${esc(m.valor)}</div>
        <div class="src">${esc(m.fecha_dato)} · ${m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.fuente)}</a>` : esc(m.fuente)}</div>
        ${m.comentario ? `<div class="note">${esc(m.comentario)}</div>` : ""}
      </div>`).join("")}</div></div>` : "";
    const lectura = d.lectura_mercados ? `<div class="reading"><strong>Lectura</strong>${esc(d.lectura_mercados)}</div>` : "";
    return `<section id="indicadores"><h2>Indicadores <small>variación diaria y del último mes</small></h2>${macro}${mercados}${lectura}</section>`;
  }

  function topic(t) {
    const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < t.importancia ? "on" : ""}"></i>`).join("");
    const persp = (t.perspectivas || []).map((p) => `<div><b>${esc(p.medio)}:</b> ${esc(p.enfoque)}</div>`).join("");
    const fuentes = (t.fuentes || []).map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titulo)}</a> <span>— ${esc(f.medio)}</span></li>`).join("");
    return `<details class="topic">
      <summary>
        <div class="row"><span class="chip">${esc(t.categoria)}</span><span class="dots" title="Importancia ${t.importancia}/5">${dots}</span></div>
        <h3>${esc(t.titulo)}</h3>
        <p class="sum">${esc(t.resumen)}</p>
        <p class="why"><b>Por qué importa:</b> ${esc(t.por_que_importa)}</p>
        <span class="more">Ver análisis y cómo lo cuentan los medios →</span>
      </summary>
      <div class="body">
        ${persp ? `<h4>Cómo lo cuentan</h4><div class="persp">${persp}</div>` : ""}
        <div class="cols">
          <div><h4>En qué coinciden</h4><p>${esc(t.coincidencias)}</p></div>
          <div><h4>Dónde difieren</h4><p>${esc(t.diferencias)}</p></div>
        </div>
        <h4>Análisis</h4><p>${esc(t.analisis)}</p>
        <div class="callout"><h4>Implicaciones para su negocio</h4><p>${esc(t.implicaciones)}</p>
          <h4>Qué vigilar</h4><p>${esc(t.que_vigilar)}</p></div>
        ${fuentes ? `<h4>Fuentes</h4><ul class="sources">${fuentes}</ul>` : ""}
      </div>
    </details>`;
  }

  const seccion = (id, titulo, temas) => temas?.length
    ? `<section id="${id}"><h2>${titulo} <small>${temas.length} temas</small></h2>${[...temas].sort((a, b) => b.importancia - a.importancia).map(topic).join("")}</section>` : "";

  function render(d) {
    $("#fecha").textContent = fechaLarga(d.fecha);
    document.title = `Informe Diario · ${d.fecha}`;
    const leidos = d.cobertura?.medios?.filter((m) => m.ok).length ?? 0;
    app.innerHTML = `
      ${d.demo ? `<div class="banner"><b>Datos de ejemplo.</b> Este contenido es ilustrativo para mostrar el diseño. El informe real se genera automáticamente cada mañana (ver README).</div>` : ""}
      <section id="esencial" class="hero">
        <p class="eyebrow">Lo esencial · lectura de 1 minuto</p>
        <p class="headline">${esc(d.titular_del_dia)}</p>
        <ul>${(d.lo_esencial || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="meta-line">${[
          d.cobertura && `${d.cobertura.total_articulos} artículos de ${leidos} medios analizados`,
          d.generado && `actualizado ${new Date(d.generado).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", timeZone: "America/Bogota" })} (Bogotá)`,
        ].filter(Boolean).join(" · ")}</p>
      </section>
      ${indicadores(d)}
      ${seccion("colombia", "Colombia", d.colombia)}
      ${seccion("mundo", "Mundo", d.mundo)}
      <section id="agenda" class="agenda">
        ${d.agenda?.length ? `<h2>En el radar</h2><ul>${d.agenda.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        ${d.balance_cobertura ? `<h2 style="margin-top:28px">Balance de la cobertura</h2><p class="coverage">${esc(d.balance_cobertura)}</p>` : ""}
      </section>`;

    const medios = d.cobertura?.medios || [];
    $("#pie").innerHTML = `
      <p>Análisis generado con IA a partir de titulares públicos; criterio editorial: neutralidad política, hechos separados de opiniones y atribución explícita de cada postura. Verifique en las fuentes antes de decisiones críticas.</p>
      ${medios.length ? `<details><summary>Medios consultados (${leidos}/${medios.length})</summary><ul>${medios.map((m) => `<li>${m.ok ? "✓" : "✗"} ${esc(m.medio)} <span>(${m.articulos})</span></li>`).join("")}</ul></details>` : ""}`;
  }

  async function load(url) {
    app.innerHTML = `<p class="loading">Cargando informe…</p>`;
    try {
      const r = await fetch(url, { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      render(await r.json());
      scrollTo(0, 0);
    } catch {
      app.innerHTML = `<p class="error">No se pudo cargar el informe. Si abre el archivo localmente, use un servidor (ver README).</p>`;
    }
  }

  async function initArchive() {
    const sel = $("#archivo");
    let fechas = [];
    try { const r = await fetch("data/indice.json", { cache: "no-cache" }); if (r.ok) fechas = await r.json(); } catch {}
    sel.innerHTML = `<option value="data/latest.json">Hoy</option>` + fechas.slice(1).map((f) => `<option value="data/archivo/${f}.json">${f}</option>`).join("");
    sel.hidden = fechas.length < 2;
    sel.addEventListener("change", () => load(sel.value));
  }

  initArchive();
  load("data/latest.json");
})();
