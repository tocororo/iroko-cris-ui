import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CypherQuery,
  FullTextCypherQuery,
} from '../api/models/cypher-query.model';

@Injectable({
  providedIn: 'root',
})
export class IrokoApiService {
  private apiUrl = '/api/v1/cypher';

  constructor(private http: HttpClient) {}

  executeQuery(queryData: CypherQuery): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/query`, queryData)
      .pipe(catchError(this.handleError));
  }

  exportQueryToCsv(queryData: CypherQuery): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/query/export/csv`, queryData, {
      responseType: 'blob',
      observe: 'body',
    });
  }

  executeFullTextQuery(queryData: FullTextCypherQuery): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/fulltext`, queryData)
      .pipe(catchError(this.handleError));
  }

  exportFullTextQueryToCsv(queryData: FullTextCypherQuery): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/fulltext/export/csv`, queryData, {
      responseType: 'blob',
      observe: 'body',
    });
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code
      console.error(
        `Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`
      );
    }
    // Return an observable with a user-facing error message
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }
}
