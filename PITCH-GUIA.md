# AeroTrack Sentinel — Guion de Pitch (90 segundos)

> Hackathon ARKIV × PunaTech 2026

**Demo funcional:** [aerotrack-sentinel.vercel.app](https://aerotrack-sentinel.vercel.app)

**Transacciones verificables en Block Explorer:**
- Batch flotas: [0x5046...bb89](https://explorer.braga.hoodi.arkiv.network/tx/0x504616d2ebdf07825563c8cc68b042e4e4212ef795208a52ac99a5f867fbbb89)
- Batch decisiones: [0x2136...ff4e](https://explorer.braga.hoodi.arkiv.network/tx/0x213602d56c761171952bd231df2dda0abcccb8cb14b74be8d721dbabed2eff4e)
- Simulación IA: [0xe147...3b0e](https://explorer.braga.hoodi.arkiv.network/tx/0xe14712f2e0810d3b1691bc5b56dc24b171b9579d942d871bd7eb9ca991073b0e)

---

## Slide 0 — Título (3s)

**[Pantalla: Logo de AeroTrack Sentinel + fondo oscuro]**

> "AeroTrack Sentinel — Auditoría logística con IA sobre Arkiv."

---

## 1. Problema (15s)

**[Pantalla: Ícono de camión con signo de alerta + texto clave]**

> "La IA que asigna rutas logísticas opera como una caja negra. Cuandofalla una ruta — por clima, accidente o corte — no hay forma de auditar por qué el modelo tomó esa decisión. Los datos viven en servidores cerrados donde cualquiera puede alterarlos sin dejar rastro."

**Puntos clave en pantalla:**
- ❌ Decisiones de IA no auditables
- ❌ Datos en plataformas cerradas y mutables
- ❌ Imposible rastrear por qué se tomó una decisión

---

## 2. Solución (20s)

**[Pantalla: Dashboard de AeroTrack mostrando las flotas y decisiones de riesgo]**

> "Construimos AeroTrack Sentinel: un dashboard que registra inmutablemente cada decisión de ruta generada por IA como una entidad en Arkiv. Nadie puede alterar o eliminar un registro a escondidas — cada decisión es verificable públicamente con un hash de transacción."

**Puntos clave en pantalla:**
- ✅ Decisiones registradas on-chain en Arkiv
- ✅ `$creator` inmutable — atribución a prueba de manipulación
- ✅ `riskScore` como atributo numérico — filtrado por rango
- ✅ Hash de transacción visible — verificable en el explorador

---

## 3. Arkiv (25s)

**[Pantalla: Diagrama de las 2 entidades con sus atributos y expiración]**

> "Usamos PROJECT_ATTRIBUTE para aislar nuestro namespace. Estructuramos dos entidades: fleet_profile con expiración de 30 días — las flotas son datos duraderos — y routing_decision con expiración de 24 horas — una alerta de nieve pierde relevancia al día siguiente. Los riskScore son atributos numéricos, lo que nos permite filtrar con gt(5) las decisiones de alto riesgo. El payload JSON guarda la justificación del modelo de IA, mientras los atributos tipados son nuestros índices. Y `fleetId` funciona como foreign key compartida entre ambas entidades."

**En pantalla — Diagrama:**

```
fleet_profile                 routing_decision
┌─────────────────────┐      ┌─────────────────────────┐
│ project: "aerotrack" │      │ project: "aerotrack"     │
│ type: "fleet_profile"│      │ type: "routing_decision" │
│ fleetId: "flota-01" │◄────►│ fleetId: "flota-01"      │
│ operationalStatus: 1 │      │ riskScore: 8 ← NUMBER    │
│ (30 días expires)    │      │ createdAt: Date.now      │
│                     │      │ (24hs expires)           │
└─────────────────────┘      └─────────────────────────┘
         │                              │
     Payload:                    Payload:
   {mainRoute,                  {aiJustification,
    vehicleType}                  model}
```

**Puntos clave en pantalla:**
- `project` attribute = namespace obligatorio
- `riskScore` number = range queries (`gt(5)`)
- `fleetId` = shared-attribute foreign key
- `expiresIn` diferenciado: 30d flotas / 24h decisiones

---

## 4. Demo (20s)

**[Pantalla: Grabación en vivo del dashboard]**

> "Cargamos datos de prueba — tres flotas y ocho decisiones de ruta se crean como transacciones en Arkiv. Simulamos una nueva decisión IA — riesgo 7 sobre 10. Inmediatamente aparece en el dashboard filtrada por alto riesgo. Cada registro tiene un hash de entidad verificable en el Data Explorer. Y podemos cambiar el estado operativo de una flota — la transacción queda registrada on-chain."

**Acciones en pantalla (hacerlas mientras se habla):**
1. Click **"Cargar datos de prueba"** → se crean entidades en Arkiv
2. Click **"Simular IA"** → nueva decisión aparece en la tabla
3. Click en el **ícono de enlace** (ExternalLink) junto a una entidad → se abre el Data Explorer
4. Click en **"Emergencia"** en una flota → actualiza estado
5. Mostrar el **alert verde** con el txHash y link al Block Explorer

---

## 5. Cierre (10s)

**[Pantalla: Logo de AeroTrack + texto final]**

> "Con AeroTrack Sentinel, la memoria operativa de la IA es auditable, portable y controlada por el usuario. Arkiv no es un checkbox al final — es el corazón del sistema. Gracias."

**En pantalla:**
- 🔗 github.com/gabriel-alejandropereagarcia/aerotrack-sentinel
- 🔗 Demo en Vercel
- 🎯 Vertical: Procedencia y auditoría de IA

---

## Notas para la grabación

### Tips de grabación
- Usá **Loom** o **OBS** — gravá la pantalla + tu cara
- Hablá **lento y claro** — 90 segundos pasa rápido
- Tené la app ya cargada con datos antes de empezar
- Tené el Data Explorer abierto en otra pestaña para el punto 4
- Tené el Block Explorer abierto para mostrar el txHash

### Antes de grabar
1. Hacé `npm run dev`
2. Clickeá "Cargar datos de prueba" y esperá a que carguen
3. Clickeá "Simular IA" un par de veces para tener datos
4. Verificá que los links al Data Explorer funcionen
5. Tené el faucet ya financiado

### Si te pasa el tiempo
- Podés saltarte la sección de Arkiv (3) si te quedás corto
- Lo más importante es la **demo** (sección 4) — que se vea funcionando
- El cierre es rápido — no alargues

### Formato de entrega
- Video público en YouTube o Google Drive
- 2-3 minutos máximo
- Pitch en español