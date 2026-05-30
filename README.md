# AeroTrack Sentinel

> Dashboard de auditoría logística que registra inmutablemente las decisiones de rutas generadas por IA, usando [Arkiv](https://arkiv.network) como capa de datos.

Proyecto para el **Hackathon ARKIV x PunaTech 2026**.

---

## Esquema de Datos en Arkiv

Cumplimiento de la rúbrica de integración Arkiv (40% del puntaje):

### Entidad 1: `fleet_profile` (Perfil de Flota)

| Campo | Tipo | Ubicación | Nota |
|-------|------|-----------|------|
| `project` | string | **attribute** | PROJECT_ATTRIBUTE — namespace obligatorio |
| `type` | string | **attribute** | `"fleet_profile"` — identificador de entidad |
| `fleetId` | string | **attribute** | ID de la flota (usado como FK) |
| `operationalStatus` | **number** | **attribute** | Estado operativo (0=Inactivo, 1=Operativo, etc.) — numérico para range queries |
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

### Rationale de expiración (¿por qué estos valores?)

| Entidad | expiresIn | Razón |
|---------|-----------|-------|
| `fleet_profile` | 30 días | Las flotas son estructuras relativamente estables — rutas y tipos de vehículo no cambian día a día. 30 días es suficiente para operar sin constante renovación, y si cambia el estado, `updateEntity` re-estampa la expiración. |
| `routing_decision` | 24 horas (86400s) | Las decisiones de ruta son logística diaria. Una alerta de nieve o corte de ruta pierde relevancia al día siguiente. 24hs captura la ventana operativa y mantiene la base de datos limpia automáticamente. |

### Cumplimiento de la rúbrica

| Sub-criterio | Cómo se cumple |
|---|---|
| Schemas claros | 2 entidades con atributos tipados obligatorios, separación attributes/payload |
| PROJECT_ATTRIBUTE | Constante `PROJECT_ATTRIBUTE` estampada en toda creación y query — sin namespace, los datos se mezclan con otros proyectos |
| Atributos tipados | `riskScore`, `operationalStatus`, `createdAt` como **number** (range queries) |
| Relaciones | `fleetId` como shared-attribute FK |
| Expiración diferenciada | `fleet_profile`: 30 días (durable) / `routing_decision`: 24hs (logística diaria) — refleja lógica de producto real |
| `$creator` | Queries filtradas por `createdBy(trustedWallet)` para datos de confianza |
| `$owner` + `updateEntity` | El estado de flota se puede cambiar — demuestra ownership (`$owner` puede mutar) |
| Range queries | `riskScore > 5` usando `gt()` del SDK |
| Batch operations | `mutateEntities` para crear 3 flotas + 8 decisiones de una vez |
| Abstracción blockchain | El usuario no ve hashes ni firma transacciones |
| Error handling | `serializeWrite` con retry/backoff (patrón de proyectos ganadores) + `classifyArkivError` con mensajes user-friendly en español |
| Verificabilidad | Links al Data Explorer en cada entidad |

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
│   ├── arkiv-errors.ts              # classifyArkivError + serializeWrite con retry
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

## Licencia

MIT