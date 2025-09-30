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
import { AboutComponent } from './pages/about/about.component'; // Add this import

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
    path: 'projects',
    component: ProjectsComponent,
    data: { title: 'Proyectos de Investigación' },
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
    data: { title: 'Consulta Cypher' },
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
    path: 'about', // Add this route
    component: AboutComponent,
    data: { title: 'Acerca de' },
  },
  {
    path: '**',
    component: ErrorComponent,
    data: { title: 'Página No Encontrada' },
  },
];
