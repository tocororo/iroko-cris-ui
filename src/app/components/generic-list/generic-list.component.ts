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
  FormGroup,
} from '@angular/forms';
import {
  Observable,
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { IrokoApiService } from '../../services/iroko-api.service';
import {
  CypherBuilderService,
  QueryFilter,
} from '../../services/cypher-builder.service';
import { ExportService } from '../../services/export.service';
import { Router } from '@angular/router';

export interface ListColumn {
  name: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'string' | 'number' | 'date' | 'array';
}

export interface ListFilter {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'boolean';
  options?: string[]; // For select/multiselect types
  placeholder?: string;
}

export interface SortOption {
  attribute: string;
  direction: 'ASC' | 'DESC';
}

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
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class GenericListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() entityType!: string;
  @Input() columns: ListColumn[] = [];
  @Input() filters: ListFilter[] = [];
  @Input() label: string = '';
  @Input() pageSize: number = 10;
  @Input() defaultSort?: string;
  @Input() defaultSortOrder: 'ASC' | 'DESC' = 'ASC';
  @Input() advancedQueryOptions?: AdvancedQueryOptions;
  @Input() fixedFilters: QueryFilter[] = [];
  @Output() nodeSelected = new EventEmitter<any>();
  @Input() searchIndex?: string;
  @Input() detaillsText: string = 'Ver detalles';

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

  // Filter state
  filterForm: FormGroup;
  activeFilters: { [key: string]: any } = {};
  showFilters = false;

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
  private searchTerms = new Subject<string>();
  private searchSubscription?: Subscription;
  isExporting: boolean = false;

  constructor(
    private irokoApiService: IrokoApiService,
    private cypherBuilder: CypherBuilderService,
    private exportService: ExportService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchControl = this.fb.control('');
    this.sortControl = this.fb.control('');
    this.filterForm = this.fb.group({});
  }

  ngOnInit() {
    this.initializeSorting();
    this.initializeFilters();
    this.setupSearchDebounce();
    this.initializeAdvancedQuery();
    this.loadPage(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']) {
      this.initializeFilters();
    }
    if (changes['advancedQueryOptions'] || changes['fixedFilters']) {
      this.initializeAdvancedQuery();
      this.loadPage(0);
    }
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  private initializeFilters() {
    // Clear existing form controls
    const formGroup: { [key: string]: any } = {};

    this.filters.forEach((filter) => {
      switch (filter.type) {
        case 'text':
          formGroup[filter.name] = this.fb.control('');
          break;
        case 'select':
          formGroup[filter.name] = this.fb.control('');
          break;
        case 'multiselect':
          formGroup[filter.name] = this.fb.control([]);
          break;
        case 'date':
          formGroup[filter.name] = this.fb.control('');
          break;
        case 'boolean':
          formGroup[filter.name] = this.fb.control(false);
          break;
      }
    });

    this.filterForm = this.fb.group(formGroup);
    this.activeFilters = {};
  }

  private initializeAdvancedQuery() {
    if (this.advancedQueryOptions) {
      this.customWhereClause =
        this.advancedQueryOptions.customWhereClause || '';

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
    this.searchSubscription = this.searchTerms
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;

        this.loadPage(0);
      });

    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerms.next(value || '');
    });
  }

  // Filter Methods
  applyFilters() {
    this.activeFilters = {};

    Object.keys(this.filterForm.controls).forEach((key) => {
      const control = this.filterForm.get(key);
      if (control && control.value && control.value !== '') {
        this.activeFilters[key] = control.value;
      }
    });

    this.loadPage(0);
  }

  clearFilters() {
    this.filterForm.reset();
    this.activeFilters = {};
    this.loadPage(0);
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.activeFilters).length > 0;
  }

  getActiveFilterCount(): number {
    return Object.keys(this.activeFilters).length;
  }

  // Export Methods
  exportToCSV(): void {
    if (this.nodes.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Prepare data for export
    const exportData = this.nodes.map((node) => {
      const row: any = {};
      this.columns.forEach((column) => {
        row[column.label] = this.formatPropertyValue(
          node[column.name],
          column.type
        );
      });
      return row;
    });

    const filename = `${this.entityType.toLowerCase()}-export-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    this.exportService.exportToCSV(exportData, filename);
  }
  async exportCurrentView(): Promise<void> {
    this.isExporting = true;

    try {
      let exportObservable: Observable<Blob>;

      if (this.searchIndex && this.searchTerm) {
        const whereClause = this.buildWhereClause(true); // skip search conditions
        const orderClause = this.buildOrderClause();
        const returnClause = this.buildReturnClause();
        const searchIndex = this.searchIndex || 'generalSearch';
        const searchTerm = this.buildSearchTerm(this.searchTerm);
        const parameters = this.buildParameters(true); // skip search parameter

        exportObservable = this.irokoApiService.exportFullTextQueryToCsv({
          searchIndex,
          searchTerm,
          whereClause,
          returnClause,
          orderClause,
          parameters,
        });
      } else {
        const whereClause = this.buildWhereClause();
        const orderClause = this.buildOrderClause();
        const returnClause = this.buildReturnClause();

        const query = `
          MATCH (n:${this.entityType})
          ${whereClause}
          ${returnClause}
          ${orderClause}
        `;

        const parameters = this.buildParameters();

        exportObservable = this.irokoApiService.exportQueryToCsv({
          query,
          parameters,
          readonly: true,
        });
      }

      // Subscribe to the Observable to handle the Blob
      exportObservable.subscribe({
        next: (blob: Blob) => {
          try {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            link.download = `${this.entityType.toLowerCase()}_export_${timestamp}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } finally {
            this.isExporting = false;
          }
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.isExporting = false;
          // TODO: Show user-friendly error message (e.g., via toast)
        },
      });
    } catch (error) {
      console.error('Export preparation failed:', error);
      this.isExporting = false;
      // TODO: Notify user of failure
    }
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
      this.errorMessage = 'Ha ocurrido un error al intentar cargar los datos. ';
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchNodes(offset: number, limit: number): Promise<any[]> {
    if (this.searchIndex && this.searchTerm) {
      return await this.fetchNodesWithIndex(offset, limit);
    } else {
      return await this.fetchNodesWithBasicSearch(offset, limit);
    }
  }

  private async fetchNodesWithIndex(
    offset: number,
    limit: number
  ): Promise<any[]> {
    const whereClause = this.buildWhereClause(true); // Pass flag to skip search conditions
    const orderClause = this.buildOrderClause();
    const returnClause = this.buildReturnClause();
    const searchIndex = this.searchIndex || 'generalSearch';
    const searchTerm = this.buildSearchTerm(this.searchTerm);
    // Build the full-text search query
    const query = `
      CALL db.index.fulltext.queryNodes("${this.searchIndex}", $searchTerm)
      YIELD node, score
      WITH node AS n, score
      ${whereClause}
      ${returnClause}
      ${orderClause}
      SKIP $offset
      LIMIT $limit
    `;

    const parameters = {
      ...this.buildParameters(true), // Pass flag to skip search parameter
      offset,
      limit,
    };

    const result = await this.irokoApiService
      .executeFullTextQuery({
        searchIndex,
        searchTerm,
        whereClause,
        returnClause,
        orderClause,
        parameters,
      })
      .toPromise();

    return (result || []).map((item: any) =>
      this.extractNodeData(item.n || item)
    );
  }

  private async fetchTotalCountWithIndex(): Promise<number> {
    const whereClause = this.buildWhereClause(true);
    const searchIndex = this.searchIndex || 'generalSearch';
    const searchTerm = this.buildSearchTerm(this.searchTerm);
    const countTotal = true;
    const query = `
      CALL db.index.fulltext.queryNodes("${this.searchIndex}", $searchTerm)
      YIELD node, score
      WITH node AS n, score
      ${whereClause}
      RETURN count(n) AS count
    `;

    const parameters = {
      ...this.buildParameters(true),
      searchTerm: this.buildSearchTerm(this.searchTerm),
    };

    const result = await this.irokoApiService
      .executeFullTextQuery({
        searchIndex,
        searchTerm,
        whereClause,
        parameters,
        countTotal,
      })
      .toPromise();

    return result?.[0]?.count || 0;
  }

  private async fetchNodesWithBasicSearch(
    offset: number,
    limit: number
  ): Promise<any[]> {
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

  private async fetchTotalCount(): Promise<number> {
    if (this.searchIndex && this.searchTerm) {
      return await this.fetchTotalCountWithIndex();
    } else {
      return await this.fetchTotalCountWithBasicSearch();
    }
  }

  private async fetchTotalCountWithBasicSearch(): Promise<number> {
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

  // Enhanced search term building for full-text search
  private buildSearchTerm(term: string): string {
    if (!term.trim()) return '';

    // Add wildcard for partial matching and boost recent results
    const escapedTerm = term.replace(/[\\"']/g, '\\$&');
    return `${escapedTerm}*`;
  }

  private buildArrayFilterCondition(
    filterName: string,
    paramName: string,
    filterType: string
  ): string {
    switch (filterType) {
      case 'multiselect':
        // Check if any of the selected values exist in the array
        return `ANY(selectedValue IN $${paramName} WHERE selectedValue IN n.${filterName})`;

      case 'text':
        // For text search in arrays, check if any array element contains the text
        return `ANY(element IN n.${filterName} WHERE toLower(element) CONTAINS toLower($${paramName}))`;

      default:
        return `ANY(selectedValue IN $${paramName} WHERE selectedValue IN n.${filterName})`;
    }
  }
  // Update buildWhereClause to accept skipSearch parameter
  private buildWhereClause(skipSearch: boolean = false): string {
    const conditions: string[] = [];

    // Search condition (only for basic search)
    if (this.searchTerm && !skipSearch && !this.searchIndex) {
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

    // For index search, we need to filter by entity type
    if (this.searchIndex && this.searchTerm) {
      conditions.push(`n:${this.entityType}`);
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

    // Custom filters from filter form
    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const paramName = `filter${index}`;
      const filterDef = this.filters.find((f) => f.name === filterName);

      if (Array.isArray(filterValue) && filterValue.length > 0) {
        // Multi-select filter
        const column = this.columns.find((col) => col.name === filterName);

        if (column && column.type === 'array') {
          // For array properties, check if any selected value exists in the array
          conditions.push(
            this.buildArrayFilterCondition(filterName, paramName, 'multiselect')
          );
        } else {
          conditions.push(`n.${filterName} IN $${paramName}`);
        }
      } else if (typeof filterValue === 'boolean') {
        conditions.push(`n.${filterName} = $${paramName}`);
      } else if (filterValue instanceof Date) {
        conditions.push(`date(n.${filterName}) = date($${paramName})`);
      } else if (filterValue) {
        // Text filter
        const column = this.columns.find((col) => col.name === filterName);

        if (column && column.type === 'array') {
          // Text search within array elements
          conditions.push(
            this.buildArrayFilterCondition(filterName, paramName, 'text')
          );
        } else {
          // Regular text search for non-array properties
          conditions.push(
            `toLower(COALESCE(toString(n.${filterName}), '')) CONTAINS toLower($${paramName})`
          );
        }
      }
    });

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

  private buildParameters(skipSearch: boolean = false): any {
    const params: any = {};

    // Search parameter (only for basic search)
    if (this.searchTerm && !skipSearch && !this.searchIndex) {
      params.searchTerm = this.searchTerm;
    }

    // Fixed filter parameters
    this.fixedFilters.forEach((filter, index) => {
      params[`fixedFilter${index}`] = filter.value;
    });

    // Custom filter parameters
    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const paramName = `filter${index}`;

      if (filterValue instanceof Date) {
        params[paramName] = filterValue.toISOString();
      } else {
        params[paramName] = filterValue;
      }
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
