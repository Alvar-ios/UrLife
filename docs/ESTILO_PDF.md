# Estilo de los informes en PDF

Los documentos de `docs/` los convierte el delegado en PDF para el dueño. Estas son las reglas de ese PDF.

## Siempre

- **Fondo oscuro.** Fondo `#101014`, tarjetas `#18181D`, texto `#F2F2F4`, texto secundario `#A0A0AA`, líneas `#2C2C33`.
- **Breve.** Cuatro páginas como mucho. Si no cabe, se resume: lo largo se queda en el `.md` del repositorio.
- **Tipografía** Inter Display para los titulares e Inter para el texto.
- Primera página: titular grande con la conclusión (no el tema), y de 3 a 5 ideas en tarjetas.
- Última página: lo que debe decidir el dueño, lo que no se ha podido averiguar y las fuentes.
- Los datos comparados, en tablas. Lo que tiene forma (un mapa, un embudo, un calendario), en dibujo.
- Nada de datos personales de usuarios reales.

## Cada departamento, su color y su carácter

| Departamento | Acento | Cómo se ve |
|---|---|---|
| Marketing y comunicación | Magenta `#FF4D8D` | El más visual y expresivo: titulares grandes, dibujos, citas destacadas |
| Producto y diseño | Turquesa `#2FD4C4` | Capturas y bocetos grandes, poco texto, antes y después |
| Calidad | Verde `#3EE08C` para bien, ámbar `#FFB224` para aviso, rojo `#FF6B5E` para grave | Sobrio: semáforo arriba y tablas |
| Datos y seguridad | Cobalto `#6FA2FF` | El más seco: riesgos ordenados, el SQL en bloque de código |
| Dirección (el delegado) | Violeta `#A98BFF` | Neutro, el de la app |

Los colores deben leerse bien sobre el fondo oscuro (contraste mínimo 4,5 a 1 con el texto).
