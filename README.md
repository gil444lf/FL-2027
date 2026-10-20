# Carrera Pro ⚽

Modo carrera de fútbol para la web. Creas tu jugador, eliges liga y club, y construyes tu carrera con partidos, momentos clave, decisiones y traspasos.

## Cómo correrlo en VS Code

1. Instala [Node.js](https://nodejs.org) (versión 18 o superior).
2. Abre esta carpeta en VS Code (`Archivo > Abrir carpeta`).
3. Abre la terminal de VS Code (`Ctrl + ñ`) y ejecuta:

```bash
npm install
npm run dev
```

4. Abre el link que sale (normalmente http://localhost:5173). Cada vez que guardes un archivo, la página se actualiza sola.

Otros comandos:

- `npm run build`: genera la versión de producción en `dist/`.
- `npm run simular`: simula 200 carreras completas sin interfaz (sirve para probar el balance del juego).

## Estructura

```
src/
  main.js            Controlador: conecta los botones con el motor
  style.css          Estilos
  ui/views.js        Todas las pantallas (HTML)
  game/
    engine.js        Flujo del juego (jugar partido, eventos, mercado...)
    player.js        Atributos, posiciones, OVR, salario, desarrollo
    season.js        Calendario, tabla de posiciones, copa
    match.js         Simulación de partidos y momentos clave
    events.js        Decisiones/eventos aleatorios
    offseason.js     Fin de temporada, ofertas de fichaje, legado
    state.js         Partida nueva y guardado (localStorage)
  data/leagues.js    Ligas y clubes
scripts/simulate.mjs Simulador de carreras
```

## Cómo agregar cosas

- **Más ligas o clubes:** edita `src/data/leagues.js`. Cada liga necesita un número par de clubes (el calendario es de todos contra todos, ida y vuelta).
- **Más eventos de decisión:** agrega un objeto a `EVENTS` en `src/game/events.js`.
- **Más momentos clave:** agrega uno a `MOMENTS` en `src/game/match.js` (el arco con puntos verdes/rojos se arma solo según la probabilidad).
- **Camisetas:** los colores de cada club están en `src/data/kits.js`. Al agregar un club nuevo, añade su camiseta ahí (si no, se inventa una).

## Qué tiene la versión 0.1

- Creación de jugador: nombre, nacionalidad, posición, apariencia y reparto de atributos.
- 14 ligas con 8 clubes cada una (ampliable).
- Temporadas con liga y copa, tabla de posiciones y clásicos.
- Momentos clave en partidos importantes (penales, mano a mano, tiros libres, córners).
- Eventos de decisión (prensa, agente, fiestas, selección, patrocinios...).
- Mercado de fichajes cada temporada, con ofertas de clubes de todas las ligas.
- Desarrollo del jugador según edad, potencial oculto, minutos y foco de entrenamiento.
- Guardado automático en el navegador y pantalla de legado al retirarte.

## Próximos pasos sugeridos

1. Más clubes por liga y ascensos/descensos.
2. Torneos continentales (Champions, Libertadores) y Mundial con la selección.
3. Lesiones y contratos más detallados, cesiones, cláusulas.
4. Gráficos y sonidos.
5. **PWA** (`manifest` + service worker) para instalarlo desde el navegador.
6. Empaquetar con **Capacitor** (Android/iOS) y **Tauri/Electron** (Windows/Mac/Linux).
