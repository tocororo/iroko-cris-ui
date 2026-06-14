# AGENTS.md – Sceiba / iroko-cris-ui

This document provides a high‑level guide for LLM agents working on the Sceiba frontend codebase (`iroko-cris-ui`). It explains the architecture, key patterns, and best practices to help you understand, navigate, and extend the project.

## Project Overview

**Sceiba** is a Progressive Web App (PWA) that visualises and explores a knowledge graph of Cuban scientific entities. The data is stored in a Neo4j graph database and accessed via a read‑only Cypher API (with authenticated write endpoints for editing).  
The frontend is built with **Angular 20** (standalone components) and Angular Material, and it uses **Tailwind CSS** for utility styling.

**Main features:**
- Browsing of research entities: Organisations, Persons, Publications (sources), Projects, Outputs, Vocabularies.
- Full‑text search across all entities.
- Detailed node view with tabs for properties and relationships.
- Flexible listing with pagination, sorting, and dynamic filtering.
- Evaluation system: methodologies, answer forms, and result visualisation.
- Cypher query editor for advanced users.
- Authentication & role‑based authorisation (admin, curator, etc.).
- Client‑side caching (optional) and service worker for offline support.

## Tech Stack

| Category          | Technologies                                                                 |
|-------------------|------------------------------------------------------------------------------|
| Framework         | Angular 20 (standalone components, signals, new control flow)               |
| UI Components     | Angular Material 20, Tailwind CSS 4.1, custom SCSS                          |
| State Management  | RxJS BehaviourSubjects, Angular services, signals (input/output/input)      |
| HTTP Client       | Angular `HttpClient` with interceptors (JWT, caching)                       |
| Routing           | Angular Router, route guards (AuthGuard, RoleGuard)                         |
| PWA               | Angular Service Worker (`ngsw-config.json`)                                 |
| Markdown          | `ngx-markdown` (with `marked`)                                              |
| JSON Viewer       | `ngx-json-viewer`                                                           |
| Authentication    | JWT (stored in localStorage/sessionStorage)                                 |
| Backend API       | REST endpoints under `/api/v1` – Cypher queries, evaluations, auth, edits   |
| Graph DB          | Neo4j (accessed via API)                                                    |

## Project Structure

```
iroko-cris-ui/
├── public/                    # Static assets (config, labels, images, fonts)
│   ├── config.json            # App menu & title
│   ├── labels.json            # Entity labels, filters, relationship display names
│   ├── md/                    # Markdown content (e.g. about.md)
│   └── fonts/                 # Roboto fonts
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss            # Global styles, Tailwind, Material theme
│   ├── styles_theme-iroko.scss # Material custom theme (primary #008b43)
│   ├── app/
│   │   ├── app.component.*    # Root component (toolbar, side nav, footer)
│   │   ├── app.config.ts      # Application providers (HTTP interceptors, guards, services)
│   │   ├── app.routes.ts      # Route definitions + role/permission guards
│   │   ├── api/models/        # TypeScript interfaces for API data
│   │   ├── components/        # Reusable presentational components
│   │   ├── guards/            # AuthGuard, RoleGuard
│   │   ├── interceptors/      # jwt.interceptor, caching.interceptor (optional)
│   │   ├── models/            # Shared business models (QueryFilter, SearchResult, etc.)
│   │   ├── pages/             # Route‑level components (home, node‑view, evaluations, etc.)
│   │   ├── schemas/           # JSON schemas for entities (not used directly in frontend)
│   │   └── services/          # Core business logic (API calls, caching, auth, etc.)
│   └── environments/          # environment.ts / environment.development.ts
├── angular.json
├── package.json
└── tsconfig*.json
```

## Key Concepts

### Entities
The graph contains several node types: `Organization`, `Person`, `Publication`, `Project`, `Output`, `Term`, `Subject`, `Index`, `Licence`, etc.  
The `labels.json` file defines for each node:
- `display`: human‑readable name
- `properties`: list of columns (name, label, type, sortable, filterable)
- `filters`: configurable filter definitions (text, select, multiselect, date, relationship)

### Relationships
Relationships are shown as tabs in the node viewer. `labels.json` maps relationship types to display labels under `relationshipsAsTabs` and `relationshipsAsProp`.

### Generic List Component
The `<app-generic-list>` component is the backbone of all entity browsing pages. It handles:
- Dynamic column definition
- Pagination, sorting
- Filtering (including relationship filters that match through graph edges)
- Advanced query (custom WHERE clause)
- CSV export

### Node Viewer
The `<app-node-viewer>` component displays a single node, its properties, and its relationships grouped by type. It uses lazy loading for relationship pages and supports searching within a relationship group.

### Evaluation System
Evaluations are defined by methodologies (JSON) that describe sections, categories, and questions. The evaluation flow:
1. User selects a methodology for a node.
2. The backend returns an `EvaluationResult` with pre‑filled system answers (if any).
3. The `<app-node-evaluation-form>` renders a dynamic form.
4. Answers are submitted via `EvaluationService.submitEvaluation()` for processing (computing results/recommendations).
5. Finalised evaluations are stored and can be viewed with `<app-node-evaluation-viewer>`.

### Authentication & Authorisation
- `AuthService` manages JWT token storage, login/register, and CAPTCHA.
- `jwt.interceptor` adds the `Authorization: Bearer ...` header to API requests.
- `RoleGuard` checks route data (`roles`, `permissions`, `requireAll`).
- Editable routes (`/edit/...`) and the query page (`/query`) are protected.

## Important Services

| Service                 | Responsibility                                                                                 |
|-------------------------|------------------------------------------------------------------------------------------------|
| `CypherApiService`      | Executes Cypher queries (`/cypher/query`, `/fulltext`) and exports CSV via backend.            |
| `CypherBuilderService`  | Constructs Cypher query strings and parameters for lists, node views, relationships, exports. |
| `LabelsService`         | Loads `labels.json` and provides display names, columns, and filter definitions.              |
| `ConfigService`         | Loads `config.json` (menu, title).                                                            |
| `AuthService`           | Login, register, token management, role/permission checks.                                    |
| `EvaluationService`     | All evaluation API calls: methodologies, start evaluation, submit, finish, history.          |
| `NodeEditService`       | Update node properties, create/delete relationships.                                          |
| `SearchService`         | Global search (full‑text index), advanced search.                                             |
| `ExportService`         | Client‑side CSV/JSON export (used by `GenericListComponent`).                                 |
| `CacheService`          | Optional in‑memory cache for GET requests (disabled by default in `app.config.ts`).           |
| `MetadataService`       | Updates page title and meta tags based on route data.                                         |

## Important Components

| Component                      | Purpose                                                                                   |
|--------------------------------|-------------------------------------------------------------------------------------------|
| `GenericListComponent`         | Configurable table/card list with filters, sorting, pagination, export.                  |
| `NodeViewerComponent`          | Displays a node’s properties and relationship tabs; lazy‑loads relationship pages.       |
| `NodeEditFormComponent`        | Editable form for node properties and adding new relationships.                          |
| `NodeEvaluationFormComponent`  | Renders a dynamic evaluation form with sections, categories, and questions.              |
| `NodeEvaluationViewerComponent`| Displays a completed evaluation result (PDF exportable).                                 |
| `RelationshipFilterComponent`  | Autocomplete selector for relationship‑based filters (used in `GenericListComponent`).   |
| `MarkdownViewerComponent`      | Renders markdown from a file or input string.                                            |
| `QueryExecutorComponent`       | Cypher query editor with parameter support.                                              |

## State Management

- **No global store** (e.g., NgRx). State is kept inside services using RxJS `BehaviorSubject`.
- Components communicate via `@Input()`/`@Output()` and service injection.
- Angular signals (`input()`, `output()`) are used for reactive data flow in many components.

## Styling Guidelines

- **Global styles** in `src/styles.scss` include Material theme setup, Tailwind directives, and custom utility classes.
- **Component styles** are written in SCSS, often using Angular Material’s theming system.
- **Tailwind** is applied via the `@tailwindcss/postcss` plugin (see `.postcssrc.json`). Use utility classes for layout and spacing; reserve SCSS for component‑specific overrides.
- **Responsive design**: Use `@media` queries inside component SCSS; many components also have `isMobile()` signal to adjust layout.
- **Icons**: Prefer Material Icons (`<mat-icon>`); custom SVG icons are registered in `AppComponent` and used via `IconHelperComponent`.

## API Integration

All API calls go through the `environment.apiUrl` (e.g., `https://sceiba.mes.gob.cu/api/v1`).  
Main endpoints:

- **Cypher query**: `POST /v1/cypher/query` – expects `{ query, parameters, readonly }`.
- **Full‑text search**: `POST /v1/cypher/fulltext`.
- **CSV export**: `POST /v1/cypher/query/export/csv` (returns blob).
- **Authentication**: `/v1/auth/token`, `/v1/auth/register`, `/v1/auth/captcha*`.
- **Evaluations**: `/v1/evals/methodologies`, `/v1/evals/evaluate/...`, `/v1/evals/history/...`.
- **Node edit**: `/v1/cypher/edit/node/properties`, `/v1/cypher/edit/relationships`.

> **Important**: The backend expects **read‑only** queries unless the user has write permissions. All queries sent from `GenericListComponent` and `NodeViewerComponent` set `readonly: true`.

## Authentication & Authorisation Best Practices

- **Login/Register**: Use `AuthService.login()` (sends form data) and `AuthService.register()`.
- **CAPTCHA**: Currently disabled in the registration form (commented out) – re‑enable if needed.
- **Route protection**: Use `canActivate: [AuthGuard, RoleGuard]` and specify `data: { roles, permissions }`.
- **Feature visibility** in templates: Use `authService.hasPermission('...')` or `authService.canEditNode()`.
- **Token expiration**: Handled by `jwt.interceptor`; a 401 triggers logout.

## Caching (Optional)

The `caching.interceptor` and `CacheService` are available but **disabled** in `app.config.ts` (commented out). If you enable them:
- Only GET requests are cached.
- Cache TTL is configurable per URL pattern.
- Service worker already handles offline caching of static assets and API responses (see `ngsw-config.json`).

## Export Functionality

- **CSV export** is implemented in `ExportService` and used by `GenericListComponent`.
- For large exports, the backend endpoint `/cypher/query/export/csv` is used (returns blob).
- Relationship exports are built via `CypherBuilderService.buildRelationshipExportQuery()`.

## How to Add a New Entity Type

1. **Extend `labels.json`** – add a new entry under `"nodes"`:
   ```json
   "newtype": {
     "label": "NewType",
     "display": "New Type",
     "properties": [...],
     "filters": [...]
   }
   ```
2. **Create a page component** in `src/app/pages/newtype/` (copy from an existing page like `organizations`).
   - Use `<app-generic-list entityType="NewType" [columns]="..." ...>`.
3. **Add route** in `app.routes.ts` (e.g., `/newtypes`).
4. **Add menu item** in `public/config.json` under `menu`.
5. **Ensure the backend** has nodes with label `NewType` and property names match those in `labels.json`.

## How to Add a New Filter Type

Filters are defined in `labels.json` per entity. Supported types: `text`, `select`, `multiselect`, `date`, `boolean`, `relationship`.

To add a new filter type:
1. Extend the `ListFilter` interface in `models/list.model.ts`.
2. Update `GenericListComponent` template to render the new type.
3. Update `CypherBuilderService.buildWhereClause()` and `buildRelationshipFilters()` to translate the filter into Cypher.

## How to Add a New Evaluation Methodology

Methodologies are served by the backend (under `/v1/evals/methodologies`). The frontend automatically displays them in `/evaluations` and allows selecting them for any node whose type matches `methodology.entity`.

No frontend changes are required; just ensure the backend returns a valid methodology JSON conforming to the `EvaluationMethodology` interface.

## Development Best Practices

1. **Use standalone components** – all new components should be standalone.
2. **Signal inputs/outputs** – prefer `input()` and `output()` over `@Input()`/`@Output()` for new components.
3. **OnPush change detection** – set `changeDetection: ChangeDetectionStrategy.OnPush` when appropriate.
4. **Lazy‑load routes** – most pages are already eagerly loaded; consider splitting if needed.
5. **Use generic list** – always reuse `GenericListComponent` for listing pages instead of building custom tables.
6. **Error handling** – rely on `ErrorHandlerService` which shows snack bars; also catch errors in component subscriptions.
7. **Type safety** – use the interfaces in `api/models/` and `models/`; avoid `any`.
8. **CSS** – prefer Tailwind utility classes; use SCSS for component‑specific styles that cannot be expressed with utilities.
9. **Accessibility** – Angular Material components are ARIA‑friendly; add `aria-label` where missing.
10. **Testing** – `.spec.ts` files are present but minimal; add tests for new services and critical components.

## Common Pitfalls & Troubleshooting

- **Cypher injection** – always use parameters (`$param`) in query strings; never concatenate user input.
- **Relationship filter performance** – relationship filters in `GenericListComponent` add `MATCH` clauses that can be heavy; ensure the graph has indexes on `iroko_uuid` and relationship types.
- **Service Worker cache** – during development, disable service worker (set `enabled: false` in `app.config.ts`) to avoid stale assets.
- **Node edit permissions** – editing buttons are only shown if `authService.canEditNode()` returns `true` (user has role `curator` or `admin`). Edit routes are also guarded.

## Further Information

- **API Documentation**: See `public/openapi.json` (OpenAPI 3.1 spec) for backend endpoints.
- **Changelog**: `public/map.json` contains mapping information for data ingestion (not directly used by frontend).
- **Configuration**: `proxy.conf.json` is used for local development to proxy `/api` requests to `https://localhost:8000`.

This document should serve as a living reference. Update it whenever significant architectural changes are introduced.
