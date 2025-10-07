import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { NodeEvaluationFormComponent } from '../../components/node-evaluation-form/node-evaluation-form.component';
import { NodeEvaluationViewerComponent } from '../../components/node-evaluation-viewer/node-evaluation-viewer.component';
import { EvaluationService } from '../../services/evaluation.service';
import {
  EvaluationMethodology,
  EvaluationResult,
  EvaluationHistoryItem,
} from '../../api/models/evaluation.model';
import { MetadataService } from '../../services/metadata.service';

@Component({
  selector: 'app-node-evaluation-page',
  templateUrl: './node-evaluation-page.component.html',
  styleUrls: ['./node-evaluation-page.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NodeEvaluationFormComponent,
    NodeEvaluationViewerComponent,
  ],
})
export class NodeEvaluationPageComponent implements OnInit, OnDestroy {
  nodeId: string = '';
  methodologyId: string = '';
  currentEvaluation: EvaluationMethodology | null = null;
  evaluationHistory: EvaluationHistoryItem[] = [];
  selectedEvaluationResult: EvaluationResult | null = null;

  isLoading = false;
  isSubmitting = false;
  activeTab = 0;

  private routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluationService: EvaluationService,
    private metadataService: MetadataService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.routeSub = this.route.params.subscribe((params) => {
      this.nodeId = params['node_id'];
      this.methodologyId = params['eval_id'];

      if (this.nodeId && this.methodologyId) {
        this.loadEvaluationData();
        this.loadEvaluationHistory();

        this.metadataService.updateMetadata({
          title: `Evaluación - Nodo ${this.nodeId}`,
          description: `Realizar evaluación del nodo usando metodología ${this.methodologyId}`,
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadEvaluationData() {
    this.isLoading = true;
    this.evaluationService
      .startEvaluation(this.nodeId, this.methodologyId)
      .subscribe({
        next: (evaluation) => {
          this.currentEvaluation = evaluation;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading evaluation:', error);
          this.snackBar.open('Error al cargar la evaluación', 'Cerrar', {
            duration: 5000,
          });
          this.isLoading = false;
        },
      });
  }

  loadEvaluationHistory() {
    this.evaluationService.getEvaluationHistory(this.nodeId).subscribe({
      next: (history) => {
        this.evaluationHistory = history
          .filter((item) => item.methodology_id === this.methodologyId)
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
      },
      error: (error) => {
        console.error('Error loading evaluation history:', error);
      },
    });
  }

  onEvaluationSubmit(evaluation: EvaluationMethodology) {
    this.isSubmitting = true;

    this.evaluationService
      .submitEvaluation({
        node_id: this.nodeId,
        methodology_id: this.methodologyId,
        evaluation: evaluation,
      })
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          this.snackBar.open('Evaluación enviada exitosamente', 'Cerrar', {
            duration: 5000,
          });

          // Update current evaluation with results
          this.currentEvaluation = result.evaluation;

          // Reload history to include the new evaluation
          this.loadEvaluationHistory();

          // Switch to history tab to see the result
          this.activeTab = 1;
        },
        error: (error) => {
          console.error('Error submitting evaluation:', error);
          this.snackBar.open('Error al enviar la evaluación', 'Cerrar', {
            duration: 5000,
          });
          this.isSubmitting = false;
        },
      });
  }

  viewEvaluationResult(evaluationId: string) {
    this.evaluationService.getEvaluationResult(evaluationId).subscribe({
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
  }

  startNewEvaluation() {
    this.selectedEvaluationResult = null;
    this.loadEvaluationData();
    this.activeTab = 0;
  }

  getMethodologyName(): string {
    return this.currentEvaluation?.name || this.methodologyId;
  }
}
