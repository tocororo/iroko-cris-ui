import { Routes } from '@angular/router';
import { QueryPageComponent } from './pages/query-page/query-page.component';
import { ErrorComponent } from './pages/error/error.component';
import { HomeComponent } from './pages/home/home.component';
import { SourcesComponent } from './pages/sources/sources.component';
import { MesComponent } from './pages/mes/mes.component';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { PersonsComponent } from './pages/persons/persons.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { OutputsComponent } from './pages/outputs/outputs.component';
import { VocabulariesComponent } from './pages/vocabularies/vocabularies.component';
import { SearchResultsComponent } from './pages/search-results/search-results.component';
import { NodeViewComponent } from './pages/node-view/node-view.component';
import { AboutComponent } from './pages/about/about.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { EvaluationsComponent } from './pages/evaluations/evaluations.component';
import { EvaluationComponent } from './pages/evaluation/evaluation.component';
import { NodeEvaluationPageComponent } from './pages/node-evaluation-page/node-evaluation-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Inicio' },
  },
  {
    path: 'sources',
    component: SourcesComponent,
    data: { title: 'Fuentes de Datos' },
  },
  {
    path: 'mes',
    component: MesComponent,
    data: { title: 'MES Journals' },
  },
  {
    path: 'organizations',
    component: OrganizationsComponent,
    data: { title: 'Organizaciones' },
  },
  {
    path: 'persons',
    component: PersonsComponent,
    data: { title: 'Investigadores' },
  },
  {
    path: 'outputs',
    component: OutputsComponent,
    data: { title: 'Resultados de Investigación' },
  },
  {
    path: 'vocabularies',
    component: VocabulariesComponent,
    data: { title: 'Vocabularios' },
  },
  {
    path: 'query',
    component: QueryPageComponent,
    data: {
      title: 'Consulta Cypher',
      roles: ['admin', 'researcher', 'viewer'], // Only these roles can access
      permissions: ['query:execute'], // And must have this permission
    },
    canActivate: [AuthGuard, RoleGuard],
  },
  {
    path: 'search',
    component: SearchResultsComponent,
    data: { title: 'Resultados de Búsqueda' },
  },
  {
    path: 'view/:type/:id',
    component: NodeViewComponent,
    data: { title: 'Detalles del Nodo' },
  },
  {
    path: 'about',
    component: AboutComponent,
    data: { title: 'Acerca de' },
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login' },
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: { title: 'Register' },
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent,
    data: { title: 'Access Denied' },
  },
  // Evaluation Routes
  {
    path: 'evaluations',
    component: EvaluationsComponent,
    data: { title: 'Metodologías de Evaluación' },
  },
  {
    path: 'evaluations/:eval_id',
    component: EvaluationComponent,
    data: { title: 'Evaluación' },
  },
  {
    path: 'evaluate/:node_id/:eval_id',
    component: NodeEvaluationPageComponent,
    data: { title: 'Evaluación' },
  },
  {
    path: '**',
    component: ErrorComponent,
    data: { title: 'Página No Encontrada' },
  },
];
