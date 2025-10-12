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
  EvaluationHistoryItem,
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

  // Evaluation data
  availableEvaluations: EvaluationMethodology[] = [];
  selectedEvaluation: EvaluationMethodology | null = null;
  evaluationHistory: EvaluationHistoryItem[] = [];
  selectedEvaluationResult: EvaluationResult | null = null;

  // UI state
  isLoadingEvaluations = false;
  isLoadingHistory = false;
  isSubmitting = false;
  activeTab = 0;

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.loadAvailableEvaluations();

    // If a specific methodology is provided, load it
    if (this.methodologyId) {
      this.loadEvaluationMethodology(this.methodologyId);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  loadAvailableEvaluations() {
    this.isLoadingEvaluations = true;
    const sub = this.evaluationService.getMethodologies().subscribe({
      next: (methodologies) => {
        // Filter methodologies that match the current node type
        this.availableEvaluations = methodologies.filter(
          (methodology) => methodology.entity === this.nodeType
        );
        this.isLoadingEvaluations = false;

        // Auto-select first evaluation if none selected and methodologyId not provided
        if (
          this.availableEvaluations.length > 0 &&
          !this.selectedEvaluation &&
          !this.methodologyId
        ) {
          this.selectEvaluation(this.availableEvaluations[0]);
        }
      },
      error: (error) => {
        console.error('Error loading evaluations:', error);
        this.snackBar.open(
          'Error al cargar las evaluaciones disponibles',
          'Cerrar',
          { duration: 5000 }
        );
        this.isLoadingEvaluations = false;
      },
    });
    this.subscriptions.push(sub);
  }

  loadEvaluationMethodology(methodologyId: string) {
    this.isLoadingEvaluations = true;
    const sub = this.evaluationService.getMethodology(methodologyId).subscribe({
      next: (methodology) => {
        this.selectedEvaluation = methodology;
        this.isLoadingEvaluations = false;

        // Load evaluation history for this methodology
        this.loadEvaluationHistory();
      },
      error: (error) => {
        console.error('Error loading evaluation methodology:', error);
        this.snackBar.open(
          'Error al cargar la metodología de evaluación',
          'Cerrar',
          { duration: 5000 }
        );
        this.isLoadingEvaluations = false;
      },
    });
    this.subscriptions.push(sub);
  }

  selectEvaluation(methodology: EvaluationMethodology) {
    this.selectedEvaluation = methodology;
    this.loadEvaluationHistory();
    this.activeTab = 0; // Switch to new evaluation tab
  }

  loadEvaluationHistory() {
    if (!this.selectedEvaluation) return;

    this.isLoadingHistory = true;
    const sub = this.evaluationService
      .getEvaluationHistory(this.nodeId)
      .subscribe({
        next: (history) => {
          // Filter history for the selected methodology
          this.evaluationHistory = history
            .filter(
              (item) => item.methodology_id === this.selectedEvaluation!.id
            )
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            );
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

  viewEvaluationResult(evaluationId: string) {
    const sub = this.evaluationService
      .getEvaluationResult(evaluationId)
      .subscribe({
        next: (result) => {
          this.selectedEvaluationResult = result;
        },
        error: (error) => {
          console.error('Error loading evaluation result:', error);
          this.snackBar.open(
            'Error al cargar el resultado de evaluación',
            'Cerrar',
            { duration: 5000 }
          );
        },
      });
    this.subscriptions.push(sub);
  }

  startNewEvaluation() {
    this.selectedEvaluationResult = null;
    if (this.selectedEvaluation) {
      this.loadEvaluationMethodology(this.selectedEvaluation.id);
    }
    this.activeTab = 0;
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

  trackByHistoryItem(index: number, item: EvaluationHistoryItem): string {
    return item.id;
  }
}
