// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs';
import { IrokoApiService } from '../api/services/iroko-api.service';

export interface SearchResult {
  id: string;
  type: string;
  label: string;
  description?: string;
  properties: any;
  score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets?: any;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private searchTerm = new BehaviorSubject<string>('');
  private searchResults = new BehaviorSubject<SearchResponse>({
    results: [],
    total: 0,
  });
  private isLoading = new BehaviorSubject<boolean>(false);

  searchTerm$ = this.searchTerm.asObservable();
  searchResults$ = this.searchResults.asObservable();
  isLoading$ = this.isLoading.asObservable();

  constructor(
    private irokoApiService: IrokoApiService,
    private http: HttpClient
  ) {}

  // Global search across all entity types
  globalSearch(term: string, limit: number = 50): Observable<any> {
    this.isLoading.next(true);

    const query = `
      CALL db.index.fulltext.queryNodes("fullTextSearch", $term)
      YIELD node, score
      WITH node, score, labels(node) as nodeLabels
      RETURN node, score, nodeLabels[0] as type
      ORDER BY score DESC
      LIMIT $limit
    `;

    return this.irokoApiService.executeQuery({
      query,
      parameters: { term: `${term}*`, limit },
      readonly: true,
    });
  }

  // Entity-specific search
  searchByType(
    entityType: string,
    term: string,
    properties: string[] = ['name', 'title', 'description']
  ): Observable<any> {
    const conditions = properties
      .map((prop) => `toLower(n.${prop}) CONTAINS toLower($term)`)
      .join(' OR ');

    const query = `
      MATCH (n:${entityType})
      WHERE ${conditions}
      RETURN n, labels(n) as type
      ORDER BY n.name
      LIMIT 50
    `;

    return this.irokoApiService.executeQuery({
      query,
      parameters: { term },
      readonly: true,
    });
  }

  // Advanced search with filters
  advancedSearch(filters: {
    types?: string[];
    properties?: { [key: string]: any };
    relationships?: { type: string; targetType?: string }[];
  }): Observable<any> {
    let query = 'MATCH (n)';
    const params: any = {};
    const conditions: string[] = [];

    // Type filters
    if (filters.types && filters.types.length > 0) {
      const typeConditions = filters.types.map((type, index) => {
        params[`type${index}`] = type;
        return `n:$${`type${index}`}`;
      });
      conditions.push(`(${typeConditions.join(' OR ')})`);
    }

    // Property filters
    if (filters.properties) {
      Object.entries(filters.properties).forEach(([key, value], index) => {
        if (value) {
          params[`prop${index}`] = value;
          conditions.push(
            `toLower(n.${key}) CONTAINS toLower($${`prop${index}`})`
          );
        }
      });
    }

    // Relationship filters
    if (filters.relationships) {
      filters.relationships.forEach((rel, index) => {
        query += `\nMATCH (n)-[:${rel.type}]->(related${index})`;
        if (rel.targetType) {
          conditions.push(`related${index}:${rel.targetType}`);
        }
      });
    }

    if (conditions.length > 0) {
      query += `\nWHERE ${conditions.join(' AND ')}`;
    }

    query += '\nRETURN DISTINCT n, labels(n) as type';

    return this.irokoApiService.executeQuery({
      query,
      parameters: params,
      readonly: true,
    });
  }

  setSearchTerm(term: string) {
    this.searchTerm.next(term);
  }

  updateSearchResults(results: SearchResponse) {
    this.searchResults.next(results);
  }
}
