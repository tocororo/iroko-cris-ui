import { Component, ViewChild, inject } from '@angular/core';
import { CypherApiService } from '../../services/cypher-api.service';
import { CypherQuery } from '../../api/models/cypher-query.model';
import { QueryExecutorComponent } from '../../components/query-executor/query-executor.component';
import { ResultsDisplayComponent } from '../../components/results-display/results-display.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MetadataService } from '../../services/metadata.service';

import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service'; // Add this import

@Component({
  selector: 'app-query-page',
  templateUrl: './query-page.component.html',
  styleUrls: ['./query-page.component.scss'],
  imports: [
    QueryExecutorComponent,
    ResultsDisplayComponent,
    MatProgressBarModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule
],
})
export class QueryPageComponent {
  private apiService = inject(CypherApiService);
  private metadataService = inject(MetadataService);
  private authService = inject(AuthService);

  @ViewChild(QueryExecutorComponent) queryExecutor!: QueryExecutorComponent;

  queryResult: any;
  error: any;
  isLoading = false;
  hasResults = false;
  queryTime?: number;
  resultCount?: number;
  hasQueryAccess = false; // Add this

  // Quick examples data
  quickExamples = [
    {
      id: 'organizations',
      title: 'Lista Organizaciones',
      description: 'MATCH (n:Organization) RETURN n LIMIT 10',
      icon: 'corporate_fare',
    },
    {
      id: 'researchers',
      title: 'Find Investigadores',
      description: 'MATCH (n:Person) RETURN n LIMIT 10',
      icon: 'people',
    },
    {
      id: 'publications',
      title: 'Recent Publications',
      description:
        'MATCH (n:Output) RETURN n ORDER BY n.publication_date DESC LIMIT 10',
      icon: 'article',
    },
    {
      id: 'relationships',
      title: 'Organization Relationships',
      description:
        'MATCH (o:Organization)-[r]-(related) RETURN o, r, related LIMIT 15',
      icon: 'account_tree',
    },
  ];

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Consulta Cypher',
      description: 'iroko-cris - Consulta Cypher',
      authors: [],
      subjects: [],
    });
    // Check if user has access to query page
    this.hasQueryAccess = true; // this.authService.canAccessQueryPage();

    if (!this.hasQueryAccess) {
      this.error = {
        message:
          'You do not have permission to access the query page. Please contact your administrator.',
      };
    }
  }

  ngOnDestroy() {
    this.metadataService.resetMetadata();
  }

  onQueryExecuted(queryData: CypherQuery) {
    this.isLoading = true;
    this.queryResult = null;
    this.error = null;
    this.hasResults = false;
    this.queryTime = undefined;
    this.resultCount = undefined;

    const startTime = performance.now();

    this.apiService.executeQuery(queryData).subscribe({
      next: (result) => {
        const endTime = performance.now();
        this.queryTime = endTime - startTime;
        this.queryResult = result;
        this.resultCount = this.calculateResultCount(result);
        this.hasResults = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err;
        this.isLoading = false;
        this.hasResults = false;
      },
    });
  }

  private calculateResultCount(result: any): number {
    if (!result) return 0;
    if (Array.isArray(result)) return result.length;
    if (typeof result === 'object') return Object.keys(result).length;
    return 1;
  }

  clearResults() {
    this.queryResult = null;
    this.error = null;
    this.hasResults = false;
    this.queryTime = undefined;
    this.resultCount = undefined;
  }

  // Method to load examples
  loadExample(exampleId: string) {
    if (this.queryExecutor) {
      this.queryExecutor.loadExample(exampleId);
    }
  }
}
