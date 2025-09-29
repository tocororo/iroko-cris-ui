// src/app/app.routes.ts
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

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { title: 'Home' },
  },
  {
    path: 'sources',
    component: SourcesComponent,
    data: { title: 'Data Sources' },
  },
  {
    path: 'mes',
    component: MesComponent,
    data: { title: 'MES Journals' },
  },
  {
    path: 'organizations',
    component: OrganizationsComponent,
    data: { title: 'Organizations' },
  },
  {
    path: 'persons',
    component: PersonsComponent,
    data: { title: 'Researchers' },
  },
  {
    path: 'projects',
    component: ProjectsComponent,
    data: { title: 'Research Projects' },
  },
  {
    path: 'outputs',
    component: OutputsComponent,
    data: { title: 'Research Outputs' },
  },
  {
    path: 'vocabs',
    component: VocabulariesComponent,
    data: { title: 'Vocabularies' },
  },
  {
    path: 'query',
    component: QueryPageComponent,
    data: { title: 'Cypher Query' },
  },
  {
    path: 'search',
    component: SearchResultsComponent,
    data: { title: 'Search Results' },
  },
  {
    path: 'view/:type/:id',
    component: NodeViewComponent,
    data: { title: 'Node Details' },
  },
  {
    path: '**',
    component: ErrorComponent,
    data: { title: 'Page Not Found' },
  },
];
