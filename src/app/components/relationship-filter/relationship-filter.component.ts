// relationship-filter.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';
import { CypherApiService } from '../../services/cypher-api.service';
import { RelationshipFilterConfig } from '../../services/labels.service';

export interface SelectedRelationship {
  id: string;
  name: string;
}

@Component({
  selector: 'app-relationship-filter',
  templateUrl: './relationship-filter.component.html',
  styleUrls: ['./relationship-filter.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class RelationshipFilterComponent implements OnInit, OnDestroy {
  @Input() config!: RelationshipFilterConfig;
  @Input() label: string = 'Filtrar por relación';
  @Output() selectionChange = new EventEmitter<SelectedRelationship[]>();

  searchControl = new FormControl('');
  selectedRelationships: SelectedRelationship[] = [];
  options: SelectedRelationship[] = [];
  isLoading = false;
  hasError = false;

  private searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private cypherApiService: CypherApiService) {}

  ngOnInit() {
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.searchRelationships(term))
      )
      .subscribe({
        next: (results) => {
          this.options = results;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.hasError = true;
          this.isLoading = false;
          this.options = [];
        },
      });
  }

  private searchRelationships(
    searchTerm: string
  ): Observable<SelectedRelationship[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return of([]);
    }

    this.isLoading = true;
    this.hasError = false;

    const query = this.buildSearchQuery(searchTerm);

    return this.cypherApiService
      .executeQuery({
        query: query.query,
        parameters: query.parameters,
        readonly: true,
      })
      .pipe(
        catchError((error) => {
          console.error('Search query error:', error);
          this.hasError = true;
          return of([]);
        })
      );
  }

  private buildSearchQuery(searchTerm: string): {
    query: string;
    parameters: any;
  } {
    const targetLabel = this.config.targetLabel
      ? `:${this.config.targetLabel}`
      : '';

    const query = `
      MATCH (node${targetLabel})
      WHERE toLower(node.name) CONTAINS toLower($searchTerm)
      RETURN node.id AS id, node.name AS name
      ORDER BY node.name
      LIMIT 10
    `;

    return {
      query,
      parameters: { searchTerm },
    };
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerms.next(value);
  }

  onOptionSelected(option: SelectedRelationship) {
    if (!this.selectedRelationships.find((item) => item.id === option.id)) {
      this.selectedRelationships.push(option);
      this.selectionChange.emit(this.selectedRelationships);
    }
    this.searchControl.setValue('');
    this.options = [];
  }

  removeRelationship(relationship: SelectedRelationship) {
    const index = this.selectedRelationships.indexOf(relationship);
    if (index >= 0) {
      this.selectedRelationships.splice(index, 1);
      this.selectionChange.emit(this.selectedRelationships);
    }
  }

  clearAll() {
    this.selectedRelationships = [];
    this.selectionChange.emit(this.selectedRelationships);
    this.searchControl.setValue('');
  }

  get placeholder(): string {
    return (
      this.config.placeholder ||
      `Buscar ${this.config.targetLabel.toLowerCase()}...`
    );
  }
}
