# Guía de despliegue — Mis Finanzas y Tareas

Esta guía da por hecho únicamente dos cosas, porque son las que me has confirmado: que ya tienes creado un repositorio en GitHub y un proyecto en Supabase. Todo lo demás lo iremos haciendo juntos, paso a paso, y cada paso te dice cómo comprobar que ha funcionado antes de pasar al siguiente.

En total son 10 pasos. Entre 30 y 45 minutos si es la primera vez que haces algo así.

---

## Antes de empezar: los archivos

Todos estos archivos te los adjunto en esta conversación, dentro de una carpeta comprimida. Descomprímela en tu ordenador antes de seguir.

```
mis-finanzas-supabase/
├── index.html
├── app.css
├── app.js
├── data-layer.js
├── importar.html
├── config.example.js
├── README.md
├── GUIA_DESPLIEGUE.md   (este archivo)
└── sql/
    └── schema.sql
```

No necesitas instalar nada en tu ordenador (ni Node, ni git, ni ningún programa) para completar esta guía: todo se hace desde el navegador.

---

## Paso 1 · Ejecutar el SQL en Supabase

Esto crea las 4 tablas de tus datos (movimientos, tareas, golf, configuración) y, muy importante, las reglas de seguridad que hacen que **solo tú** puedas leer o escribir en ellas.

1. Entra en [supabase.com](https://supabase.com) y abre tu proyecto.
2. En el menú de la izquierda, pulsa el icono **SQL Editor**.
3. Pulsa **New query**.
4. Abre el archivo `sql/schema.sql` (de la carpeta que descomprimiste) con cualquier editor de texto, selecciona todo el contenido y cópialo.
5. Pégalo en el recuadro del SQL Editor de Supabase.
6. Pulsa **Run** (o Ctrl/Cmd + Enter).

✅ **Cómo saber que ha funcionado:** el panel inferior dice `Success. No rows returned`.
En el menú izquierdo, entra en **Table Editor** y confirma que ves 4 tablas nuevas: `movimientos`, `tareas`, `golf`, `config`.

❌ Si sale un error: cópiame el mensaje exacto y lo revisamos antes de seguir — no continúes al paso 2 hasta que esto esté en verde.

---

## Paso 2 · Crear tu usuario

Esta app es solo para ti, así que tu cuenta se crea directamente desde el panel de Supabase (no hay formulario de registro público en la app).

1. En el menú izquierdo, **Authentication** → pestaña **Users**.
2. Botón **Add user** → **Create new user**.
3. Rellena tu correo y una contraseña.
4. Activa la casilla **Auto Confirm User** (para no depender de un correo de confirmación).
5. Guarda.

✅ **Cómo saber que ha funcionado:** tu correo aparece en la lista de usuarios con estado "Confirmed".

Guarda ese correo y contraseña — son con los que entrarás en la app en el paso 8.

---

## Paso 3 · Desactivar el registro público

Para que nadie más pueda crearse una cuenta.

1. **Authentication** → **Providers** → **Email** (o **Authentication** → **Settings**, según la versión del panel).
2. Busca la opción **Allow new users to sign up** (o "Enable email signups") y **desactívala**.
3. Guarda los cambios.

✅ **Cómo saber que ha funcionado:** la opción queda visualmente apagada/desmarcada. (La app tampoco tiene ningún enlace de "crear cuenta", así que esto es una capa extra de tranquilidad, no imprescindible para que la app funcione.)

---

## Paso 4 · Copiar tus claves (y entender cuál es pública y cuál no)

1. **Project Settings** (el icono de engranaje, abajo a la izquierda) → **API**.
2. Vas a ver varios valores. Te interesan dos:

| Campo en Supabase | Qué es | ¿Es secreto? |
|---|---|---|
| **Project URL** | La dirección de tu base de datos | No — es pública |
| **anon** / **public** key | La clave que usa la app desde el navegador de quien sea | **No** — está pensada para ser pública. Lo que te protege de verdad son las reglas de seguridad del Paso 1 (RLS), no esconder esta clave |
| **service_role** key | Una clave con acceso total, sin ninguna restricción | **Sí, totalmente secreta** — no la necesitas para nada en esta app. No la copies a ningún archivo, no la subas a GitHub, no se la des a nadie |

Copia el **Project URL** y la clave **anon/public** — los vas a pegar en el paso siguiente.

---

## Paso 5 · Preparar tu configuración local

1. En la carpeta que descomprimiste, haz una copia de `config.example.js` y renómbrala a **`config.js`** (el nombre exacto importa).
2. Ábrelo con un editor de texto (el Bloc de notas vale) y sustituye los dos valores de ejemplo por los que copiaste en el Paso 4:

```js
window.SUPABASE_CONFIG = {
  url: 'https://tu-proyecto-real.supabase.co',
  anonKey: 'tu-clave-anon-real',
};
```

3. Guarda el archivo.

✅ **Cómo saber que ha funcionado:** el archivo `config.js` existe junto a `config.example.js`, con tus datos reales dentro.

---

## Paso 6 · Subir los archivos a GitHub

No hace falta usar la terminal ni instalar git — GitHub permite subir archivos arrastrándolos desde el navegador.

1. Entra en tu repositorio en [github.com](https://github.com).
2. Botón **Add file** → **Upload files**.
3. Arrastra (o selecciona) estos archivos **de golpe**: `index.html`, `app.css`, `app.js`, `data-layer.js`, `importar.html`, `config.js`, `README.md`.
4. Para la carpeta `sql`: créala primero escribiendo `sql/schema.sql` en el nombre del primer archivo al subirlo — GitHub crea la carpeta sola.
5. Abajo, en "Commit changes", deja el mensaje por defecto y pulsa **Commit changes**.

⚠️ Importante: sube `config.js` (con tus datos reales), **no** `config.example.js` — o sube ambos, no pasa nada, pero asegúrate de que `config.js` está presente, porque sin él la app no sabe a qué Supabase conectarse.

✅ **Cómo saber que ha funcionado:** al refrescar la página de tu repositorio, ves los 8 archivos (y la carpeta `sql`) listados.

---

## Paso 7 · Conectar Vercel con GitHub y desplegar

1. Entra en [vercel.com](https://vercel.com) y accede con tu cuenta de GitHub (botón **Continue with GitHub**).
2. **Add New** → **Project**.
3. Busca y selecciona tu repositorio → **Import**.
4. No tienes que tocar ninguna configuración (no hay "Framework" ni "Build Command" que ajustar: es un sitio estático, Vercel lo detecta solo). Pulsa **Deploy**.
5. Espera (suele tardar menos de un minuto).

✅ **Cómo saber que ha funcionado:** Vercel te da una URL tipo `https://tu-proyecto.vercel.app` con una captura de pantalla de la app. Ábrela.

Si al abrirla ves el formulario de inicio de sesión de la app (correo y contraseña), todo el despliegue técnico ha ido bien.

---

## Paso 8 · Entrar por primera vez

1. Abre la URL de Vercel del paso anterior.
2. Inicia sesión con el correo y contraseña del **Paso 2**.

✅ Deberías entrar y ver la app vacía (sin movimientos todavía) — eso es normal, lo siguiente es traer tus datos.

❌ Si dice "Correo o contraseña incorrectos": revisa que el usuario quedó "Confirmed" en el Paso 2. Si dice que falta configurar la app: revisa el Paso 5 y que subiste `config.js` real en el Paso 6.

---

## Paso 9 · Importar tus datos (sin duplicar nada)

Antes de este paso necesito saber una cosa: **¿has usado la app (la que te di dentro de Claude) desde que te la entregué?**

- **Si no la has tocado desde entonces**, dime que siga y uso la copia que ya tengo (313 movimientos, 21 artículos de golf, 14 tareas) para dejártela lista en un archivo.
- **Si has añadido o cambiado algo**, abre esa app, ve a **Más → Copia de seguridad (.json)**, descárgala, y súbemela aquí para que trabajemos con tus datos reales y actuales.

Una vez tengas el archivo `.json` (el que yo te prepare, o el que tú exportes):

1. Ten ese archivo `.json` a mano en tu ordenador (no hace falta subirlo a GitHub).
2. Abre `https://tu-proyecto.vercel.app/importar.html`.
3. Inicia sesión con el mismo usuario del Paso 2.
4. Elige el archivo `.json`.
5. Pulsa **Importar** y espera a que el registro de abajo diga "✅ Importación terminada".

✅ **Cómo saber que ha funcionado:** abre la app normal, pestaña **Movimientos** — deberías ver tus movimientos reales, agrupados por fecha.

🔒 **Por qué no duplica nada si lo repites:** cada movimiento, tarea o artículo de golf tiene un identificador único. Importar actualiza esa fila si ya existe, en vez de crear una nueva — así que puedes pulsar "Importar" con el mismo archivo tantas veces como quieras sin miedo a duplicar nada.

---

## Paso 10 · Verificación final

Repasa esta lista tú mismo, abriendo la app de verdad en el navegador (del ordenador y del móvil):

- [ ] La URL `https://tu-proyecto.vercel.app` abre la app fuera de Claude.
- [ ] Puedes iniciar sesión y cerrar sesión.
- [ ] Tus movimientos, tareas y Golf Reventa reales aparecen.
- [ ] Añades un movimiento desde el ordenador → aparece también en el móvil sin recargar manualmente (puede tardar un instante).
- [ ] Marcas una tarea como completada → se autofecha y pasa a "Completadas", igual que antes.
- [ ] Más → Copia de seguridad descarga un `.json` con tus datos.
- [ ] En el móvil: Añadir a pantalla de inicio funciona y la app abre a pantalla completa.

Cuando lo hayas comprobado tú mismo, dímelo y seguimos con lo que haga falta — no doy nada de esto por hecho hasta que me lo confirmes.

---

## Si algo falla

Dime en qué paso estás y qué mensaje ves exactamente (una captura de pantalla ayuda mucho) — con eso puedo decirte justo qué revisar, en vez de repetir todos los pasos.

## Copias de seguridad periódicas

Dos formas, puedes usar las dos:
- **Manual, cuando quieras:** Más → Copia de seguridad, dentro de la propia app.
- **Automática de la base de datos:** Supabase hace copias automáticas de tu proyecto. En el plan gratuito se conservan unos días hacia atrás; lo ves en Project Settings → Database → Backups. Si en el futuro quieres retención más larga, es un cambio de plan en Supabase, no de código.
