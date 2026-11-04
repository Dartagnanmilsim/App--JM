#!/usr/bin/env node
// Genera el informe diario:
//   1. Lee titulares de los principales diarios (RSS).
//   2. Descarga indicadores de mercado y la TRM oficial.
//   3. Busca los últimos datos macro oficiales (búsqueda web con Claude).
//   4. Pide a Claude agrupar las noticias por tema, comparar enfoques entre
//      medios y escribir un análisis sin sesgo político para un directivo.
//   5. Guarda data/latest.json y data/archivo/AAAA-MM-DD.json.
//
// Uso:  ANTHROPIC_API_KEY=... node scripts/generate.mjs
//       node scripts/generate.mjs --sin-ia   (solo descarga datos, sin análisis)

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { FEEDS, MARKET_SYMBOLS, MACRO_INDICATORS } from "./sources.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const ARCHIVE_DIR = path.join(DATA_DIR, "archivo");
const MODEL = process.env.BRIEFING_MODEL || "claude-opus-5-5";
const SIN_IA = process.argv.includes("--sin-ia");
const UA = "Mozilla/5.0 (compatible; BriefingDiario/1.0)";
const MAX_ARTICLES_PER_FEED = 15;
const MAX_AGE_HOURS = 36;

const hoyBogota = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

async function fetchText(url, { timeoutMs = 15000, headers = {} } = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*", ...headers },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ─── 1. Noticias ─────────────────────────────────────────────────────────────

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "#text" });

const text = (v) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return text(v[0]);
  return text(v["#text"] ?? v["@href"] ?? "");
};

const clean = (s) =>
  text(s)
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

function parseFeed(body) {
  const doc = xml.parse(body);
  const rssItems = doc?.rss?.channel?.item ?? doc?.["rdf:RDF"]?.item;
  const atomItems = doc?.feed?.entry;
  const items = [].concat(rssItems ?? atomItems ?? []);
  return items.map((it) => {
    let link = it.link;
    if (Array.isArray(link)) link = link.find((l) => l["@rel"] !== "self") ?? link[0];
    return {
      titulo: clean(it.title),
      resumen: clean(it.description ?? it.summary ?? it["content:encoded"] ?? "").slice(0, 400),
      url: clean(typeof link === "object" ? link["@href"] ?? link : link) || clean(it.guid),
      fecha: clean(it.pubDate ?? it.published ?? it.updated ?? it["dc:date"] ?? ""),
    };
  });
}

async function fetchNews() {
  const cutoff = Date.now() - MAX_AGE_HOURS * 3600 * 1000;
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const items = parseFeed(await fetchText(f.url));
      return items
        .filter((it) => it.titulo && it.url)
        .filter((it) => {
          const t = Date.parse(it.fecha);
          return Number.isNaN(t) || t >= cutoff;
        })
        .slice(0, MAX_ARTICLES_PER_FEED)
        .map((it) => ({ ...it, medio: f.medio, region: f.region, tipo: f.tipo }));
    }),
  );

  const articles = [];
  const estado = [];
  results.forEach((r, i) => {
    const f = FEEDS[i];
    if (r.status === "fulfilled") {
      articles.push(...r.value);
      estado.push({ medio: f.medio, region: f.region, articulos: r.value.length, ok: r.value.length > 0 });
    } else {
      estado.push({ medio: f.medio, region: f.region, articulos: 0, ok: false, error: String(r.reason?.message ?? r.reason) });
    }
  });

  // Deduplicar titulares idénticos (agregadores repiten notas).
  const seen = new Set();
  const unique = articles.filter((a) => {
    const k = a.titulo.toLowerCase().slice(0, 90);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.forEach((a, i) => (a.id = `a${i + 1}`));
  return { articles: unique, estado };
}

// ─── 2. Mercados ─────────────────────────────────────────────────────────────

async function yahooQuote(simbolo) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?range=1mo&interval=1d`;
  const data = JSON.parse(await fetchText(url));
  const r = data?.chart?.result?.[0];
  if (!r) throw new Error("sin datos");
  const closes = (r.indicators?.quote?.[0]?.close ?? []).filter((v) => typeof v === "number");
  const precio = r.meta?.regularMarketPrice ?? closes.at(-1);
  // Cierre anterior = penúltimo cierre diario (más fiable que chartPreviousClose con range=1mo).
  const prev = closes.length >= 2 ? (closes.at(-1) === precio ? closes.at(-2) : closes.at(-1)) : r.meta?.previousClose;
  if (typeof precio !== "number") throw new Error("sin precio");
  return {
    valor: precio,
    variacion_pct: typeof prev === "number" && prev ? ((precio - prev) / prev) * 100 : null,
    variacion_mes_pct: closes.length ? ((precio - closes[0]) / closes[0]) * 100 : null,
    serie: closes.slice(-22),
    hora: r.meta?.regularMarketTime ? new Date(r.meta.regularMarketTime * 1000).toISOString() : null,
  };
}

async function fetchTRM() {
  const url =
    "https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=23&$order=vigenciadesde%20DESC";
  const rows = JSON.parse(await fetchText(url));
  if (!rows.length) throw new Error("sin filas");
  const serie = rows.map((r) => Number(r.valor)).reverse();
  const valor = serie.at(-1);
  const prev = serie.at(-2);
  return {
    id: "trm",
    nombre: "TRM oficial",
    grupo: "Divisas",
    unidad: "COP",
    decimales: 2,
    valor,
    variacion_pct: prev ? ((valor - prev) / prev) * 100 : null,
    variacion_mes_pct: serie.length ? ((valor - serie[0]) / serie[0]) * 100 : null,
    serie,
    vigencia: rows[0].vigenciadesde?.slice(0, 10),
    fuente: "Superintendencia Financiera (datos.gov.co)",
  };
}

async function fetchMarkets() {
  const out = [];
  try {
    out.push(await fetchTRM());
  } catch (e) {
    console.warn("TRM no disponible:", e.message);
  }
  const results = await Promise.allSettled(
    MARKET_SYMBOLS.map(async (s) => {
      try {
        return { ...s, ...(await yahooQuote(s.simbolo)), fuente: "Yahoo Finance" };
      } catch (e) {
        if (!s.alternativo) throw e;
        const q = await yahooQuote(s.alternativo);
        return { ...s, nombre: `${s.nombre} (ETF ${s.alternativo})`, unidad: "USD", ...q, fuente: "Yahoo Finance" };
      }
    }),
  );
  results.forEach((r, i) => {
    if (r.status === "fulfilled") out.push(r.value);
    else console.warn(`Mercado ${MARKET_SYMBOLS[i].nombre} no disponible:`, r.reason?.message);
  });
  return out;
}

// ─── 3 y 4. Claude ───────────────────────────────────────────────────────────

const client = SIN_IA ? null : new Anthropic();

function checkStop(msg, etapa) {
  if (msg.stop_reason === "refusal") throw new Error(`${etapa}: el modelo declinó la solicitud`);
  if (msg.stop_reason === "max_tokens") throw new Error(`${etapa}: respuesta truncada (max_tokens)`);
}

const MacroSchema = z.object({
  indicadores: z.array(
    z.object({
      nombre: z.string(),
      valor: z.string().describe("Valor tal como lo publica la fuente, p. ej. '9,25 %' o 'BB+ (estable)'"),
      fecha_dato: z.string().describe("Periodo o fecha a la que corresponde el dato"),
      fuente: z.string(),
      url: z.string(),
      comentario: z.string().describe("Una frase: tendencia reciente o próxima decisión/publicación"),
    }),
  ),
});

async function fetchMacro() {
  const hoy = hoyBogota();
  const messages = [
    {
      role: "user",
      content:
        `Hoy es ${hoy}. Busca en la web el dato vigente más reciente de cada indicador, ` +
        `priorizando fuentes oficiales (Banco de la República, DANE, Reserva Federal, BLS, BCE, ` +
        `agencias calificadoras) o agencias de noticias reconocidas:\n- ${MACRO_INDICATORS.join("\n- ")}\n\n` +
        `Reporta solo lo que encuentres en las fuentes; si un dato no se puede verificar, ` +
        `escribe "No verificado" en valor. Responde en español.`,
    },
  ];
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }];

  // Bucle corto para manejar pause_turn de la búsqueda web.
  for (let i = 0; i < 4; i++) {
    const msg = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(MacroSchema) },
      tools,
      messages,
    });
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }
    checkStop(msg, "Macro");
    if (!msg.parsed_output) throw new Error("Macro: no se pudo interpretar la respuesta");
    return msg.parsed_output.indicadores;
  }
  throw new Error("Macro: la búsqueda no terminó");
}

const Perspectiva = z.object({
  medio: z.string(),
  enfoque: z.string().describe("Qué enfatiza este medio y cómo encuadra el tema (1-2 frases, descriptivo, no valorativo)"),
});

const Tema = z.object({
  titulo: z.string().describe("Titular propio, neutral y concreto (máx. ~12 palabras)"),
  categoria: z.string().describe("Política, Economía, Seguridad, Geopolítica, Tecnología, Energía, Sociedad, Salud, Clima, etc."),
  importancia: z.number().int().describe("1 a 5: relevancia para un directivo en Colombia"),
  resumen: z.string().describe("Qué pasó, en 2-3 frases, solo hechos"),
  por_que_importa: z.string().describe("Por qué le debería importar a un directivo (impacto en negocio, país o mercados)"),
  perspectivas: z.array(Perspectiva).describe("Cómo lo cubren distintos medios; incluir los más contrastantes"),
  coincidencias: z.string().describe("En qué hechos coinciden las fuentes"),
  diferencias: z.string().describe("Dónde difieren el énfasis, el encuadre o los datos"),
  analisis: z.string().describe("Análisis equilibrado: argumentos principales de cada lado, incertidumbres y lo que aún no se sabe"),
  implicaciones: z.string().describe("Implicaciones prácticas para empresas/inversión/decisiones en Colombia"),
  que_vigilar: z.string().describe("Próximo hito, dato o decisión a seguir"),
  fuentes_ids: z.array(z.string()).describe("IDs de los artículos usados (p. ej. 'a12'); solo IDs de la lista dada"),
});

const BriefingSchema = z.object({
  titular_del_dia: z.string().describe("La idea más importante del día en una frase"),
  lo_esencial: z.array(z.string()).describe("4-6 viñetas: lo que hay que saber hoy si solo hay 1 minuto"),
  colombia: z.array(Tema).describe("4-6 temas más relevantes de Colombia, ordenados por importancia"),
  mundo: z.array(Tema).describe("4-6 temas más relevantes del mundo, ordenados por importancia"),
  lectura_mercados: z.string().describe("Lectura de 3-5 frases de los indicadores: qué se movió, por qué (según las noticias) y qué significa para Colombia"),
  agenda: z.array(z.string()).describe("Eventos y publicaciones de los próximos días a tener en el radar"),
  balance_cobertura: z.string().describe("Observación breve sobre sesgos o vacíos en la cobertura del día (qué temas cubrieron unos medios y otros no)"),
});

const SYSTEM = `Eres el analista jefe de un servicio de inteligencia informativa para la alta dirección de empresas en Colombia. Tu lector es un directivo muy ocupado que necesita estar bien informado en 5 minutos y tomar decisiones.

Principios editoriales (obligatorios):
- Neutralidad política estricta. No tomas partido por gobiernos, partidos, ideologías ni candidatos. Describes posiciones con el lenguaje más neutral posible y atribuyes cada valoración a quien la hace ("según X", "sus críticos sostienen", "el Gobierno argumenta").
- Cuando hay controversia, presentas con justicia el argumento más sólido de cada lado (steelman), sin falsos equilibrios cuando los hechos están claramente establecidos.
- Separa hechos verificables de interpretaciones y opiniones. Señala incertidumbres y lo que aún no se sabe.
- Compara cómo encuadran el tema medios de distintos países y líneas editoriales: qué enfatizan, qué omiten, qué palabras eligen. Esa comparación es descriptiva, no un juicio sobre los medios.
- Tus "opiniones" son análisis de impacto (económico, regulatorio, reputacional, de riesgo) para un directivo, no posturas políticas.
- Usa solo la información de los artículos proporcionados y los indicadores dados. No inventes cifras, citas ni hechos. Si algo no está en las fuentes, no lo afirmes.
- Prioriza por relevancia real (economía, política pública, regulación, seguridad, geopolítica, mercados, tecnología), no por ruido o farándula.
- Escribe en español claro, directo y sin adornos. Frases cortas.`;

function articlesPrompt(articles) {
  const fmt = (a) =>
    `[${a.id}] (${a.medio} · ${a.tipo}) ${a.titulo}${a.resumen ? ` — ${a.resumen.slice(0, 280)}` : ""}`;
  const col = articles.filter((a) => a.region === "colombia").map(fmt).join("\n");
  const mun = articles.filter((a) => a.region === "mundo").map(fmt).join("\n");
  return { col, mun };
}

function marketsPrompt(markets) {
  return markets
    .map((m) => {
      const v = m.valor?.toLocaleString("es-CO", { maximumFractionDigits: m.decimales ?? 2 });
      const d = m.variacion_pct != null ? `${m.variacion_pct >= 0 ? "+" : ""}${m.variacion_pct.toFixed(2)}% día` : "";
      const mm = m.variacion_mes_pct != null ? `${m.variacion_mes_pct >= 0 ? "+" : ""}${m.variacion_mes_pct.toFixed(2)}% mes` : "";
      return `- ${m.nombre}: ${v} ${m.unidad} (${[d, mm].filter(Boolean).join(", ")})`;
    })
    .join("\n");
}

async function analyze(articles, markets, macro) {
  const { col, mun } = articlesPrompt(articles);
  const macroTxt = macro.map((m) => `- ${m.nombre}: ${m.valor} (${m.fecha_dato}, ${m.fuente})`).join("\n");
  const user = `Fecha: ${hoyBogota()} (hora de Bogotá).

Prepara el informe del día. Agrupa los artículos que hablan del mismo hecho en un solo tema y compara cómo lo cubre cada medio. Prefiere temas cubiertos por varios medios; si un tema importante solo aparece en una fuente, inclúyelo pero indícalo.

## Indicadores de mercado
${marketsPrompt(markets) || "(no disponibles)"}

## Indicadores macro (último dato oficial)
${macroTxt || "(no disponibles)"}

## Titulares — Colombia
${col || "(sin datos)"}

## Titulares — Mundo
${mun || "(sin datos)"}`;

  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: betaZodOutputFormat(BriefingSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
  });
  const msg = await stream.finalMessage();
  checkStop(msg, "Análisis");
  const out = msg.parsed_output;
  if (!out) throw new Error("Análisis: no se pudo interpretar la respuesta");
  return { out, usage: msg.usage };
}

// Reemplaza los IDs por los enlaces reales (así nunca hay URLs inventadas).
function attachSources(temas, byId) {
  return temas.map(({ fuentes_ids, ...t }) => ({
    ...t,
    importancia: Math.max(1, Math.min(5, t.importancia)),
    fuentes: [...new Set(fuentes_ids)]
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((a) => ({ medio: a.medio, titulo: a.titulo, url: a.url })),
  }));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function readJSON(p) {
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const fecha = hoyBogota();
  console.log(`Generando informe ${fecha} con ${MODEL}${SIN_IA ? " (sin IA)" : ""}…`);
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const previo = await readJSON(path.join(DATA_DIR, "latest.json"));

  const [{ articles, estado }, mercados] = await Promise.all([fetchNews(), fetchMarkets()]);
  const okFeeds = estado.filter((e) => e.ok).length;
  console.log(`Noticias: ${articles.length} artículos de ${okFeeds}/${FEEDS.length} medios. Mercados: ${mercados.length}.`);
  if (articles.length < 20) throw new Error("Muy pocas noticias descargadas; se conserva el informe anterior.");

  let macro = previo?.macro ?? [];
  let analisis = null;
  let uso = null;
  if (!SIN_IA) {
    try {
      macro = await fetchMacro();
      console.log(`Macro: ${macro.length} indicadores.`);
    } catch (e) {
      console.warn("Macro no disponible, se usa el dato anterior:", e.message);
    }
    const { out, usage } = await analyze(articles, mercados, macro);
    const byId = new Map(articles.map((a) => [a.id, a]));
    analisis = { ...out, colombia: attachSources(out.colombia, byId), mundo: attachSources(out.mundo, byId) };
    uso = { input_tokens: usage.input_tokens, output_tokens: usage.output_tokens };
  }

  const informe = {
    fecha,
    generado: new Date().toISOString(),
    modelo: SIN_IA ? null : MODEL,
    demo: false,
    ...(analisis ?? {
      titular_del_dia: "Informe sin análisis (modo --sin-ia)",
      lo_esencial: [],
      colombia: [],
      mundo: [],
      lectura_mercados: "",
      agenda: [],
      balance_cobertura: "",
    }),
    mercados,
    macro,
    cobertura: { medios: estado, total_articulos: articles.length },
    uso,
  };

  const json = JSON.stringify(informe, null, 2);
  await fs.writeFile(path.join(DATA_DIR, "latest.json"), json);
  await fs.writeFile(path.join(ARCHIVE_DIR, `${fecha}.json`), json);

  const indice = (await fs.readdir(ARCHIVE_DIR))
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.slice(0, 10))
    .sort()
    .reverse();
  await fs.writeFile(path.join(DATA_DIR, "indice.json"), JSON.stringify(indice));
  console.log(`Listo: data/latest.json y data/archivo/${fecha}.json`);
}

main().catch((e) => {
  if (e instanceof Anthropic.AuthenticationError) console.error("Clave de API inválida o ausente (ANTHROPIC_API_KEY).");
  else if (e instanceof Anthropic.RateLimitError) console.error("Límite de uso de la API alcanzado; reintenta más tarde.");
  else if (e instanceof Anthropic.APIError) console.error(`Error de la API (${e.status}):`, e.message);
  else console.error(e);
  process.exit(1);
});
