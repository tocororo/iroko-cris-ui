import { Component, OnInit } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EvaluationService } from '../../services/evaluation.service';
import { EvaluationMethodology } from '../../api/models/evaluation.model';
import { MetadataService } from '../../services/metadata.service';

@Component({
  selector: 'app-evaluations',
  templateUrl: './evaluations.component.html',
  styleUrls: ['./evaluations.component.scss'],
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
],
})
export class EvaluationsComponent implements OnInit {
  methodologies: EvaluationMethodology[] = [];
  isLoading = false;

  constructor(
    private evaluationService: EvaluationService,
    private metadataService: MetadataService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Metodologías de Evaluación',
      description:
        'Explore las diferentes metodologías de evaluación disponibles',
    });

    this.loadMethodologies();
  }

  loadMethodologies() {
    this.isLoading = true;
    this.evaluationService.getMethodologies().subscribe({
      next: (methodologies) => {
        this.methodologies = methodologies;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading methodologies:', error);
        this.snackBar.open(
          'Error al cargar las metodologías de evaluación',
          'Cerrar',
          { duration: 5000 }
        );
        this.isLoading = false;
      },
    });
  }

  navigateToEvaluation(methodologyId: string) {
    this.router.navigate(['/evaluations', methodologyId]);
  }

  getEntityTypeIcon(entityType: string): string {
    const iconMap: { [key: string]: string } = {
      Publication: 'publication',
      Organization: 'corporate_fare',
      Person: 'people',
      Project: 'folder',
      Output: 'article',
    };
    return iconMap[entityType] || 'assessment';
  }

  trackByMethodology(
    index: number,
    methodology: EvaluationMethodology
  ): string {
    return methodology.id;
  }
}
