import { Routes } from '@angular/router';
import { QueryPageComponent } from './pages/query-page/query-page.component';
import { ErrorComponent } from './pages/error/error.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  {
    path: "query",
    component: QueryPageComponent
  },
  {
    path: '',
    component: HomeComponent
  },
  {
    path: "**",
    component: ErrorComponent
  }
];
