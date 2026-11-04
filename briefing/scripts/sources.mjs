// Diarios y agencias que se leen cada mañana.
// La mezcla es deliberadamente amplia: distintos países, idiomas y líneas
// editoriales, para que el análisis pueda contrastar enfoques.
// Si un feed deja de funcionar, el generador lo omite y sigue con el resto.

export const FEEDS = [
  // ── Colombia ──────────────────────────────────────────────
  { medio: "El Tiempo", region: "colombia", tipo: "Diario nacional", url: "https://www.eltiempo.com/rss/colombia.xml" },
  { medio: "El Tiempo (Economía)", region: "colombia", tipo: "Diario nacional", url: "https://www.eltiempo.com/rss/economia.xml" },
  { medio: "El Espectador", region: "colombia", tipo: "Diario nacional", url: "https://www.elespectador.com/arc/outboundfeeds/rss/?outputType=xml" },
  { medio: "Semana", region: "colombia", tipo: "Revista / medio digital", url: "https://www.semana.com/arc/outboundfeeds/rss/?outputType=xml" },
  { medio: "El Colombiano", region: "colombia", tipo: "Diario regional", url: "https://www.elcolombiano.com/rss/colombia.xml" },
  { medio: "La República", region: "colombia", tipo: "Diario económico", url: "https://www.larepublica.co/rss/" },
  { medio: "Portafolio", region: "colombia", tipo: "Diario económico", url: "https://www.portafolio.co/rss/economia.xml" },
  { medio: "Infobae Colombia", region: "colombia", tipo: "Medio digital regional", url: "https://www.infobae.com/arc/outboundfeeds/rss/category/colombia/" },
  { medio: "Google Noticias Colombia", region: "colombia", tipo: "Agregador", url: "https://news.google.com/rss?hl=es-419&gl=CO&ceid=CO:es-419" },

  // ── Mundo ─────────────────────────────────────────────────
  { medio: "Reuters (vía Google News)", region: "mundo", tipo: "Agencia", url: "https://news.google.com/rss/search?q=when:1d+site:reuters.com&hl=en-US&gl=US&ceid=US:en" },
  { medio: "AP (vía Google News)", region: "mundo", tipo: "Agencia", url: "https://news.google.com/rss/search?q=when:1d+site:apnews.com&hl=en-US&gl=US&ceid=US:en" },
  { medio: "BBC News", region: "mundo", tipo: "Servicio público (Reino Unido)", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { medio: "BBC Mundo", region: "mundo", tipo: "Servicio público (Reino Unido)", url: "https://feeds.bbci.co.uk/mundo/rss.xml" },
  { medio: "The New York Times", region: "mundo", tipo: "Diario (EE. UU.)", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { medio: "The Wall Street Journal", region: "mundo", tipo: "Diario económico (EE. UU.)", url: "https://feeds.content.dowjones.io/public/rss/RSSWorldNews" },
  { medio: "Fox News", region: "mundo", tipo: "Cadena (EE. UU.)", url: "https://moxie.foxnews.com/google-publisher/world.xml" },
  { medio: "The Guardian", region: "mundo", tipo: "Diario (Reino Unido)", url: "https://www.theguardian.com/world/rss" },
  { medio: "Financial Times", region: "mundo", tipo: "Diario económico (Reino Unido)", url: "https://www.ft.com/world?format=rss" },
  { medio: "The Economist", region: "mundo", tipo: "Semanario (Reino Unido)", url: "https://www.economist.com/international/rss.xml" },
  { medio: "El País", region: "mundo", tipo: "Diario (España)", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada" },
  { medio: "Le Monde", region: "mundo", tipo: "Diario (Francia)", url: "https://www.lemonde.fr/international/rss_full.xml" },
  { medio: "DW Español", region: "mundo", tipo: "Servicio público (Alemania)", url: "https://rss.dw.com/xml/rss-sp-all" },
  { medio: "France 24 Español", region: "mundo", tipo: "Servicio público (Francia)", url: "https://www.france24.com/es/rss" },
  { medio: "Al Jazeera", region: "mundo", tipo: "Cadena (Catar)", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { medio: "South China Morning Post", region: "mundo", tipo: "Diario (Hong Kong)", url: "https://www.scmp.com/rss/91/feed" },
  { medio: "Clarín", region: "mundo", tipo: "Diario (Argentina)", url: "https://www.clarin.com/rss/mundo/" },
  { medio: "CNBC", region: "mundo", tipo: "Cadena económica (EE. UU.)", url: "https://www.cnbc.com/id/100727362/device/rss/rss.html" },
];

// Indicadores de mercado (Yahoo Finance, gratuito y sin clave).
export const MARKET_SYMBOLS = [
  { id: "usdcop", nombre: "Dólar / Peso", simbolo: "COP=X", grupo: "Divisas", unidad: "COP", decimales: 0 },
  { id: "eurusd", nombre: "Euro / Dólar", simbolo: "EURUSD=X", grupo: "Divisas", unidad: "USD", decimales: 4 },
  { id: "dxy", nombre: "Índice dólar (DXY)", simbolo: "DX-Y.NYB", grupo: "Divisas", unidad: "pts", decimales: 2 },
  { id: "brent", nombre: "Petróleo Brent", simbolo: "BZ=F", grupo: "Materias primas", unidad: "USD/bbl", decimales: 2 },
  { id: "wti", nombre: "Petróleo WTI", simbolo: "CL=F", grupo: "Materias primas", unidad: "USD/bbl", decimales: 2 },
  { id: "cafe", nombre: "Café arábica", simbolo: "KC=F", grupo: "Materias primas", unidad: "USc/lb", decimales: 2 },
  { id: "oro", nombre: "Oro", simbolo: "GC=F", grupo: "Materias primas", unidad: "USD/oz", decimales: 0 },
  { id: "carbon", nombre: "Carbón (Newcastle)", simbolo: "MTF=F", grupo: "Materias primas", unidad: "USD/t", decimales: 2 },
  { id: "colcap", nombre: "MSCI COLCAP", simbolo: "^COLCAP", grupo: "Bolsas", unidad: "pts", decimales: 2, alternativo: "ICOL" },
  { id: "sp500", nombre: "S&P 500", simbolo: "^GSPC", grupo: "Bolsas", unidad: "pts", decimales: 0 },
  { id: "nasdaq", nombre: "Nasdaq", simbolo: "^IXIC", grupo: "Bolsas", unidad: "pts", decimales: 0 },
  { id: "stoxx", nombre: "Euro Stoxx 50", simbolo: "^STOXX50E", grupo: "Bolsas", unidad: "pts", decimales: 0 },
  { id: "us10y", nombre: "Bono EE. UU. 10 años", simbolo: "^TNX", grupo: "Tasas", unidad: "%", decimales: 2 },
  { id: "vix", nombre: "Volatilidad (VIX)", simbolo: "^VIX", grupo: "Riesgo", unidad: "pts", decimales: 2 },
  { id: "btc", nombre: "Bitcoin", simbolo: "BTC-USD", grupo: "Riesgo", unidad: "USD", decimales: 0 },
];

// Indicadores macro: se buscan en fuentes oficiales con búsqueda web.
export const MACRO_INDICATORS = [
  "Tasa de política monetaria del Banco de la República de Colombia",
  "Inflación anual Colombia (IPC, DANE) — último dato mensual",
  "Tasa de desempleo nacional Colombia (DANE) — último dato",
  "Crecimiento del PIB de Colombia (DANE) — último trimestre, variación anual",
  "Tasa de interés de la Reserva Federal de EE. UU. (rango objetivo)",
  "Inflación anual EE. UU. (CPI, BLS) — último dato",
  "Tasa de interés del Banco Central Europeo (facilidad de depósito)",
  "Calificación soberana de Colombia (S&P, Moody's, Fitch) — vigente",
];
