// node-evaluations.component.ts
import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { NodeEvaluationFormComponent } from '../node-evaluation-form/node-evaluation-form.component';
import { NodeEvaluationViewerComponent } from '../node-evaluation-viewer/node-evaluation-viewer.component';
import { EvaluationService } from '../../services/evaluation.service';
import {
  EvaluationMethodology,
  EvaluationResult,
  StoredEvaluation,
} from '../../api/models/evaluation.model';

@Component({
  selector: 'app-node-evaluations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NodeEvaluationViewerComponent,
  ],
  templateUrl: './node-evaluations.component.html',
  styleUrls: ['./node-evaluations.component.scss'],
})
export class NodeEvaluationsComponent implements OnInit, OnDestroy {
  private evaluationService = inject(EvaluationService);
  private snackBar = inject(MatSnackBar);

  @Input({ required: true }) nodeId!: string;
  @Input({ required: true }) nodeType!: string;
  @Input() methodologyId?: string;
  @Input({ required: true }) node: any;

  // Evaluation data
  evaluationHistory: StoredEvaluation[] = [];
  selectedEvaluationResult: EvaluationResult | null = null;
  selectedEvaluation: StoredEvaluation | null = null;

  // UI state
  isLoadingEvaluations = false;
  isLoadingHistory = false;
  isSubmitting = false;
  activeTab = 0;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadEvaluationHistory();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadEvaluationHistory() {
    this.isLoadingHistory = true;
    const sub = this.evaluationService
      .getEvaluationHistory(this.nodeId)
      .subscribe({
        next: (history) => {
          // Filter history for the selected methodology
          this.evaluationHistory = history.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          // Auto-select the first evaluation
          if (this.evaluationHistory.length > 0) {
            this.selectEvaluation(this.evaluationHistory[0]);
          }

          this.isLoadingHistory = false;
        },
        error: (error) => {
          console.error('Error loading evaluation history:', error);
          this.snackBar.open(
            'Error al cargar el historial de evaluaciones',
            'Cerrar',
            { duration: 5000 }
          );
          this.isLoadingHistory = false;
        },
      });
    this.subscriptions.push(sub);
  }

  selectEvaluation(evaluation: StoredEvaluation) {
    this.selectedEvaluation = evaluation;
    this.selectedEvaluationResult = evaluation.evaluation_data;
  }

  viewEvaluationResult(evaluation: StoredEvaluation) {
    this.selectEvaluation(evaluation);
  }

  getEvaluationIcon(entityType: string): string {
    const iconMap: { [key: string]: string } = {
      Source: 'source',
      Organization: 'corporate_fare',
      Person: 'people',
      Project: 'folder',
      Output: 'article',
    };
    return iconMap[entityType] || 'assessment';
  }

  trackByHistoryItem(index: number, item: StoredEvaluation): string {
    return item.id;
  }
}
