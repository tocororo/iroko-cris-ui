import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  map,
} from 'rxjs/operators';
import { CypherApiService } from '../../services/cypher-api.service';

interface DisplayItem {
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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class RelationshipFilterComponent implements OnInit, OnChanges {
  @Input() config!: any;
  @Input() label: string = 'Filtrar por relación';
  @Input() initialIds: string[] = [];
  @Output() selectionChange = new EventEmitter<string[]>();

  searchControl = new FormControl('');
  selectedIds: string[] = [];
  displayItems: DisplayItem[] = [];
  options: DisplayItem[] = [];
  isLoading = false;
  hasError = false;

  constructor(private cypherApiService: CypherApiService) {}

  ngOnInit() {
    this.setupSearch();
    if (this.initialIds?.length > 0) {
      this.fetchNamesForIds(this.initialIds);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialIds'] && !changes['initialIds'].firstChange) {
      const newIds = changes['initialIds'].currentValue || [];
      const currentIds = this.selectedIds;

      // Only update if IDs actually changed
      if (JSON.stringify(newIds) !== JSON.stringify(currentIds)) {
        this.selectedIds = [...newIds];
        if (newIds.length > 0) {
          this.fetchNamesForIds(newIds);
        } else {
          this.displayItems = [];
        }
      }
    }
  }

  private setupSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => this.searchRelationships(term || ''))
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

  private searchRelationships(searchTerm: string): Observable<DisplayItem[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return of([]);
    }

    this.isLoading = true;
    this.hasError = false;

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

    return this.cypherApiService
      .executeQuery({
        query,
        parameters: { searchTerm },
        readonly: true,
      })
      .pipe(
        map((results: any[]) =>
          results.map((item) => ({ id: item.id, name: item.name }))
        ),
        catchError((error) => {
          console.error('Search query error:', error);
          this.hasError = true;
          return of([]);
        })
      );
  }

  private fetchNamesForIds(ids: string[]) {
    if (!ids.length) {
      this.displayItems = [];
      return;
    }

    const query = `
      MATCH (node:${this.config.targetLabel})
      WHERE node.id IN $ids
      RETURN node.id AS id, node.name AS name
      ORDER BY node.name
    `;

    this.cypherApiService
      .executeQuery({
        query,
        parameters: { ids },
        readonly: true,
      })
      .subscribe({
        next: (results: any[]) => {
          this.displayItems = results.map((item) => ({
            id: item.id,
            name: item.name,
          }));
        },
        error: (error) => {
          console.error('Error fetching names:', error);
          this.hasError = true;
        },
      });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // Trigger search through valueChanges
  }

  onOptionSelected(option: DisplayItem) {
    if (!this.selectedIds.includes(option.id)) {
      this.selectedIds.push(option.id);
      this.displayItems.push(option);
      this.selectionChange.emit([...this.selectedIds]);
    }
    this.searchControl.setValue('');
    this.options = [];
  }

  removeRelationship(item: DisplayItem) {
    const index = this.selectedIds.indexOf(item.id);
    if (index >= 0) {
      this.selectedIds.splice(index, 1);
      this.displayItems.splice(index, 1);
      this.selectionChange.emit([...this.selectedIds]);
    }
  }

  clearAll() {
    this.selectedIds = [];
    this.displayItems = [];
    this.selectionChange.emit([]);
  }

  get placeholder(): string {
    return (
      this.config.placeholder ||
      `Buscar ${this.config.targetLabel.toLowerCase()}...`
    );
  }
}
