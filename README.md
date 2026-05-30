# AeroTrack Sentinel

> Dashboard de auditoría logística que registra inmutablemente las decisiones de rutas generadas por IA, usando [Arkiv](https://arkiv.network) como capa de datos.

Proyecto para el **Hackathon ARKIV × PunaTech 2026**.

**Cada decisión de ruta registrada en AeroTrack Sentinel es una transacción verificable en la blockchain de Arkiv.** Los hashes de transacción se muestran en el dashboard y pueden verificarse en el [Block Explorer de Braga](https://explorer.braga.hoodi.arkiv.network) y el [Data Explorer](https://data.arkiv.network).

**Demo:** [aerotrack-sentinel.vercel.app](https://aerotrack-sentinel.vercel.app)

---

## Por qué existe AeroTrack Sentinel

Cuando una IA logística decide desviar una flota por nieve, accidente o protestas, se genera una **decisión operativa crítica**. Hoy ese registro vive en una base de datos centralizada: cualquier administrador puede modificarlo, borrarlo, o reinterpretarlo. No hay forma criptográfica de probar **quién** tomó la decisión, **cuándo**, ni **qué justificación dio el modelo**. Si hay un incidente — camiones desviados a una ruta peligrosa — la auditoría es imposible porque la fuente de verdad es mutable.

Arkiv resuelve esto almacenando entidades **inmutables** en blockchain. Cada write genera un `txHash` registrado en Braga testnet. El campo `$creator` es la dirección de la wallet que creó la entidad — **no se puede falsificar ni modificar después**. Esto convierte cada decisión de IA en un registro auditable a prueba de manipulación.

---

## Decisiones de Diseño

### 1. PROJECT_ATTRIBUTE como namespace obligatorio

```ts
PROJECT_ATTRIBUTE = { key: "project", value: "aerotrack-sentinel" }
```

Arkiv es una base de datos compartida por todos los proyectos del hackathon. Sin este atributo, una query genérica devolvería entidades de otros equipos. Lo estampamos en **toda entidad creada** y en **toda query** como primer filtro `.where([eq("project", "aerotrack-sentinel"), ...])`. Esto garantiza aislamiento de namespace sin permisos ni bases separadas.

### 2. Expiración diferenciada: 30 días vs 24 horas

| Entidad | expiresIn | Por qué |
|---------|-----------|---------|
| `fleet_profile` | 30 días | Las flotas son recursos estables — rutas y tipos de vehículo no cambian hora a hora. Pero tampoco son permanentes: en testnet, mantener entidades vivas para siempre contamina la base de datos. 30 días es suficiente para demostrar durabilidad sin desperdiciar espacio. |
| `routing_decision` | 24 horas (86400s) | Una alerta de nieve en un paso andino es **perecedera**. A las 24 horas, la tormenta ya pasó o la ruta se habilitó. Si esas decisiones viven para siempre, la base se llena de ruido operativo. La expiración de 24hs modela la **semántica del dato**: un aviso de riesgo logístico tiene vida útil corta por naturaleza. |

**Por qué no el mismo tiempo para ambas:** La expiración refleja la naturaleza del dato. Una flota no caduca a las 24hs (perderías el registro de qué flotas existen). Una alerta no vive 30 días (contaminaría las queries con ruido viejo). Mezclar expiraciones habría sido un error de diseño de producto.

### 3. riskScore como atributo numérico (no string)

```ts
{ key: "riskScore", value: 8 }  // number, no "8" string
```

Si `riskScore` fuera un string `"8"`, las queries por rango serían ordinales — `"8" > "5"` funciona por casualidad, pero `"10" < "5"` porque ordena alfabéticamente. Al guardarlo como number, Arkiv puede hacer `gt("riskScore", 5)` y obtener correctamente solo las decisiones de riesgo alto. Esto habilita la funcionalidad central del dashboard: filtrar alto riesgo con una query eficiente.

### 4. fleetId como foreign key compartida

```ts
// En fleet_profile:
{ key: "fleetId", value: "flota-norte-01" }
// En routing_decision:
{ key: "fleetId", value: "flota-norte-01" }
```

Arkiv no tiene JOINs ni relaciones nativas entre entidades. La forma de conectar una decisión con su flota es usar el **mismo atributo `fleetId`** en ambas. Cuando el usuario clickea una flota, hacemos `fetchDecisionsByFleet(fleetId)` que filtra `eq("fleetId", fleetId)`. Es el equivalente a una FK en SQL, pero modelado con atributos compartidos.

### 5. createdAt como atributo de ordenamiento

```ts
{ key: "createdAt", value: Date.now() }
```

Permite `orderBy(desc("createdAt", "number"))` para mostrar las decisiones más recientes primero. Sin este atributo tipado como number, no habría forma de ordenar cronológicamente los resultados.

### 6. serializeWrite con retry + backoff + timeout

```ts
serializeWrite(() => walletClient.createEntity({...}))
```

Dos motivos:

- **Nonce races:** En Braga testnet, si envías dos transacciones casi simultáneas (como en `seed-demo` que crea 3 flotas + 8 decisiones), el nonce se desincroniza y la segunda falla con "already known" o "replacement underpriced". `serializeWrite` encola las escrituras para que se ejecuten una por una (cola de promesas encadenadas).
- **Rate limiting y fork floods:** Braga es una testnet compartida. Los rate limits (429) y los reorgs temporales son frecuentes. `withRetry` reintenta hasta 3 veces con backoff exponencial (800ms, 1.6s, 2.4s) solo en errores `retryable`. Si el error es `insufficient_funds` o `expired_entity`, falla inmediatamente — no tiene sentido reintentar.

**El patrón de `serializeWrite` se adoptó de los proyectos ganadores de hackathones anteriores** (ark-hive, Cortex), que demostraron que la serialización de escrituras es esencial para interactuar con L2s de forma confiable.

### 7. Backend wallet (PRIVATE_KEY server-side)

```ts
// NUNCA expuesto al cliente — solo server-side
const pk = process.env.PRIVATE_KEY
```

El usuario final nunca firma transacciones ni conecta wallet. La wallet del servidor (`0xA56D...`) crea todas las entidades. Esto es correcto porque:

- La **abstracción blockchain** es un requisito del hackathon ("blockchain must be fully abstracted from the end user"). Un operador logístico no va a instalar MetaMask.
- En producción, esta wallet sería una wallet corporativa con permisos de escritura, no una persona individual.
- El `$creator` de todas las entidades es siempre esa dirección, lo que permite filtrar con `.createdBy(trustedWallet)` para mostrar solo los datos de nuestra aplicación.

### 8. jsonToPayload para la separación atributos/payload

```ts
payload: jsonToPayload({ aiJustification: "...", model: "aero-v2" })
```

El contenido semántico (justificación de la IA, nombre del modelo) va en el **payload** JSON. Los campos que necesitas filtrar/ordenar (`riskScore`, `fleetId`, `createdAt`) van como **atributos tipados**. Esta separación es fundamental en Arkiv: los atributos son los índices de consulta, el payload es el contenido completo que lees cuando necesitás el detalle.

### 9. refetchInterval diferenciado

```ts
// Flotas: 30 segundos (datos estables)
refetchInterval: 30_000
// Decisiones: 15 segundos (datos más dinámicos)
refetchInterval: 15_000
```

Las flotas cambian raramente (solo cuando se actualiza el estado operativo). Las decisiones de riesgo se crean constantemente (cada "Simular IA"). Un refetch más frecuente en decisiones refleja que los datos cambian más rápido.

### 10. Mensajes de error en español con classifyArkivError

Los errores de Arkiv vienen en inglés y con mensajes técnicos (nonce conflicts, JSON-RPC codes). `classifyArkivError` los traduce a mensajes user-friendly en español y los clasifica por categoría. Esto permite que el UI muestre "Fondos insuficientes en tu wallet" en vez de "insufficient funds for gas * price + value".

---

## Esquema de Datos en Arkiv

Cumplimiento de la rúbrica de integración Arkiv (40% del puntaje):

### Entidad 1: `fleet_profile` (Perfil de Flota)

| Campo | Tipo | Ubicación | Nota |
|-------|------|-----------|------|
| `project` | string | **attribute** | PROJECT_ATTRIBUTE — namespace obligatorio |
| `type` | string | **attribute** | `"fleet_profile"` — identificador de entidad |
| `fleetId` | string | **attribute** | ID de la flota (usado como FK) |
| `operationalStatus` | **number** | **attribute** | Estado operativo (0=Inactivo, 1=Operativo) — numérico para range queries |
| `mainRoute` | string | payload | Nombre de la ruta principal |
| `vehicleType` | string | payload | Tipo de vehículo |
| **expiresIn** | — | — | `ExpirationTime.fromDays(30)` — flotas son datos duraderos |

### Entidad 2: `routing_decision` (Decisión de Ruta / Auditoría)

| Campo | Tipo | Ubicación | Nota |
|-------|------|-----------|------|
| `project` | string | **attribute** | PROJECT_ATTRIBUTE — namespace obligatorio |
| `type` | string | **attribute** | `"routing_decision"` — identificador de entidad |
| `fleetId` | string | **attribute** | FK que relaciona con `fleet_profile` (shared attribute) |
| `riskScore` | **number** | **attribute** | Puntaje de riesgo 1-10 — numérico para `gt()` range queries |
| `createdAt` | **number** | **attribute** | Timestamp — numérico para ordenamiento `desc()` |
| `aiJustification` | string | payload | Justificación generada por la IA |
| `model` | string | payload | Versión del modelo de IA |
| **expiresIn** | — | — | `86400` (24hs) — decisiones de ruta son logística diaria |

### Relaciones entre entidades

- `fleetId` es un **shared-attribute foreign key**: ambas entidades comparten el atributo `fleetId`, permitiendo query por flota.
- Query estrella: `project` + `type: "routing_decision"` + `riskScore > 5` — demuestra range queries sobre atributos numéricos.

### Rationale de expiración (por qué estos valores)

| Entidad | expiresIn | Razón |
|---------|-----------|-------|
| `fleet_profile` | 30 días | Las flotas son estructuras relativamente estables — rutas y tipos de vehículo no cambian día a día. 30 días es suficiente para operar sin constante renovación. Si cambia el estado, `updateEntity` re-estampa la expiración. |
| `routing_decision` | 24 horas (86400s) | Las decisiones de ruta son logística diaria. Una alerta de nieve o corte de ruta pierde relevancia al día siguiente. 24hs captura la ventana operativa y mantiene la base de datos limpia automáticamente. |

### Cumplimiento de la rúbrica

| Sub-criterio | Cómo se cumple |
|---|---|
| Schemas claros | 2 entidades con atributos tipados obligatorios, separación attributes/payload |
| PROJECT_ATTRIBUTE | Constante estampada en toda creación y query — sin namespace, los datos se mezclan con otros proyectos |
| Atributos tipados | `riskScore`, `operationalStatus`, `createdAt` como **number** (range queries) |
| Relaciones | `fleetId` como shared-attribute FK |
| Expiración diferenciada | `fleet_profile`: 30 días (durable) / `routing_decision`: 24hs (logística diaria) — refleja lógica de producto real |
| `$creator` | Queries filtradas por `createdBy(trustedWallet)` para datos de confianza |
| `$owner` + `updateEntity` | El estado de flota se puede cambiar — demuestra ownership (`$owner` puede mutar) |
| Range queries | `riskScore > 5` usando `gt()` del SDK |
| Batch operations | `mutateEntities` para crear 3 flotas + 8 decisiones de una vez |
| Abstracción blockchain | El usuario no ve hashes ni firma transacciones |
| Error handling | `serializeWrite` con retry/backoff + `classifyArkivError` con mensajes user-friendly en español |
| Verificabilidad | Links al Data Explorer en cada entidad, txHash visible en el dashboard |

---

## Stack Tecnológico

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** (dark theme industrial)
- **@arkiv-network/sdk** v0.6.8 — Arkiv TypeScript SDK
- **@tanstack/react-query** — data fetching + cache
- **Arkiv Testnet (Braga)** — capa de datos

---

## Instalación y Ejecución

### Requisitos

- Node.js 22+
- npm

### Pasos

```bash
# 1. Clonar
git clone https://github.com/gabriel-alejandropereagarcia/aerotrack-sentinel.git
cd aerotrack-sentinel

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu PRIVATE_KEY y PROJECT_SLUG

# 4. Obtener fondos en la faucet
# Visitar https://braga.hoodi.arkiv.network/faucet/ con la dirección de tu wallet

# 5. Ejecutar en desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PRIVATE_KEY` | Clave privada de la wallet que crea entidades (solo server-side) | `0xabc123...` |
| `NEXT_PUBLIC_ARKIV_RPC` | RPC de la testnet de Arkiv | `https://braga.hoodi.arkiv.network/rpc` |
| `PROJECT_SLUG` | Namespace único del proyecto en Arkiv | `aerotrack-sentinel` |

---

## Uso

1. **Cargar datos de prueba**: Click en "Cargar datos de prueba" para crear 3 flotas y 8 decisiones de ruta en Arkiv.
2. **Simular IA**: Click en "Simular IA" para crear una nueva decisión de ruta con datos aleatorios.
3. **Filtrar por flota**: Click en una flota en el panel izquierdo para ver solo sus decisiones.
4. **Alto riesgo**: Por defecto se muestran solo decisiones con `riskScore > 5`.
5. **Verificar en explorador**: Cada acción genera un txHash linkeado al Block Explorer y Data Explorer.

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (dark theme, providers)
│   ├── page.tsx                      # Dashboard principal
│   ├── globals.css                   # Tailwind + shadcn dark vars
│   └── api/
│       ├── simulate-ia/route.ts      # POST: crea routing_decision aleatoria
│       ├── seed-demo/route.ts        # POST: crea datos de prueba en batch
│       └── update-fleet-status/route.ts  # POST: actualiza estado de flota
├── lib/
│   ├── arkiv.ts                      # PROJECT_ATTRIBUTE, clients, EXPIRATION
│   ├── arkiv-errors.ts               # classifyArkivError + serializeWrite con retry
│   └── utils.ts                      # shadcn cn() helper
├── services/
│   ├── arkivqueries.ts               # Lectura con publicClient + query builder
│   └── arkivmutations.ts             # Escritura con walletClient + serializeWrite
├── types/
│   └── index.ts                      # TypeScript interfaces
├── hooks/
│   └── useArkivData.ts               # TanStack Query hooks + mutations
└── components/
    ├── ui/                           # shadcn/ui components
    ├── DashboardHeader.tsx
    ├── FleetStatusPanel.tsx           # Cards de flota + cambio de estado
    ├── RiskDecisionsTable.tsx         # Tabla con riskScore badge + Data Explorer links
    ├── SimulateIaButton.tsx
    ├── EmptyState.tsx
    └── Providers.tsx
```

---

## Red y Verificación

- **Testnet:** Arkiv Braga (Chain ID: 60138453102)
- **Block Explorer:** https://explorer.braga.hoodi.arkiv.network
- **Data Explorer:** https://data.arkiv.network
- **Faucet:** https://braga.hoodi.arkiv.network/faucet/
- **Wallet de la app:** `0xA56D1dBe94DBDFFC889c3170143488675eaf0D0D`

---

## Licencia

MIT