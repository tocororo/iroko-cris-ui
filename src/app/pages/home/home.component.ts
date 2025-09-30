import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { IrokoApiService } from '../../api/services/iroko-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  stats = [
    {
      label: 'Organizations',
      count: 0,
      icon: 'corporate_fare',
      route: '/organizations',
      color: 'primary',
      type: 'Organization',
    },
    {
      label: 'Researchers',
      count: 0,
      icon: 'people',
      route: '/persons',
      color: 'accent',
      type: 'Person',
    },
    {
      label: 'Research Outputs',
      count: 0,
      icon: 'article',
      route: '/outputs',
      color: 'warn',
      type: 'Output',
    },
    {
      label: 'Projects',
      count: 0,
      icon: 'folder',
      route: '/projects',
      color: 'primary',
      type: 'Project',
    },
    {
      label: 'Data Sources',
      count: 0,
      icon: 'source',
      route: '/sources',
      color: 'accent',
      type: 'Source',
    },
    {
      label: 'Vocabularies',
      count: 0,
      icon: 'tag',
      route: '/vocabularies',
      color: 'warn',
      type: 'Term',
    },
  ];

  quickActions = [
    {
      label: 'Advanced Search',
      description: 'Search across all entities',
      icon: 'search',
      route: '/search',
    },
    {
      label: 'Cypher Query',
      description: 'Run custom graph queries',
      icon: 'code',
      route: '/query',
    },
    {
      label: 'Browse Catalog',
      description: 'Explore by categories',
      icon: 'explore',
      route: '/sources',
    },
  ];

  isLoading = true;

  constructor(
    private metadataService: MetadataService,
    private irokoApiService: IrokoApiService
  ) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Iroko Knowledge Graph Explorer',
      description:
        'Explore research data, organizations, and publications in the Cuban research ecosystem',
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
      this.irokoApiService.executeQuery({
        query: `MATCH (n:${stat.type}) RETURN count(n) AS count`,
        parameters: {},
        readonly: true,
      })
    );

    // Execute all queries in parallel
    Promise.all(queries.map((q) => q.toPromise()))
      .then((results) => {
        results.forEach((result, index) => {
          if (result && result.length > 0) {
            this.stats[index].count = result[0].count || 0;
          }
        });
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error loading statistics:', error);
        this.isLoading = false;
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
