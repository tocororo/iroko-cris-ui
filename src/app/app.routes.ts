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

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'sources',
    component: SourcesComponent,
  },
  {
    path: 'mes',
    component: MesComponent,
  },
  {
    path: 'organizations',
    component: OrganizationsComponent,
  },
  {
    path: 'persons',
    component: PersonsComponent,
  },
  {
    path: 'projects',
    component: ProjectsComponent,
  },
  {
    path: 'outputs',
    component: OutputsComponent,
  },
  {
    path: 'vocabs',
    component: VocabulariesComponent,
  },
  {
    path: 'query',
    component: QueryPageComponent,
  },
  {
    path: '**',
    component: ErrorComponent,
  },
];
