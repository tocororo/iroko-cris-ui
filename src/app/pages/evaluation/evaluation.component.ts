import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EvaluationService } from '../../services/evaluation.service';
import { EvaluationMethodology } from '../../api/models/evaluation.model';
import { MetadataService } from '../../services/metadata.service';
import { GenericListComponent } from '../../components/generic-list/generic-list.component';
import {
  LabelsService,
  ListColumn,
  ListFilter,
} from '../../services/labels.service';

@Component({
  selector: 'app-evaluation',
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.scss'],
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    GenericListComponent
],
})
export class EvaluationComponent implements OnInit {
  methodologyId: string = '';
  methodology: EvaluationMethodology = {
    id: '',
    name: '',
    version: '',
    description: '',
    entity: '',
    sections: [],
  };
  searchResults: any[] = [];
  isLoading = false;
  isSearching = false;

  searchForm: FormGroup;
  searchColumns: ListColumn[] = [];

  displayNodeType = 'Nodo';

  filters: ListFilter[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evaluationService: EvaluationService,
    private metadataService: MetadataService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private labelService: LabelsService
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
    });
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.methodologyId = params['eval_id'];
      this.isLoading = true;
      this.evaluationService.getMethodology(this.methodologyId).subscribe({
        next: (methodology) => {
          this.methodology = methodology;
          this.isLoading = false;

          this.metadataService.updateMetadata({
            title: `Evaluación - ${methodology.name}`,
            description: methodology.description,
          });
          this.labelService.loadData().subscribe((labels) => {
            this.searchColumns =
              labels.nodes[
                this.methodology.entity.toLocaleLowerCase()
              ].properties;
            this.displayNodeType =
              labels.nodes[this.methodology.entity.toLocaleLowerCase()].display;
            this.filters =
              labels.nodes[this.methodology.entity.toLocaleLowerCase()].filters;
          });
        },
        error: (error) => {
          console.error('Error loading methodology:', error);
          this.snackBar.open(
            'Error al cargar la metodología de evaluación',
            'Cerrar',
            { duration: 5000 }
          );
          this.isLoading = false;
        },
      });
    });

    // Setup search debounce
    this.searchForm
      .get('searchTerm')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((term) => {
        if (term && term.length >= 2) {
          this.performSearch(term);
        } else {
          this.searchResults = [];
        }
      });
  }

  loadMethodology() {}

  performSearch(searchTerm: string) {
    this.isSearching = true;
    this.evaluationService
      .searchNodesForEvaluation(this.methodologyId, searchTerm)
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isSearching = false;
        },
        error: (error) => {
          console.error('Error searching nodes:', error);
          this.snackBar.open('Error al buscar nodos', 'Cerrar', {
            duration: 5000,
          });
          this.isSearching = false;
        },
      });
  }

  onNodeSelected(node: any) {
    if (this.methodologyId && node.iroko_uuid) {
      this.router.navigate(['/evaluate', node.iroko_uuid, this.methodologyId], {
        state: {
          dialogData: {
            nodeId: node.iroko_uuid,
            nodeType: this.methodology?.entity,
            nodeData: node,
          },
        },
      });
    }
  }

  clearSearch() {
    this.searchForm.patchValue({ searchTerm: '' });
    this.searchResults = [];
  }

  getEntityType(): string {
    return this.displayNodeType;
  }

  // Helper functions in component
  getTotalCategories(methodology: EvaluationMethodology): number {
    return methodology.sections.reduce(
      (total, section) => total + section.categories.length,
      0
    );
  }

  getTotalQuestions(methodology: EvaluationMethodology): number {
    return methodology.sections.reduce(
      (total, section) =>
        total +
        section.categories.reduce(
          (catTotal, category) => catTotal + category.questions.length,
          0
        ),
      0
    );
  }
}
