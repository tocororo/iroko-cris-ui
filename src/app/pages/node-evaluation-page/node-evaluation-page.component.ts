import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { NodeEvaluationFormComponent } from '../../components/node-evaluation-form/node-evaluation-form.component';
import { EvaluationService } from '../../services/evaluation.service';
import {
  EvaluationMethodology,
  EvaluationResult,
  StoredEvaluation,
} from '../../api/models/evaluation.model';
import { MetadataService } from '../../services/metadata.service';
import { AuthService } from '../../services/auth.service'; // Importar AuthService
import { NodeEvaluationViewerComponent } from '../../components/node-evaluation-viewer/node-evaluation-viewer.component';

@Component({
  selector: 'app-node-evaluation-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NodeEvaluationFormComponent,
    NodeEvaluationViewerComponent,
  ],
  templateUrl: './node-evaluation-page.component.html',
  styleUrls: ['./node-evaluation-page.component.scss'],
})
export class NodeEvaluationPageComponent implements OnInit, OnDestroy {
  private evaluationService = inject(EvaluationService);
  private metadataService = inject(MetadataService);
  private authService = inject(AuthService); // Inyectar AuthService
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  nodeId: string = '';
  methodologyId: string = '';
  nodeData: any = null;
  nodeType: string = '';

  currentEvaluation: EvaluationResult | null = null;
  finishedEvaluation: StoredEvaluation | null = null;
  isSubmitting = false;
  isLoading = false;
  isAuthenticated = false;
  isFinalizing = false;

  private routeSub!: Subscription;

  ngOnInit() {
    // Verificar autenticación primero
    this.checkAuthentication();

    // Get node data from navigation state
    const dialogData = history.state?.dialogData || null;
    this.nodeData = dialogData.nodeData;
    this.nodeType = dialogData.nodeType;

    this.routeSub = this.route.params.subscribe((params) => {
      this.nodeId = params['node_id'];
      this.methodologyId = params['eval_id'];

      if (this.nodeId && this.methodologyId && this.isAuthenticated) {
        this.loadEvaluationData();

        this.metadataService.updateMetadata({
          title: `Evaluación - ${this.getNodeDisplayName()}`,
          description: `Realizar evaluación de ${this.getNodeDisplayName()} usando metodología ${
            this.methodologyId
          }`,
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  private checkAuthentication() {
    this.isAuthenticated = this.authService.isLoggedIn();

    if (!this.isAuthenticated) {
      // Mostrar mensaje y redirigir después de un tiempo
      this.snackBar.open(
        'Debe iniciar sesión para realizar evaluaciones',
        'Cerrar',
        {
          duration: 5000,
        }
      );

      // Opcional: Redirigir automáticamente después de mostrar el mensaje
      setTimeout(() => {
        // this.redirectToLogin();
      }, 3000);
    }
  }

  private redirectToLogin() {
    // Redirigir a login con return URL
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  loadEvaluationData() {
    if (!this.isAuthenticated) {
      this.redirectToLogin();
      return;
    }

    this.isLoading = true;
    this.evaluationService
      .startEvaluation(this.nodeId, this.methodologyId)
      .subscribe({
        next: (evaluation) => {
          console.log(evaluation);

          this.currentEvaluation = evaluation;
          this.isLoading = false;

          // Update metadata with evaluation name
          this.metadataService.updateMetadata({
            title: `Evaluación: ${evaluation.methodology.name}`,
            description: evaluation.methodology.description,
          });
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

  onEvaluationEdit() {
    if (!this.isAuthenticated) {
      this.snackBar.open(
        'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        'Cerrar',
        { duration: 5000 }
      );
      this.redirectToLogin();
      return;
    }
    this.snackBar.open('Editar nuevamente.', 'Cerrar', { duration: 5000 });
  }

  onEvaluationSubmit(evaluation: EvaluationResult) {
    if (!this.isAuthenticated) {
      this.snackBar.open(
        'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        'Cerrar',
        { duration: 5000 }
      );
      this.redirectToLogin();
      return;
    }

    this.isSubmitting = true;

    this.evaluationService.submitEvaluation(evaluation).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.snackBar.open('Evaluación procesada exitosamente', 'Cerrar', {
          duration: 5000,
        });

        // Update current evaluation with results
        this.currentEvaluation = result;
        console.log(this.currentEvaluation);
      },
      error: (error) => {
        console.error('Error submitting evaluation:', error);
        this.snackBar.open('Error al procesar la evaluación', 'Cerrar', {
          duration: 5000,
        });
        this.isSubmitting = false;
      },
    });
  }

  onEvaluationFinalize(evaluation: EvaluationResult) {
    if (!this.isAuthenticated) {
      this.snackBar.open(
        'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        'Cerrar',
        { duration: 5000 }
      );
      this.redirectToLogin();
      return;
    }

    this.isFinalizing = true; // Set finalizing state

    this.evaluationService.finishEvaluation(evaluation).subscribe({
      next: (result) => {
        this.isFinalizing = false;
        this.snackBar.open('Evaluación finalizada exitosamente', 'Cerrar', {
          duration: 5000,
        });

        // Update current evaluation with finalized results
        this.currentEvaluation = result.evaluation_data;
        this.finishedEvaluation = result;

        // Show success message
        this.showFinalizedMessage();
      },
      error: (error) => {
        console.error('Error finalizing evaluation:', error);
        this.snackBar.open('Error al finalizar la evaluación', 'Cerrar', {
          duration: 5000,
        });
        this.isFinalizing = false;
      },
    });
  }

  private showFinalizedMessage() {
    this.snackBar
      .open('Evaluación finalizada exitosamente', 'Ver Resultados', {
        duration: 10000,
      })
      .onAction()
      .subscribe(() => {
        // The viewer is already shown automatically due to is_finalized flag
      });
  }
  private showSuccessMessage() {
    this.snackBar
      .open('Evaluación procesada exitosamente', '', {
        duration: 10000,
      })
      .onAction()
      .subscribe(() => {
        this.goBackToNode();
      });
  }

  goBackToNode() {
    // Navigate back to the node view
    this.router.navigate(['/view', this.nodeType.toLowerCase(), this.nodeId]);
  }

  goToLogin() {
    this.redirectToLogin();
  }

  private getNodeTypeRoute(): string {
    this.finishedEvaluation?.evaluation_data.methodology.entity;
    const typeMap: { [key: string]: string } = {
      Organization: 'organization',
      Person: 'person',
      Publication: 'publication',
      Project: 'project',
      Output: 'output',
      Término: 'term',
    };

    if (this.nodeData?.labels && this.nodeData.labels.length > 0) {
      const primaryLabel = this.nodeData.labels[0];
      return typeMap[primaryLabel] || primaryLabel.toLowerCase();
    }

    return 'node';
  }

  getNodeDisplayName(): string {
    if (this.nodeData) {
      return (
        this.nodeData.name ||
        this.nodeData.title ||
        this.nodeData.label ||
        this.nodeId
      );
    }
    return this.nodeId;
  }

  getNodeDescription(): string {
    if (this.nodeData?.description) {
      return this.nodeData.description;
    }
    return `Nodo ${this.nodeId}`;
  }

  getNodeProperties(): { key: string; value: any }[] {
    if (!this.nodeData) return [];

    const excludedKeys = [
      '_',
      'iroko_uuid',
      'labels',
      'elementId',
      'identity',
      'description',
    ];
    return Object.entries(this.nodeData)
      .filter(
        ([key]) => key.includes('identifier')
        // ([key]) => !excludedKeys.some((excluded) => key.startsWith(excluded))
      )
      .map(([key, value]) => ({ key, value }))
      .slice(0, 13);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  formatObject(obj: any): string {
    return JSON.stringify(obj);
  }

  trackByProperty(index: number, property: any): string {
    return property.key;
  }
}
