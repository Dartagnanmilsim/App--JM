# Informe Diario

Lo esencial de **Colombia y el mundo** e **indicadores económicos clave**, en una página limpia pensada para un directivo que necesita estar informado en 5 minutos.

## Qué hace

Cada mañana (5:43 a. m., hora de Bogotá) un proceso automático:

1. **Lee ~27 medios** de distintos países y líneas editoriales: El Tiempo, El Espectador, Semana, El Colombiano, La República, Portafolio, Reuters, AP, BBC, NYT, WSJ, Fox News, The Guardian, Financial Times, The Economist, El País, Le Monde, DW, France 24, Al Jazeera, South China Morning Post, Clarín, CNBC, entre otros (`scripts/sources.mjs`).
2. **Descarga indicadores de mercado**: TRM oficial (Superfinanciera), dólar/peso, euro, DXY, Brent, WTI, café, oro, carbón, COLCAP, S&P 500, Nasdaq, Euro Stoxx, bono a 10 años de EE. UU., VIX y Bitcoin, con su variación diaria, la del último mes y una minigráfica.
3. **Busca el último dato macro oficial** (tasa del Banco de la República, inflación, desempleo y PIB del DANE, tasa de la Fed, inflación de EE. UU., tasa del BCE y calificación soberana), con enlace a la fuente.
4. **Analiza con Claude**: agrupa las notas por tema, compara cómo las cuenta cada medio (en qué coinciden y en qué difieren), y escribe para cada tema:
   - qué pasó, solo hechos,
   - por qué le importa a un directivo,
   - un análisis equilibrado que presenta con justicia cada postura,
   - implicaciones para el negocio y qué vigilar,
   - enlaces a las notas originales.

### Criterio editorial (sin sesgo político)

El análisis sigue reglas fijas (ver `SYSTEM` en `scripts/generate.mjs`): neutralidad estricta frente a partidos, gobiernos e ideologías; cada valoración se atribuye a quien la hace; se presentan los mejores argumentos de cada lado sin falsos equilibrios; se separan hechos de opiniones; y no se usa nada que no esté en las fuentes. Las "opiniones" son análisis de impacto para la toma de decisiones, no posturas políticas. Los enlaces de las fuentes salen de los feeds, nunca del modelo, así que no pueden ser inventados.

## Puesta en marcha

1. **Clave de API**: en GitHub → *Settings → Secrets and variables → Actions*, cree el secreto `ANTHROPIC_API_KEY`.
2. **Publicar la página**: en *Settings → Pages*, elija *Deploy from a branch*, rama principal, carpeta `/ (root)`. El informe queda en `https://<usuario>.github.io/<repositorio>/briefing/`.
3. **Primera ejecución**: en *Actions → Informe diario → Run workflow*. Después corre solo todos los días. (Las tareas programadas de GitHub solo se activan desde la rama principal.)

Hasta la primera ejecución, la página muestra **datos de ejemplo** marcados con un aviso.

### En su computador

```bash
cd briefing
npm install
ANTHROPIC_API_KEY=sk-... npm run generar   # genera data/latest.json
npm run servir                             # abre http://localhost:8080
```

`npm run generar:sin-ia` descarga noticias e indicadores sin llamar a la IA (útil para probar fuentes).

## Personalizar

- **Medios e indicadores**: `scripts/sources.mjs`.
- **Enfoque del análisis** (p. ej. su sector): edite `SYSTEM` en `scripts/generate.mjs`.
- **Hora**: la línea `cron` en `.github/workflows/informe-diario.yml` (está en UTC; Bogotá = UTC−5).
- **Modelo**: variable `BRIEFING_MODEL` (por defecto `claude-opus-5-5`).

## Archivos

```
briefing/
├── index.html, styles.css, app.js   Página (sin dependencias, funciona en móvil, modo oscuro)
├── scripts/generate.mjs             Generador diario
├── scripts/sources.mjs              Medios e indicadores
└── data/
    ├── latest.json                  Informe de hoy
    ├── indice.json                  Fechas disponibles
    └── archivo/AAAA-MM-DD.json      Histórico (selector de fecha en la página)
```

Costo aproximado: cada ejecución procesa unos 40–100 mil tokens con Claude Opus 5.5 más algunas búsquedas web; del orden de un dólar o menos al día. Revise el consumo en la consola de Anthropic tras los primeros días.
