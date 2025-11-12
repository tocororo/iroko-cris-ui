// src/app/pages/search-results/search-results.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SearchService, SearchResult } from '../../services/search.service';
import { MetadataService } from '../../services/metadata.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);
  private metadataService = inject(MetadataService);

  searchTerm = '';
  results: SearchResult[] = [];
  isLoading = false;
  hasSearched = false;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.searchTerm = params['q'] || '';
      if (this.searchTerm) {
        this.performSearch();
      }
    });
  }

  performSearch() {
    if (!this.searchTerm.trim()) return;

    this.isLoading = true;
    this.hasSearched = true;

    this.metadataService.updateMetadata({
      title: `Buscar: ${this.searchTerm}`,
      description: `Buscar results for "${this.searchTerm}" in the knowledge graph`,
    });

    this.searchService.globalSearch(this.searchTerm).subscribe({
      next: (data) => {
        this.results = data.map((item: any) => ({
          iroko_uuid: item.node.properties.iroko_uuid || item.node.identity,
          type: item.type,
          label:
            item.node.properties.name ||
            item.node.properties.title ||
            'Unnamed',
          description: item.node.properties.description,
          properties: item.node.properties,
          score: item.score,
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Buscar error:', error);
        this.isLoading = false;
      },
    });
  }

  getResultCountByType(type: string): number {
    return this.results.filter((result) => result.type === type).length;
  }

  getUniqueTypes(): string[] {
    return [...new Set(this.results.map((result) => result.type))];
  }

  navigateToResult(result: SearchResult) {
    this.router.navigate([`/${result.type.toLowerCase()}s`, result.iroko_uuid]);
  }
}
