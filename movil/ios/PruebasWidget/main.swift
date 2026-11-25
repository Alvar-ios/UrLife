import Foundation

// Pruebas de las reglas del widget (sin pantalla). Se compilan con WidgetDatos.swift:
//   swiftc -o /tmp/pruebas-widget ../App/PalomaWidget/WidgetDatos.swift main.swift && /tmp/pruebas-widget
// Datos inventados. Son las mismas reglas que movil/android/.../WidgetDatosTest.java.
var fallos = 0
func ok(_ c: Bool, _ m: String) { print((c ? "PASS " : "FAIL ") + m); if !c { fallos += 1 } }

let base = ResumenGuardado(sesion: true, texto: "Te queda este mes", mes: "Noviembre", queda: "1.234,56 €", oculto: false, negativo: false,
                           progreso: -1, desde: "2026-11-01", hasta: "2026-11-30")

// días y barra
ok(WidgetDatos.dia("1970-01-01") == 0 && WidgetDatos.dia("1970-01-02") == 1, "dia: 1970-01-01 es el día 0")
ok(WidgetDatos.dia("2026-12-01") - WidgetDatos.dia("2026-11-01") == 30, "dia: noviembre tiene 30 días")
ok(WidgetDatos.dia("2028-03-01") - WidgetDatos.dia("2028-02-01") == 29, "dia: febrero de 2028 (bisiesto) tiene 29")
ok(WidgetDatos.dia("hola") == -1 && WidgetDatos.dia("") == -1 && WidgetDatos.dia("2026-13-01") == -1, "dia: lo que no es fecha da -1")
ok(WidgetDatos.progreso(desde: "2026-11-01", hasta: "2026-11-30", hoy: "2026-11-15") == 500, "progreso: a mitad de mes, 500")
ok(WidgetDatos.progreso(desde: "2026-11-01", hasta: "2026-11-30", hoy: "2026-11-01") == 33, "progreso: el primer día ya cuenta (33)")
ok(WidgetDatos.progreso(desde: "2026-11-01", hasta: "2026-11-30", hoy: "2026-11-30") == 1000, "progreso: el último día, 1000")
ok(WidgetDatos.progreso(desde: "2026-11-01", hasta: "2026-11-30", hoy: "2026-10-20") == 0, "progreso: antes del mes, 0")
ok(WidgetDatos.progreso(desde: "", hasta: "", hoy: "2026-11-15") == -1, "progreso: sin fechas, -1")

// sin sesión
var v = WidgetDatos.calcular(.vacio, hoy: "2026-11-10")
ok(v.cifra == "Abre PalomApp" && v.texto == "PalomApp" && v.barra == -1 && v.mes.isEmpty, "sin sesión: «Abre PalomApp», sin cifra ni barra")

// normal
v = WidgetDatos.calcular(base, hoy: "2026-11-15")
ok(v.texto == "Te queda este mes" && v.mes == "Noviembre" && v.cifra == "1.234,56 €" && v.barra == 500 && !v.negativo, "con sesión: rótulo, mes, cifra y barra")
ok(v.diasQuedan == 15 && WidgetDatos.diasTexto(v.diasQuedan) == "Quedan 15 días", "quedan 15 días (mediano)")
ok(WidgetDatos.diasTexto(1) == "Queda 1 día" && WidgetDatos.diasTexto(0) == "Último día del mes" && WidgetDatos.diasTexto(-1) == "", "textos de los días")
ok(v.descripcion == "Te queda este mes, Noviembre: 1.234,56 €", "descripción para VoiceOver")

// lo previsto no se mezcla con lo real: el rótulo viene de la web y se respeta
var b = base; b.texto = "En tu banco hoy"
ok(WidgetDatos.calcular(b, hoy: "2026-11-15").texto == "En tu banco hoy", "«En tu banco hoy» se respeta")
b.texto = "Gastos de este mes"
ok(WidgetDatos.calcular(b, hoy: "2026-11-15").texto == "Gastos de este mes", "«Gastos de este mes» se respeta")
b.texto = ""
ok(WidgetDatos.calcular(b, hoy: "2026-11-15").texto == "Te queda este mes", "sin rótulo, «Te queda este mes»")

// mes terminado
v = WidgetDatos.calcular(base, hoy: "2026-12-01")
ok(v.texto == "Empieza un mes nuevo" && v.cifra == "Abre PalomApp" && v.mes.isEmpty && v.barra == -1, "mes terminado: «Empieza un mes nuevo», sin cifra vieja")
ok(WidgetDatos.calcular(base, hoy: "2026-11-30").cifra == "1.234,56 €", "el último día del mes aún se ve la cifra")

// ocultar cifras y negativo
var o = base; o.oculto = true; o.queda = "1.234,56 €"; o.negativo = true
v = WidgetDatos.calcular(o, hoy: "2026-11-15")
ok(v.cifra == "•••" && !v.negativo && !v.descripcion.contains("1.234"), "con las cifras ocultas: «•••», sin rojo y sin la cifra en la descripción")
var n = base; n.negativo = true; n.queda = "-20,00 €"
ok(WidgetDatos.calcular(n, hoy: "2026-11-15").negativo, "cifra negativa: se pinta en negativo")

// sin fechas, vale el progreso guardado
var s = base; s.desde = ""; s.hasta = ""; s.progreso = 0.25
ok(WidgetDatos.calcular(s, hoy: "2026-11-15").barra == 250, "sin fechas se usa el progreso guardado")

// lo que se guarda en la cajita
let d = UserDefaults(suiteName: "pruebas.widget." + UUID().uuidString)!
let web: [String: Any] = ["sesion": true, "texto": "Te queda este mes", "mes": "Noviembre", "queda": "99,00 €", "oculto": false, "negativo": false,
                          "progreso": 0.4, "desde": "2026-11-01", "hasta": "2026-11-30",
                          "correo": "alguien@ejemplo.com", "token": "secreto", "uid": "u-1"]
WidgetAlmacen.guardar(web, en: d)
let leido = WidgetAlmacen.leer(de: d)
ok(leido.sesion && leido.queda == "99,00 €" && leido.mes == "Noviembre" && abs(leido.progreso - 0.4) < 0.0001, "guardar y leer devuelve lo mismo")
let crudo = String(data: d.data(forKey: WidgetClaves.resumen) ?? Data(), encoding: .utf8) ?? ""
ok(!crudo.contains("alguien@") && !crudo.contains("secreto") && !crudo.contains("u-1"), "no se guarda correo, clave ni identificador")
var oc = web; oc["oculto"] = true
WidgetAlmacen.guardar(oc, en: d)
ok(WidgetAlmacen.leer(de: d).queda == "•••", "con «ocultar cifras» ni siquiera se guarda la cifra")
WidgetAlmacen.guardar(["sesion": false], en: d)
ok(d.data(forKey: WidgetClaves.resumen) == nil && WidgetAlmacen.leer(de: d) == .vacio, "al cerrar sesión se borra todo")
WidgetAlmacen.guardar(web, en: d); WidgetAlmacen.guardar([:], en: d)
ok(WidgetAlmacen.leer(de: d) == .vacio, "una llamada vacía también borra")
ok(WidgetAlmacen.leer(de: nil) == .vacio, "sin cajita compartida, «Abre PalomApp»")
let largo = WidgetAlmacen.resumen(desde: ["sesion": true, "queda": String(repeating: "9", count: 500)])
ok(largo.queda.count == 24, "los textos se cortan")

// hoy como texto
var cal = Calendar(identifier: .gregorian); cal.timeZone = TimeZone(identifier: "Europe/Madrid")!
let f = DateComponents(calendar: cal, timeZone: cal.timeZone, year: 2026, month: 3, day: 5, hour: 23, minute: 59).date!
ok(WidgetDatos.iso(f, calendario: cal) == "2026-03-05", "iso: AAAA-MM-DD en la zona del móvil")

print(fallos == 0 ? "TODO BIEN" : "\(fallos) FALLOS")
exit(fallos == 0 ? 0 : 1)
