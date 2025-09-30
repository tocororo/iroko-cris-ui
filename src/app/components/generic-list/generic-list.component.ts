import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
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
import { MatExpansionModule } from '@angular/material/expansion';

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

// EJEMPLOS
// {
//   customWhereClause: "EXISTS((n)-[:RELATED_TO]->(:Organization {id: 'MES'}))";
// }
// {
//   customWhereClause: "n.source_type = $type AND n.start_year > $minYear",
//   customParameters: {
//     type: 'journal',
//     minYear: 2000
//   }
// }
// {
//   relationships: [
//     { type: 'PUBLISHED_BY', direction: 'OUT', targetLabel: 'Organization' },
//     { type: 'CLASSIFIED_BY', direction: 'OUT', targetLabel: 'Term' }
//   ]
// }
export interface AdvancedQueryOptions {
  customWhereClause?: string;
  customParameters?: { [key: string]: any };
  relationships?: {
    type: string;
    direction?: 'IN' | 'OUT';
    targetLabel?: string;
    alias?: string;
  }[];
  customReturn?: string;
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
    MatExpansionModule,
  ],
})
export class GenericListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() entityType!: string;
  @Input() columns: ListColumn[] = [];
  @Input() label: string = '';
  @Input() pageSize: number = 10;
  @Input() defaultSort?: string;
  @Input() defaultSortOrder: 'ASC' | 'DESC' = 'ASC';
  @Input() advancedQueryOptions?: AdvancedQueryOptions;
  @Input() fixedFilters: QueryFilter[] = [];
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

  // Advanced query state
  showAdvancedQuery = false;
  customWhereClause = '';
  customParameters: { key: string; value: any }[] = [];

  // UI state
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
    this.initializeAdvancedQuery();
    this.loadPage(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['advancedQueryOptions'] || changes['fixedFilters']) {
      this.initializeAdvancedQuery();
      this.loadPage(0);
    }
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  private initializeAdvancedQuery() {
    if (this.advancedQueryOptions) {
      this.customWhereClause =
        this.advancedQueryOptions.customWhereClause || '';

      // Initialize parameters from advanced query options
      if (this.advancedQueryOptions.customParameters) {
        this.customParameters = Object.entries(
          this.advancedQueryOptions.customParameters
        ).map(([key, value]) => ({ key, value }));
      }
    }
  }

  private initializeSorting() {
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

    return result?.[0]?.count || 0;
  }

  private async fetchNodes(offset: number, limit: number): Promise<any[]> {
    const whereClause = this.buildWhereClause();
    const orderClause = this.buildOrderClause();
    const returnClause = this.buildReturnClause();

    const query = `
      MATCH (n:${this.entityType})
      ${whereClause}
      ${returnClause}
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

    return (result || []).map((item: any) =>
      this.extractNodeData(item.n || item)
    );
  }

  private buildWhereClause(): string {
    const conditions: string[] = [];

    // Search condition
    if (this.searchTerm) {
      const searchableColumns = this.columns
        .filter((col) => col.filterable !== false)
        .map((col) => col.name);

      if (searchableColumns.length > 0) {
        const searchConditions = searchableColumns
          .map(
            (col) =>
              `toLower(COALESCE(toString(n.${col}), '')) CONTAINS toLower($searchTerm)`
          )
          .join(' OR ');
        conditions.push(`(${searchConditions})`);
      }
    }

    // Fixed filters
    if (this.fixedFilters.length > 0) {
      this.fixedFilters.forEach((filter, index) => {
        const paramName = `fixedFilter${index}`;
        switch (filter.operator) {
          case 'CONTAINS':
            conditions.push(
              `toLower(n.${filter.property}) CONTAINS toLower($${paramName})`
            );
            break;
          case 'STARTS WITH':
            conditions.push(
              `toLower(n.${filter.property}) STARTS WITH toLower($${paramName})`
            );
            break;
          case 'ENDS WITH':
            conditions.push(
              `toLower(n.${filter.property}) ENDS WITH toLower($${paramName})`
            );
            break;
          default:
            conditions.push(
              `n.${filter.property} ${filter.operator} $${paramName}`
            );
        }
      });
    }

    // Custom WHERE clause from advanced query
    if (this.customWhereClause) {
      conditions.push(`(${this.customWhereClause})`);
    }

    // Relationships from advanced query options
    if (this.advancedQueryOptions?.relationships) {
      this.advancedQueryOptions.relationships.forEach((rel, index) => {
        const alias = rel.alias || `related${index}`;
        const direction = rel.direction === 'IN' ? '<' : '';
        const arrow = rel.direction === 'OUT' ? '>' : '';
        const targetLabel = rel.targetLabel ? `:${rel.targetLabel}` : '';

        conditions.push(
          `EXISTS((n)${direction}-[:${rel.type}]-${arrow}(${alias}${targetLabel}))`
        );
      });
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  private buildReturnClause(): string {
    if (this.advancedQueryOptions?.customReturn) {
      return this.advancedQueryOptions.customReturn;
    }
    return 'RETURN n';
  }

  private buildOrderClause(): string {
    if (!this.sortBy.attribute) return '';
    return `ORDER BY n.${this.sortBy.attribute} ${this.sortBy.direction}`;
  }

  private buildParameters(): any {
    const params: any = {};

    // Search parameter
    if (this.searchTerm) {
      params.searchTerm = this.searchTerm;
    }

    // Fixed filter parameters
    this.fixedFilters.forEach((filter, index) => {
      params[`fixedFilter${index}`] = filter.value;
    });

    // Custom parameters
    this.customParameters.forEach((param) => {
      if (param.key) {
        params[param.key] = param.value;
      }
    });

    // Advanced query parameters
    if (this.advancedQueryOptions?.customParameters) {
      Object.assign(params, this.advancedQueryOptions.customParameters);
    }

    return params;
  }

  private extractNodeData(nodeWrapper: any): any {
    if (nodeWrapper && nodeWrapper.properties) {
      return {
        id: nodeWrapper.elementId || nodeWrapper.properties.id,
        ...nodeWrapper.properties,
      };
    }

    if (nodeWrapper && nodeWrapper.id) {
      return nodeWrapper;
    }

    const nodeData: any = { id: nodeWrapper.elementId };
    Object.keys(nodeWrapper).forEach((key) => {
      if (!['elementId', 'labels', 'identity'].includes(key)) {
        nodeData[key] = nodeWrapper[key];
      }
    });

    return nodeData;
  }

  private updatePagination() {
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 5);

    this.paginationRange = [];
    for (let i = startPage; i < endPage; i++) {
      this.paginationRange.push(i);
    }
  }

  // Advanced Query Methods
  addCustomParameter() {
    this.customParameters.push({ key: '', value: '' });
  }

  removeCustomParameter(index: number) {
    this.customParameters.splice(index, 1);
  }

  applyAdvancedQuery() {
    this.showAdvancedQuery = false;
    this.loadPage(0);
  }

  clearAdvancedQuery() {
    this.customWhereClause = '';
    this.customParameters = [];
    this.showAdvancedQuery = false;
    this.loadPage(0);
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
    return this.sortBy.direction === 'ASC' ? 'Ascendente' : 'Descendente';
  }

  getPaginationInfo(): string {
    if (this.totalCount === 0) {
      return 'No se encontraron resultados.';
    }

    const startIdx = this.currentPage * this.pageSize + 1;
    const endIdx = Math.min(startIdx + this.nodes.length - 1, this.totalCount);
    const totalPages = this.totalPages;

    return `Mostrando ${startIdx}–${endIdx} de ${
      this.totalCount
    } elementos — Página ${this.currentPage + 1} de ${totalPages}`;
  }

  onPageChange(page: number) {
    this.loadPage(page);
  }

  onNodeSelect(node: any) {
    this.router.navigate(['/view', this.entityType.toLowerCase(), node.id]);
    this.nodeSelected.emit(node);
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

  hasAdvancedQuery(): boolean {
    return !!this.customWhereClause || this.customParameters.length > 0;
  }
}
