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
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
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
import { Router, ActivatedRoute } from '@angular/router';

import { map, forkJoin } from 'rxjs';

import { CypherApiService } from '../../services/cypher-api.service';
import {
  CypherBuilderService,
  QueryFilter,
} from '../../services/cypher-builder.service';
import { ExportService } from '../../services/export.service';
import {
  LabelsService,
  ListColumn,
  ListFilter,
} from '../../services/labels.service';
import {
  RelationshipFilterComponent,
} from '../relationship-filter/relationship-filter.component';

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
    RelationshipFilterComponent,
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

  entityTypeDisplay = '';

  // Data state
  nodes: any[] = [];
  totalCount = 0;
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
  currentPage = 0;
  totalPages = 0;
  paginationRange: number[] = [];

  // Debounce for search
  private searchTerms = new Subject<string>();
  private filterChanges = new Subject<void>();
  private searchSubscription?: Subscription;
  private filterSubscription?: Subscription;
  isExporting: boolean = false;

  constructor(
    private irokoApiService: CypherApiService,
    private cypherBuilder: CypherBuilderService,
    private exportService: ExportService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private labelService: LabelsService
  ) {
    this.searchControl = this.fb.control('');
    this.sortControl = this.fb.control('');
    this.filterForm = this.fb.group({});
  }

  ngOnInit() {
    this.labelService.loadData().subscribe((labels) => {
      this.entityTypeDisplay =
        labels.nodes[this.entityType.toLocaleLowerCase()].display;
      this.initializeSorting();
      this.initializeFilters();
      this.setupSearchDebounce();
      this.initializeAdvancedQuery();
      this.readFromUrl();

      // Ensure URL is synchronized after initialization
      setTimeout(() => {
        this.updateUrl();
      });
    });
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
    this.filterSubscription?.unsubscribe();
  }

  // Fix the filter form initialization
  private initializeFilters() {
    const formGroup: { [key: string]: any } = {};

    this.filters.forEach((filter) => {
      let defaultValue: any;

      switch (filter.type) {
        case 'text':
        case 'select':
        case 'date':
          defaultValue = '';
          break;
        case 'multiselect':
        case 'relationship':
          defaultValue = [];
          break;
        case 'boolean':
          defaultValue = false;
          break;
        default:
          defaultValue = '';
      }

      formGroup[filter.name] = this.fb.control(defaultValue);
    });

    this.filterForm = this.fb.group(formGroup);
    this.activeFilters = {};

    // Setup automatic filter application
    this.setupFilterAutoApply();
  }

  private setupFilterAutoApply() {
    this.filterSubscription?.unsubscribe();
    this.filterSubscription = this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        )
      )
      .subscribe(() => {
        // Don't auto-apply for relationship filters (they have their own apply)
        const hasRelationshipChanges = Object.keys(
          this.filterForm.controls
        ).some((key) => {
          const filterDef = this.filters.find((f) => f.name === key);
          return (
            filterDef?.type === 'relationship' &&
            JSON.stringify(this.filterForm.get(key)?.value) !==
              JSON.stringify(this.activeFilters[key])
          );
        });

        if (!hasRelationshipChanges) {
          this.applyFilters();
        }
      });
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
        : sortableColumns[0] || 'iroko_uuid';

    this.sortBy = {
      attribute: initialSortAttr,
      direction: this.defaultSortOrder,
    };

    this.sortControl.setValue(initialSortAttr);
    this.showSortOrder = !!initialSortAttr;
  }
  private setupSearchDebounce() {
    this.searchSubscription?.unsubscribe();
    this.searchSubscription = this.searchTerms
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;

        this.loadPage(0);
        this.updateUrl();
      });

    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerms.next(value || '');
    });
  }
  applyFilters() {
    this.activeFilters = {};

    Object.keys(this.filterForm.controls).forEach((key) => {
      const control = this.filterForm.get(key);
      const filterDef = this.filters.find((f) => f.name === key);

      if (control && this.hasFilterValue(control.value)) {
        if (filterDef?.type === 'relationship') {
          if (Array.isArray(control.value) && control.value.length > 0) {
            this.activeFilters[key] = control.value;
          }
        } else {
          this.activeFilters[key] = control.value;
        }
      }
    });

    this.loadPage(0);

    // Ensure URL is updated after filters are applied
    setTimeout(() => {
      this.updateUrl();
    });
  }

  clearFilters() {
    // Reset all form controls first
    Object.keys(this.filterForm.controls).forEach((key) => {
      const control = this.filterForm.get(key);
      if (control) {
        control.setValue(this.getDefaultValueForFilter(key));
      }
    });

    // Clear active filters
    this.activeFilters = {};

    // Reload data
    this.loadPage(0);

    // Force URL update with empty filters
    this.updateUrl();
  }

  private getDefaultValueForFilter(filterName: string): any {
    const filter = this.filters.find((f) => f.name === filterName);
    if (!filter) return '';

    switch (filter.type) {
      case 'multiselect':
      case 'relationship':
        return [];
      case 'boolean':
        return false;
      case 'select':
      case 'text':
      case 'date':
      default:
        return '';
    }
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

      // Always use the same approach for export - build complete query with relationships
      const { query, parameters } = this.buildCompleteQuery(0, 0, false, true); // true = for export

      exportObservable = this.irokoApiService.exportQueryToCsv({
        query,
        parameters,
        readonly: true,
      });

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
        },
      });
    } catch (error) {
      console.error('Export preparation failed:', error);
      this.isExporting = false;
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

      // Update URL after successful load
      this.updateUrl();
    } catch (error) {
      console.error('Error loading page:', error);
      this.hasError = true;
      this.errorMessage = 'Ha ocurrido un error al intentar cargar los datos.';
    } finally {
      this.isLoading = false;
    }
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Error de conexión. Verifique su conexión a internet.';
    } else if (error.status === 404) {
      return 'Recurso no encontrado.';
    } else if (error.status >= 500) {
      return 'Error del servidor. Intente nuevamente más tarde.';
    } else {
      return 'Ha ocurrido un error al intentar cargar los datos.';
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
    const { query, parameters } = this.buildCompleteQuery(offset, limit);

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
    const { query, parameters } = this.buildCompleteQuery(0, 0, true);

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
  private buildMainQuery(
    offset: number,
    limit: number,
    isCount: boolean = false
  ): { query: string; parameters: any } {
    const whereClause = this.buildWhereClause();
    const orderClause = isCount ? '' : this.buildOrderClause();
    const returnClause = isCount
      ? 'RETURN count(n) AS count'
      : this.buildReturnClause();
    const paginationClause = isCount ? '' : `SKIP $offset LIMIT $limit`;

    // Build relationship MATCH patterns for relationship filters
    const relationshipMatches = this.buildRelationshipMatchPatterns();

    const query = `
      MATCH (n:${this.entityType})
      ${relationshipMatches}
      ${whereClause}
      ${returnClause}
      ${orderClause}
      ${paginationClause}
    `;

    const parameters = {
      ...this.buildParameters(),
      ...this.buildRelationshipFilterParameters(),
    };

    if (!isCount) {
      parameters.offset = offset;
      parameters.limit = limit;
    }

    return { query, parameters };
  }

  private buildRelationshipMatchPatterns(): string {
    let relationshipMatches = '';

    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const filterDef = this.filters.find((f) => f.name === filterName);

      if (
        filterDef?.type === 'relationship' &&
        Array.isArray(filterValue) &&
        filterValue.length > 0
      ) {
        const relationshipConfig = (filterDef as any).relationshipConfig;
        if (relationshipConfig) {
          const direction =
            relationshipConfig.relationshipDirection === 'IN' ? '<' : '';
          const arrow =
            relationshipConfig.relationshipDirection === 'OUT' ? '>' : '';
          const targetLabel = relationshipConfig.targetLabel
            ? `:${relationshipConfig.targetLabel}`
            : '';
          const alias = relationshipConfig.alias || `related${index}`;

          relationshipMatches += `\nMATCH (n)${direction}-[:${relationshipConfig.relationshipType}]-${arrow}(${alias}${targetLabel})`;
        }
      }
    });

    return relationshipMatches;
  }

  private buildRelationshipFilterParameters(): any {
    const params: any = {};

    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const filterDef = this.filters.find((f) => f.name === filterName);

      if (
        filterDef?.type === 'relationship' &&
        Array.isArray(filterValue) &&
        filterValue.length > 0
      ) {
        const relationshipConfig = (filterDef as any).relationshipConfig;
        if (relationshipConfig) {
          const alias = relationshipConfig.alias || `related${index}`;

          // Add WHERE conditions for relationship filters
          // console.warn(filterValue);

          filterValue.forEach((rel, relIndex: number) => {
            const relParamName = `${alias}Id${relIndex}`;
            params[relParamName] = rel; // Use ID for the query, not name
          });
        }
      }
    });

    return params;
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

    // Custom filters from filter form (EXCLUDE relationship filters)
    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const paramName = `filter${index}`;
      const filterDef = this.filters.find((f) => f.name === filterName);

      // Skip relationship filters - they are handled separately
      if (filterDef?.type === 'relationship') {
        return;
      }

      // Skip empty values
      if (Array.isArray(filterValue) && filterValue.length === 0) {
        return;
      }

      if (
        filterValue === '' ||
        filterValue === null ||
        filterValue === undefined
      ) {
        return;
      }

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

    // Custom filter parameters - ONLY include non-empty values
    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const filterDef = this.filters.find((f) => f.name === filterName);

      // Skip relationship filters (they are handled separately)
      if (filterDef?.type === 'relationship') {
        return;
      }

      // Skip empty arrays
      if (Array.isArray(filterValue) && filterValue.length === 0) {
        return;
      }

      // Skip empty strings, null, undefined
      if (
        filterValue === '' ||
        filterValue === null ||
        filterValue === undefined
      ) {
        return;
      }

      const paramName = `filter${index}`;

      if (filterValue instanceof Date) {
        params[paramName] = filterValue.toISOString();
      } else {
        params[paramName] = filterValue;
      }
    });

    // Custom parameters
    this.customParameters.forEach((param) => {
      if (
        param.key &&
        param.value !== undefined &&
        param.value !== null &&
        param.value !== ''
      ) {
        params[param.key] = param.value;
      }
    });

    // Advanced query parameters
    if (this.advancedQueryOptions?.customParameters) {
      Object.entries(this.advancedQueryOptions.customParameters).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = value;
          }
        }
      );
    }

    return params;
  }

  private buildCompleteQuery(
    offset: number,
    limit: number,
    isCount: boolean = false,
    forExport: boolean = false
  ): { query: string; parameters: any } {
    const baseWhereClause = this.buildWhereClause();
    const orderClause = isCount ? '' : this.buildOrderClause();
    const returnClause = isCount
      ? 'RETURN count(n) AS count'
      : this.buildReturnClause();
      const paginationClause =
        isCount || forExport ? '' : `SKIP $offset LIMIT $limit`;

    // Build relationship patterns and conditions ONLY if there are active relationship filters
    const { relationshipMatches, relationshipConditions } =
      this.buildRelationshipFilters();

    // Combine all conditions
    const allConditions: string[] = [];

    // Add base WHERE conditions (excluding relationship placeholder conditions)
    const baseConditions = baseWhereClause.replace('WHERE ', '').trim();
    if (baseConditions) {
      allConditions.push(baseConditions);
    }

    // Add relationship conditions if any
    if (relationshipConditions.length > 0) {
      allConditions.push(...relationshipConditions);
    }

    const finalWhereClause =
      allConditions.length > 0 ? `WHERE ${allConditions.join(' AND ')}` : '';

    const query = `
      MATCH (n:${this.entityType})
      ${relationshipMatches}
      ${finalWhereClause}
      ${returnClause}
      ${orderClause}
      ${paginationClause}
    `.trim();

    const parameters = {
      ...this.buildParameters(),
      ...this.buildRelationshipFilterParameters(),
    };

    if (!isCount && !forExport) {
      parameters.offset = offset;
      parameters.limit = limit;
    }

    return { query, parameters };
  }

  private buildRelationshipFilters(): {
    relationshipMatches: string;
    relationshipConditions: string[];
  } {
    let relationshipMatches = '';
    const relationshipConditions: string[] = [];

    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const filterDef = this.filters.find((f) => f.name === filterName);

      // Only process relationship filters that have selected values
      if (
        filterDef?.type === 'relationship' &&
        Array.isArray(filterValue) &&
        filterValue.length > 0
      ) {
        const relationshipConfig = (filterDef as any).relationshipConfig;
        if (relationshipConfig) {
          const direction =
            relationshipConfig.relationshipDirection === 'IN' ? '<' : '';
          const arrow =
            relationshipConfig.relationshipDirection === 'OUT' ? '>' : '';
          const targetLabel = relationshipConfig.targetLabel
            ? `:${relationshipConfig.targetLabel}`
            : '';
          const alias = relationshipConfig.alias || `related${index}`;

          // Add MATCH pattern
          relationshipMatches += `\nMATCH (n)${direction}-[:${relationshipConfig.relationshipType}]-${arrow}(${alias}${targetLabel})`;

          // Add WHERE condition for the specific related nodes
          const relConditions = filterValue
            .map((rel, relIndex: number) => {
              const relParamName = `${alias}Id${relIndex}`;
              return `${alias}.iroko_uuid = $${relParamName}`;
            })
            .join(' OR ');

          relationshipConditions.push(`(${relConditions})`);
        }
      }
    });

    return { relationshipMatches, relationshipConditions };
  }

  private extractNodeData(nodeWrapper: any): any {
    if (nodeWrapper && nodeWrapper.properties) {
      return {
        id: nodeWrapper.elementId || nodeWrapper.properties.iroko_uuid,
        ...nodeWrapper.properties,
      };
    }

    if (nodeWrapper && nodeWrapper.iroko_uuid) {
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
    if (this.currentPage >= this.totalPages) {
      this.currentPage = Math.max(0, this.totalPages - 1);
    }
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

    // Ensure URL is updated even when search is cleared
    setTimeout(() => {
      this.updateUrl();
    });
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

    // Ensure URL update
    setTimeout(() => {
      this.updateUrl();
    });
  }

  toggleSortOrder() {
    this.sortBy.direction = this.sortBy.direction === 'ASC' ? 'DESC' : 'ASC';
    this.loadPage(0);

    // Ensure URL update
    setTimeout(() => {
      this.updateUrl();
    });
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
    this.updateUrl();
  }

  onNodeSelect(node: any) {
    this.router.navigate([
      '/view',
      this.entityType.toLowerCase(),
      node.iroko_uuid,
    ]);
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
    return (
      node.name || node.title || node.label || node.iroko_uuid || 'Unnamed'
    );
  }

  hasAdvancedQuery(): boolean {
    return !!this.customWhereClause || this.customParameters.length > 0;
  }

  onRelationshipFilterChange(filterName: string, selectedIds: string[]) {
    // Update the form control with the selected IDs
    this.filterForm.get(filterName)?.setValue(selectedIds);

    // Manually update activeFilters since the form valueChanges might be debounced
    if (selectedIds.length > 0) {
      this.activeFilters[filterName] = selectedIds;
    } else {
      delete this.activeFilters[filterName];
    }

    this.loadPage(0);

    // Ensure URL update
    setTimeout(() => {
      this.updateUrl();
    });
  }

  private readFromUrl(): void {
    const params = this.route.snapshot.queryParams;

    // Read page (must be done first potentially affecting loadPage offset)
    let urlPage = 0;
    if (params['page'] !== undefined) {
      const page = parseInt(params['page'], 10);
      if (!isNaN(page) && page >= 0) {
        this.currentPage = page; // Set internal state
      }
    }

    // Read search term
    if (params['search']) {
      this.searchTerm = params['search'];
      this.searchControl.setValue(this.searchTerm);
    }

    // Read sort
    if (params['sort']) {
      const sortParts = params['sort'].split(':');
      if (sortParts.length === 2) {
        const attribute = sortParts[0];
        const direction = sortParts[1].toUpperCase();
        if (direction === 'ASC' || direction === 'DESC') {
          // Validate against columns if necessary
          const columnExists = this.columns.some(
            (col) => col.name === attribute
          );
          if (columnExists) {
            this.sortBy = { attribute, direction: direction as 'ASC' | 'DESC' };
            this.sortControl.setValue(attribute);
            this.showSortOrder = true;
          }
        }
      }
    }

    // Read filters
    this.filters.forEach((filter) => {
      const paramName = `filter_${filter.name}`;
      if (params[paramName] !== undefined) {
        let value = params[paramName];
        if (filter.type === 'multiselect' || filter.type === 'relationship') {
          if (typeof value === 'string' && value.includes(',')) {
            value = value.split(',').map((v) => v.trim());
          } else if (typeof value === 'string') {
            value = [value];
          }
        }

        if (value && (!Array.isArray(value) || value.length > 0)) {
          if (filter.type === 'relationship' && Array.isArray(value)) {
            this.activeFilters[filter.name] = value;
            // // Value is an array of IDs. Need to fetch names.
            // // Create an Observable to fetch names for these IDs.
            // const fetchNames$ = this.fetchNamesForIds(
            //   value,
            //   filter.relationshipConfig.targetLabel
            // ).pipe(
            //   map((names) => ({
            //     filterName: filter.name,
            //     resolvedObjects: names,
            //   }))
            // );
            // relationshipRequests.push(fetchNames$);
          } else {
            // Set value directly for other types and update activeFilters
            this.filterForm.get(filter.name)?.setValue(value);
            this.activeFilters[filter.name] = value;
          }
        }
      }
    });

    // // Execute all relationship name fetch requests
    // if (relationshipRequests.length > 0) {
    //   forkJoin(relationshipRequests).subscribe((results) => {
    //     results.forEach((result) => {
    //       // Set the resolved {id, name} objects in the form control
    //       this.filterForm
    //         .get(result.filterName)
    //         ?.setValue(result.resolvedObjects);
    //       // Update activeFilters with just the IDs
    //       this.activeFilters[result.filterName] = result.resolvedObjects.map(
    //         (obj) => obj.id
    //       );
    //     });
    //     // Load the page after resolving relationships
    //     this.loadPage(0);
    //   });
    // } else {
    //   // If no relationship filters to resolve, load the page immediately
    //   this.loadPage(0);
    // }
    this.loadPage(this.currentPage);
  }

  // // Helper function to fetch names for given IDs
  // private fetchNamesForIds(
  //   ids: string[],
  //   targetLabel: string
  // ): Observable<SelectedRelationship[]> {
  //   if (ids.length === 0) {
  //     return of([]);
  //   }
  //   // Build the query to fetch names based on IDs
  //   const query = `
  //     MATCH (node:${targetLabel})
  //     WHERE node.id IN $ids
  //     RETURN node.id AS id, node.name AS name
  //   `;
  //   const parameters = { ids: ids };

  //   return this.irokoApiService
  //     .executeQuery({
  //       query,
  //       parameters,
  //       readonly: true,
  //     })
  //     .pipe(
  //       map((results: any[]) => {
  //         // Transform results to SelectedRelationship format
  //         return results.map((item) => ({ id: item.id, name: item.name }));
  //       }),
  //       catchError((error) => {
  //         console.error(
  //           'Error fetching names for relationship filter IDs:',
  //           error
  //         );
  //         // Return empty array or handle error as needed
  //         return of([]);
  //       })
  //     );
  // }

  private updateUrl(): void {
    const queryParams: any = {};

    // Add page (only if not first page)
    if (this.currentPage > 0) {
      queryParams.page = this.currentPage;
    } else {
      // Remove page param if it's the first page
      queryParams.page = null;
    }

    // Add search term (only if exists)
    if (this.searchTerm) {
      queryParams.search = this.searchTerm;
    } else {
      // Remove search param if empty
      queryParams.search = null;
    }

    // Add sort (only if exists)
    if (this.sortBy.attribute) {
      queryParams.sort = `${this.sortBy.attribute}:${this.sortBy.direction}`;
    } else {
      queryParams.sort = null;
    }

    // Add active filters (only non-empty ones)
    let hasActiveFilters = false;
    Object.keys(this.activeFilters).forEach((key) => {
      const value = this.activeFilters[key];
      const filterDef = this.filters.find((f) => f.name === key);

      if (this.hasFilterValue(value)) {
        if (Array.isArray(value) && value.length > 0) {
          if (filterDef?.type === 'relationship') {
            queryParams[`filter_${key}`] = value.join(',');
          } else {
            queryParams[`filter_${key}`] = value.join(',');
          }
          hasActiveFilters = true;
        } else if (!Array.isArray(value)) {
          queryParams[`filter_${key}`] = value;
          hasActiveFilters = true;
        }
      } else {
        // Remove filter param if empty
        queryParams[`filter_${key}`] = null;
      }
    });

    // If no active filters and we have filter params in URL, ensure they're removed
    if (!hasActiveFilters) {
      this.filters.forEach((filter) => {
        queryParams[`filter_${filter.name}`] = null;
      });
    }

    // Update the URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge', // Keep other query params
      replaceUrl: true,
    });
  }

  private hasFilterValue(value: any): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return true; // Boolean filters are always considered to have value
    return true;
  }
}
