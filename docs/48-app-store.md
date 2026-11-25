# 48 · PalomApp en el App Store: qué hace falta

Desarrollo · 24/11/2026 · Rama del código: `fase18/permisos-iphone` (sin publicar).

## 1. Lo que ya está hecho

- **App de iPhone** con la misma web dentro (Capacitor iOS, carpeta `movil/ios`). Nombre «PalomApp», identificador `es.palomapp.finanzas` (el mismo que en Android), solo iPhone y en vertical, icono y pantalla de carga de PalomApp, Face ID para el bloqueo.
- **Que se apunten solos en iPhone** con la app Atajos: «Apuntar aviso en PalomApp» (iOS 27, automatización «Notificación») y «Apuntar pago de Apple Pay» (automatización «Wallet»). El texto se lee en el móvil con el mismo lector que Android y solo se guarda el movimiento. Guía con dibujos en Tú → Avisos, Primeros pasos, la bienvenida y un aviso de Inicio.
- **Compilación sin Mac**: `.github/workflows/ios.yml`. Cada cambio en una rama `fase…` comprueba que compila. A mano («Actions → App de iPhone → Run workflow») la firma y la sube a TestFlight, si están los secretos.

## 2. Lo que tiene que hacer el dueño (en orden)

1. **Alta en Apple Developer Program** como persona física (99 USD al año). Lo más fácil: app «Apple Developer» en el iPhone → Cuenta → Inscribirse. Cuenta de Apple con verificación en dos pasos. Tarda 1-2 días.
2. **Crear la app en App Store Connect** (appstoreconnect.apple.com → Apps → +): plataforma iOS, nombre «PalomApp» (si está cogido, «PalomApp: gastos y tareas»), idioma principal Español (España), identificador `es.palomapp.finanzas`, SKU `palomapp`.
3. **Clave de la API** (App Store Connect → Usuarios y acceso → Integraciones → App Store Connect API → +, acceso «App Manager»). Descarga el archivo `.p8` (solo se puede una vez) y apunta el *Key ID* y el *Issuer ID*. El *Team ID* está en developer.apple.com → Account → Membership.
4. **Guardar 4 secretos en GitHub** (repositorio → Settings → Secrets and variables → Actions): `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (el contenido entero del `.p8`). Nunca en el chat.
5. **Lanzar la subida**: Actions → «App de iPhone» → Run workflow (rama `fase18/permisos-iphone` o `main` cuando se publique) → versión `1.0.0`. A los pocos minutos sale en TestFlight.
6. **Probar con TestFlight** en tu iPhone (y en los de quien quieras: hasta 100 personas por correo sin revisión larga).
7. **Ficha de la tienda** (te la preparo): descripción, palabras clave, capturas de 6,9″, categoría Finanzas, URL de privacidad (`/privacidad.html`), URL de soporte, edad, «Privacidad de la app», declaración de comerciante de la UE, y una **cuenta de prueba** para que Apple la revise.
8. **Enviar a revisión.**

## 3. Lo que falta o no está probado

- **Avisos de Juntos con la app cerrada en iPhone**: aún no (necesitan la clave de avisos de Apple y Firebase). Los recordatorios del propio móvil sí funcionan.
- «Compartir con PalomApp» de un extracto: solo Android por ahora. Widgets en iPhone («Te queda este mes» y «Apuntar gasto», 25/11, docs/49 B1+B2): hechos, pendientes de ver en un iPhone real.
- Nada se ha probado en un iPhone real: ni Face ID, ni Atajos, ni Apple Pay, ni la cámara para los tickets.
- Los nombres exactos de las pantallas de Atajos en español («Notificación», «Wallet», «Entrada del atajo») no están comprobados en un iPhone con iOS 27.
