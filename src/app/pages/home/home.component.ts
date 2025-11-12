import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { CypherApiService } from '../../services/cypher-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IconHelperComponent } from '../../app.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    IconHelperComponent
],
})
export class HomeComponent implements OnInit, OnDestroy {
  private metadataService = inject(MetadataService);
  private irokoApiService = inject(CypherApiService);

  stats = [
    {
      label: 'Revistas del MES',
      count: 0,
      icon: 'revistasmes',
      route: '/mes',
      color: 'primary',
      type: 'Publication',
    },
    {
      label: 'Organizaciones',
      count: 0,
      icon: 'corporate_fare',
      route: '/organizations',
      color: 'primary',
      type: 'Organization',
    },
    {
      label: 'Personas',
      count: 0,
      icon: 'people',
      route: '/persons',
      color: 'accent',
      type: 'Person',
    },
    {
      label: 'Resultados de Investigación',
      count: 0,
      icon: 'article',
      route: '/outputs',
      color: 'warn',
      type: 'Output',
    },
    {
      label: 'Publicaciones',
      count: 0,
      icon: 'publication',
      route: '/publications',
      color: 'accent',
      type: 'Publication',
    },
    {
      label: 'Términos de Vocabularios',
      count: 0,
      icon: 'tag',
      route: '/vocabularies',
      color: 'warn',
      type: 'Term',
    },
  ];

  quickActions = [
    {
      label: 'Búsqueda Avanzada',
      description: 'Buscar across all entities',
      icon: 'search',
      route: '/search',
    },
    {
      label: 'Consulta Cypher',
      description: 'Run custom graph queries',
      icon: 'code',
      route: '/query',
    },
    {
      label: 'Browse Catalog',
      description: 'Explore by categories',
      icon: 'explore',
      route: '/publications',
    },
  ];

  isLoading = true;

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Sceiba - Publicaciones Científicas Cubanas',
      description:
        ' Descubra publicaciones, organizaciones, investigadores y resultados de investigación cubanos',
      authors: [],
      subjects: [],
    });

    this.loadStatistics();
  }

  ngOnDestroy() {
    this.metadataService.resetMetadata();
  }

  private loadStatistics() {
    const queries = this.stats.map((stat) =>
      stat.route === '/mes'
        ? this.irokoApiService.executeQuery({
            query: `MATCH (n:Publication) WHERE (EXISTS((n)-[:SOURCE_CREATED_IN]->(:Organization {iroko_uuid: '11514c12-3d6a-43d0-ba3b-3b992aa96295'}))) RETURN count(n) AS count`,
            parameters: {},
            readonly: true,
          })
        : this.irokoApiService.executeQuery({
            query: `MATCH (n:${stat.type}) RETURN count(n) AS count`,
            parameters: {},
            readonly: true,
          })
    );

    // Using RxJS forkJoin instead of Promise.all
    forkJoin(queries).subscribe({
      next: (results) => {
        results.forEach((result, index) => {
          if (result && result.length > 0) {
            this.stats[index].count = result[0].count || 0;
          }
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoading = false;
      },
    });
  }

  formatCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }
}
