import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EvaluationService } from '../../services/evaluation.service';
import { EvaluationMethodology } from '../../api/models/evaluation.model';

export interface EvaluationSelectionDialogData {
  nodeId: string;
  nodeType: string;
  nodeData?: any; // Add nodeData to the dialog data
}

@Component({
  selector: 'app-evaluation-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './evaluation-selection-dialog.component.html',
  styleUrls: ['./evaluation-selection-dialog.component.scss'],
})
export class EvaluationSelectionDialogComponent implements OnInit {
  private evaluationService = inject(EvaluationService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  availableEvaluations: EvaluationMethodology[] = [];
  isLoading = false;
  selectedEvaluation: EvaluationMethodology | null = null;

  constructor(
    public dialogRef: MatDialogRef<EvaluationSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EvaluationSelectionDialogData
  ) {}

  ngOnInit() {
    this.loadAvailableEvaluations();
  }

  loadAvailableEvaluations() {
    this.isLoading = true;
    this.evaluationService.getMethodologies().subscribe({
      next: (methodologies) => {
        // Filter methodologies that match the current node type
        this.availableEvaluations = methodologies.filter(
          (methodology) => methodology.entity === this.data.nodeType
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading evaluations:', error);
        this.snackBar.open(
          'Error al cargar las evaluaciones disponibles',
          'Cerrar',
          { duration: 5000 }
        );
        this.isLoading = false;
      },
    });
  }

  selectEvaluation(methodology: EvaluationMethodology) {
    this.selectedEvaluation = methodology;
  }

  startEvaluation() {
    if (this.selectedEvaluation) {
      // Close dialog and navigate to evaluation page with node data
      this.dialogRef.close();

      // Navigate to evaluation page with node data as query parameters
      this.router.navigate(
        ['/evaluate', this.data.nodeId, this.selectedEvaluation.id],
        {
          state: { dialogData: this.data },
        }
      );
    }
  }

  exploreAllEvaluations() {
    this.dialogRef.close();
    this.router.navigate(['/evaluations']);
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

  getTotalCategories(evaluation: EvaluationMethodology): number {
    return evaluation.sections.reduce(
      (total, section) => total + section.categories.length,
      0
    );
  }

  trackByMethodology(
    index: number,
    methodology: EvaluationMethodology
  ): string {
    return methodology.id;
  }
}
