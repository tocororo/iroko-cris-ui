// src/app/components/generic-list/generic-list.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
} from '@angular/forms';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IrokoApiService } from '../../api/services/iroko-api.service';
import {
  CypherBuilderService,
  QueryFilter,
} from '../../services/cypher-builder.service';
import { EnhancedNodeViewerComponent } from '../enhanced-node-viewer/enhanced-node-viewer.component';
import { Router } from '@angular/router';

export interface ListColumn {
  name: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'string' | 'number' | 'date' | 'array';
}

export interface SortOption {
  attribute: string;
  direction: 'ASC' | 'DESC';
}

@Component({
  selector: 'app-generic-list',
  templateUrl: './generic-list.component.html',
  styleUrls: ['./generic-list.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
  ],
})
export class GenericListComponent implements OnInit, OnDestroy {
  @Input() entityType!: string;
  @Input() columns: ListColumn[] = [];
  @Input() label: string = '';
  @Input() pageSize: number = 10;
  @Input() defaultSort?: string;
  @Input() defaultSortOrder: 'ASC' | 'DESC' = 'ASC';
  @Output() nodeSelected = new EventEmitter<any>();

  // Data state
  nodes: any[] = [];
  totalCount = 0;
  currentPage = 0;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Search and sort state
  searchTerm = '';
  sortBy: SortOption = { attribute: '', direction: 'ASC' };

  // Node viewer state
  selectedNode: any = null;
  showNodeViewer = false;

  // UI state - use FormControl with proper typing
  searchControl: FormControl<string | null>;
  sortControl: FormControl<string | null>;
  showSortOrder = false;

  // Pagination
  totalPages = 0;
  paginationRange: number[] = [];

  // Debounce for search
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private irokoApiService: IrokoApiService,
    private cypherBuilder: CypherBuilderService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchControl = this.fb.control('');
    this.sortControl = this.fb.control('');
  }

  ngOnInit() {
    this.initializeSorting();
    this.setupSearchDebounce();
    this.loadPage(0);
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  private initializeSorting() {
    // Set default sort
    const sortableColumns = this.columns
      .filter((col) => col.sortable)
      .map((col) => col.name);
    const initialSortAttr =
      this.defaultSort && sortableColumns.includes(this.defaultSort)
        ? this.defaultSort
        : sortableColumns[0] || 'id';

    this.sortBy = {
      attribute: initialSortAttr,
      direction: this.defaultSortOrder,
    };

    this.sortControl.setValue(initialSortAttr);
    this.showSortOrder = !!initialSortAttr;
  }

  private setupSearchDebounce() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        this.loadPage(0);
      });

    this.searchControl.valueChanges.subscribe((value) => {
      this.searchSubject.next(value || '');
    });
  }

  async loadPage(page: number) {
    this.currentPage = page;
    this.isLoading = true;
    this.hasError = false;

    try {
      if (page === 0) {
        this.totalCount = await this.fetchTotalCount();
      }

      this.nodes = await this.fetchNodes(page * this.pageSize, this.pageSize);
      this.updatePagination();
    } catch (error) {
      console.error('Error loading page:', error);
      this.hasError = true;
      this.errorMessage = 'Failed to load data. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchTotalCount(): Promise<number> {
    const whereClause = this.buildWhereClause();
    const query = `MATCH (n:${this.entityType}) ${whereClause} RETURN count(n) AS count`;
    const parameters = this.buildParameters();

    const result = await this.irokoApiService
      .executeQuery({
        query,
        parameters,
        readonly: true,
      })
      .toPromise();

    // Handle the nested structure: result is array of objects with count property
    return result?.[0]?.count || 0;
  }

  private async fetchNodes(offset: number, limit: number): Promise<any[]> {
    const whereClause = this.buildWhereClause();
    const orderClause = this.buildOrderClause();

    const query = `
      MATCH (n:${this.entityType})
      ${whereClause}
      RETURN n
      ${orderClause}
      SKIP $offset
      LIMIT $limit
    `;

    const parameters = {
      ...this.buildParameters(),
      offset,
      limit,
    };

    const result = await this.irokoApiService
      .executeQuery({
        query,
        parameters,
        readonly: true,
      })
      .toPromise();

    // Extract the actual node data from the nested structure
    // Result is array of objects like: [{n: {id: '...', name: '...'}}, ...]
    return (result || []).map((item: { n: any }) =>
      this.extractNodeData(item.n || item)
    );
  }

  private extractNodeData(nodeWrapper: any): any {
    // If the node data is nested under properties, extract it
    if (nodeWrapper && nodeWrapper.properties) {
      return {
        id: nodeWrapper.elementId || nodeWrapper.properties.id,
        ...nodeWrapper.properties,
      };
    }

    // If it's already a flat object with an id, return as is
    if (nodeWrapper && nodeWrapper.id) {
      return nodeWrapper;
    }

    // Otherwise, try to extract meaningful data from the wrapper
    const nodeData: any = { id: nodeWrapper.elementId };

    // Copy all properties from the wrapper that aren't metadata
    Object.keys(nodeWrapper).forEach((key) => {
      if (!['elementId', 'labels', 'identity'].includes(key)) {
        nodeData[key] = nodeWrapper[key];
      }
    });

    return nodeData;
  }

  private buildWhereClause(): string {
    if (!this.searchTerm) return '';

    const searchableColumns = this.columns
      .filter((col) => col.filterable !== false)
      .map((col) => col.name);

    if (searchableColumns.length === 0) return '';

    // Build a search across multiple properties
    const searchConditions = searchableColumns
      .map(
        (col) =>
          `toLower(COALESCE(toString(n.${col}), '')) CONTAINS toLower($searchTerm)`
      )
      .join(' OR ');

    return `WHERE ${searchConditions}`;
  }

  private buildOrderClause(): string {
    if (!this.sortBy.attribute) return '';
    return `ORDER BY n.${this.sortBy.attribute} ${this.sortBy.direction}`;
  }

  private buildParameters(): any {
    const params: any = {};
    if (this.searchTerm) {
      params.searchTerm = this.searchTerm;
    }
    return params;
  }

  private updatePagination() {
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;

    // Calculate pagination range (show max 5 pages)
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 5);

    this.paginationRange = [];
    for (let i = startPage; i < endPage; i++) {
      this.paginationRange.push(i);
    }
  }

  // UI Event Handlers
  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchControl.setValue(value);
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.searchTerm = '';
    this.loadPage(0);
  }

  onSortChange() {
    const newAttribute = this.sortControl.value;
    if (!newAttribute || newAttribute === 'none') {
      this.sortBy = { attribute: '', direction: 'ASC' };
      this.showSortOrder = false;
    } else {
      // If sorting by the same attribute, toggle direction
      if (this.sortBy.attribute === newAttribute) {
        this.toggleSortOrder();
      } else {
        this.sortBy = { attribute: newAttribute, direction: 'ASC' };
        this.showSortOrder = true;
      }
    }
    this.loadPage(0);
  }

  toggleSortOrder() {
    this.sortBy.direction = this.sortBy.direction === 'ASC' ? 'DESC' : 'ASC';
    this.loadPage(0);
  }

  getSortIcon(): string {
    return this.sortBy.direction === 'ASC' ? 'arrow_upward' : 'arrow_downward';
  }

  getSortTooltip(): string {
    return this.sortBy.direction === 'ASC' ? 'Ascending' : 'Descending';
  }

  getPaginationInfo(): string {
    if (this.totalCount === 0) {
      return 'No results found.';
    }

    const startIdx = this.currentPage * this.pageSize + 1;
    const endIdx = Math.min(startIdx + this.nodes.length - 1, this.totalCount);
    const totalPages = this.totalPages;

    return `Showing ${startIdx}–${endIdx} of ${this.totalCount} items — Page ${
      this.currentPage + 1
    } of ${totalPages}`;
  }

  onPageChange(page: number) {
    this.loadPage(page);
  }

  onNodeSelect(node: any) {
    // Navigate to the node view route
    this.router.navigate(['/view', this.entityType.toLowerCase(), node.id]);
    this.nodeSelected.emit(node);
  }

  onBackToList() {
    this.selectedNode = null;
    this.showNodeViewer = false;
  }

  formatPropertyValue(value: any, type?: string): string {
    if (value === null || value === undefined) return '-';

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (type === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString();
    }

    return String(value);
  }

  getNodeProperties(
    node: any
  ): { key: string; value: any; label: string; type?: string }[] {
    return this.columns.map((col) => ({
      key: col.name,
      value: node[col.name],
      label: col.label,
      type: col.type,
    }));
  }

  hasSearchTerm(): boolean {
    return !!this.searchTerm;
  }

  getNodeDisplayName(node: any): string {
    return node.name || node.title || node.label || node.id || 'Unnamed';
  }
}
