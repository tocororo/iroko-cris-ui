import { Component } from '@angular/core';
import { IrokoApiService } from '../../api/services/iroko-api.service';
import { CypherQuery } from '../../api/models/cypher-query.model';
import { QueryExecutorComponent } from "../../components/query-executor/query-executor.component";
import { ResultsDisplayComponent } from "../../components/results-display/results-display.component";
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-query-page',
  templateUrl: './query-page.component.html',
  styleUrls: ['./query-page.component.scss'],
  imports: [
    QueryExecutorComponent,
    ResultsDisplayComponent,
    MatProgressBarModule,
    CommonModule,
  ],
})
export class QueryPageComponent {
  queryResult: any;
  error: any;
  isLoading = false;

  constructor(private apiService: IrokoApiService) {}

  onQueryExecuted(queryData: CypherQuery) {
    this.isLoading = true;
    this.queryResult = null;
    this.error = null;

    this.apiService.executeQuery(queryData).subscribe({
      next: (result) => {
        this.queryResult = result;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err;
        this.isLoading = false;
      },
    });
  }
}
