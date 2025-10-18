import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EvaluationMethodology,
  EvaluationResult,
  EvaluationRequest,
  EvaluationHistoryItem,
  StoredEvaluation,
} from '../api/models/evaluation.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/${environment.apiVersion}/evals`;

  // Get all available evaluation methodologies
  getMethodologies(): Observable<EvaluationMethodology[]> {
    return this.http.get<EvaluationMethodology[]>(
      `${this.API_URL}/methodologies`
    );
  }

  // Get specific methodology
  getMethodology(methodologyId: string): Observable<EvaluationMethodology> {
    return this.http.get<EvaluationMethodology>(
      `${this.API_URL}/methodologies/${methodologyId}`
    );
  }

  // Start evaluation - get evaluation template with pre-filled data if available
  startEvaluation(
    nodeId: string,
    methodologyId: string
  ): Observable<EvaluationResult> {
    return this.http.get<EvaluationResult>(
      `${this.API_URL}/evaluate/${methodologyId}/${nodeId}`
    );
  }

  // Submit evaluation for processing
  submitEvaluation(
    evaluationRequest: EvaluationResult
  ): Observable<EvaluationResult> {
    return this.http.post<EvaluationResult>(
      `${this.API_URL}/evaluate/complete`,
      evaluationRequest
    );
  }

  // Submit evaluation for processing
  finishEvaluation(
    evaluationRequest: EvaluationResult
  ): Observable<StoredEvaluation> {
    return this.http.post<StoredEvaluation>(
      `${this.API_URL}/evaluate/store`,
      evaluationRequest
    );
  }
  // Get evaluation history for a node
  getEvaluationHistory(nodeId: string): Observable<StoredEvaluation[]> {
    return this.http.get<StoredEvaluation[]>(
      `${this.API_URL}/history/${nodeId}`
    );
  }

  // Get specific evaluation result
  getEvaluationResult(evaluationId: string): Observable<EvaluationResult> {
    return this.http.get<EvaluationResult>(
      `${this.API_URL}/results/${evaluationId}`
    );
  }

  // Search nodes for evaluation
  searchNodesForEvaluation(
    methodologyId: string,
    searchTerm: string
  ): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_URL}/search/${methodologyId}?q=${encodeURIComponent(
        searchTerm
      )}`
    );
  }
}
