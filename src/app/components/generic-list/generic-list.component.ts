import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';

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
  FilterValue,
  LabelsService,
  ListColumn,
  ListFilter,
} from '../../services/labels.service';
import { RelationshipFilterComponent } from '../relationship-filter/relationship-filter.component';

import { MatDialog } from '@angular/material/dialog';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';

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
    RelationshipFilterComponent
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
  @Input() detaillsText: string = 'Ver detalles';

  entityTypeDisplay = '';

  // Data state
  nodes: any[] = [];
  totalCount = 0;
  _isLoading = false;
  hasError = false;
  errorMessage = '';

  // sort state
  sortBy: SortOption = { attribute: '', direction: 'ASC' };

  // Filter state
  filterForm: FormGroup;
  activeFilters: { [key: string]: any } = {};
  showFilters = false;
  activeFilterCount = 0;

  // Advanced query state
  showAdvancedQuery = false;
  customWhereClause = '';
  customParameters: { key: string; value: any }[] = [];

  // UI state
  sortControl: FormControl<string | null>;
  showSortOrder = false;

  // Pagination
  currentPage = 0;
  totalPages = 0;
  paginationRange: number[] = [];
  paginationInfoText = 'Cargando...';

  // Debounce for search
  private filterChanges = new Subject<void>();
  private filterSubjects = new Map<string, Subject<any>>();
  private filterSubscription?: Subscription;
  isExporting: boolean = false;

  availableFilters: ListFilter[] = [];
  selectedFilters: Set<string> = new Set();

  constructor(
    private irokoApiService: CypherApiService,
    private cypherBuilder: CypherBuilderService,
    private exportService: ExportService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private labelService: LabelsService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) {
    this.sortControl = this.fb.control('');
    this.filterForm = this.fb.group({});
  }

  ngOnInit() {
    console.trace('ngOnInit() CALLED');

    this.labelService.loadData().subscribe((labels) => {
      this.entityTypeDisplay =
        labels.nodes[this.entityType.toLocaleLowerCase()].display;
      this.initializeSorting();
      this.generateAutomaticFilters();
      this.initializeFilters();
      this.initializeAdvancedQuery();
      this.readFromUrl();

      // Ensure URL is synchronized after initialization
      // setTimeout(() => {
      //   this.updateUrl();
      // });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.trace('ngOnChanges() CALLED', changes);

    if (changes['filters'] || changes['columns']) {
      this.initializeFilters();
    }

    const advOptsChange = changes['advancedQueryOptions'];
    const fixedFiltersChange = changes['fixedFilters'];
    if (advOptsChange || fixedFiltersChange) {
      this.initializeAdvancedQuery();

      // IMPORTANT: Only trigger a reload if this is NOT the initial setup.
      // The initial load is handled by ngOnInit to ensure URL parameters are respected.
      // We check that the change object exists and that it's not the first change.
      if (
        (advOptsChange && !advOptsChange.isFirstChange()) ||
        (fixedFiltersChange && !fixedFiltersChange.isFirstChange())
      ) {
        this.loadPage(0);
      }
    }
  }

  ngOnDestroy() {
    this.filterSubscription?.unsubscribe();

    // Clean up all filter subjects
    this.filterSubjects.forEach((subject) => {
      subject.complete();
      subject.unsubscribe();
    });
    this.filterSubjects.clear();
  }

  private generateAutomaticFilters(): void {
    const autoFilters: ListFilter[] = [];
    const explicitFilters = [...(this.filters || [])];

    // Generate filters for columns that don't have explicit filters
    this.columns.forEach((column) => {
      if (
        column.filterable !== false &&
        !explicitFilters.some((f) => f.name === column.name) &&
        ['string', 'number', 'date'].includes(column.type || 'string')
      ) {
        const autoFilter: ListFilter = {
          name: column.name,
          label: column.label,
          type: this.getAutoFilterType(column.type || 'string'),
          placeholder: `Filtrar por ${column.label}`,
        };

        // Add auto-generated filters at the top
        autoFilters.unshift(autoFilter);
      }
    });

    // Combine: auto filters first, then explicit filters
    this.availableFilters = [...autoFilters, ...explicitFilters];

    // Initialize selectedFilters with all current filters plus the 'name' filter
    const initialSelectedFilters = new Set(this.filters.map((f) => f.name));

    // Automatically add the 'name' filter if it exists in availableFilters
    const nameFilter = this.availableFilters.find((f) => f.name === 'name');
    if (nameFilter) {
      initialSelectedFilters.add('name');
    }

    this.selectedFilters = initialSelectedFilters;

    // Update the filters with the selected ones
    this.updateSelectedFilters(Array.from(this.selectedFilters), false);
  }

  private getAutoFilterType(columnType: string): ListFilter['type'] {
    switch (columnType) {
      case 'date':
        return 'date';
      case 'number':
        return 'text'; // Could be enhanced to number-specific filter
      case 'array':
        return 'multiselect'; // For array types
      default:
        return 'text';
    }
  }

  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      data: {
        availableFilters: this.availableFilters,
        selectedFilters: Array.from(this.selectedFilters),
        columns: this.columns,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateSelectedFilters(result);
      }
    });
  }

  getFilterLabel(filterName: string): string {
    const filter = this.availableFilters.find((f) => f.name === filterName);
    return filter?.label || filterName;
  }

  private updateSelectedFilters(
    selectedFilterNames: string[],
    loadData: boolean = true
  ): void {
    this.selectedFilters = new Set(selectedFilterNames);

    // Update the filters array to only include selected filters
    this.filters = this.availableFilters.filter((filter) =>
      this.selectedFilters.has(filter.name)
    );

    // Reinitialize filters and clear any active filters for removed filters
    this.initializeFilters();

    // Clear active filters for filters that were removed
    Object.keys(this.activeFilters).forEach((filterName) => {
      if (!this.selectedFilters.has(filterName)) {
        delete this.activeFilters[filterName];
      }
    });

    this.updateActiveFilterCount();
    if (loadData) {
      this.loadPage(0);
    }
  }

  removeFilter(filterName: string): void {
    this.selectedFilters.delete(filterName);
    this.updateSelectedFilters(Array.from(this.selectedFilters));
  }

  isFilterActive(filterName: string): boolean {
    return this.selectedFilters.has(filterName);
  }

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

    // Create individual subjects for each filter to handle debounce separately
    const filterSubjects = new Map<string, Subject<any>>();

    // Setup value changes for all filters with individual debounce
    this.filters.forEach((filter) => {
      const control = this.filterForm.get(filter.name);
      if (control) {
        const subject = new Subject<any>();
        filterSubjects.set(filter.name, subject);

        // Subscribe to the debounced subject
        subject
          .pipe(
            debounceTime(300),
            distinctUntilChanged(
              (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
            )
          )
          .subscribe((value) => {
            this.applyFilterChange(filter.name, value, filter.type);
          });

        // Listen to control changes and push to subject
        control.valueChanges.subscribe((value) => {
          subject.next(value);
        });
      }
    });

    // Store subjects for cleanup
    this.filterSubjects = filterSubjects;
  }

  private applyFilterChange(
    filterName: string,
    value: any,
    filterType: string
  ) {
    if (this.hasFilterValue(value)) {
      this.activeFilters[filterName] = value;
    } else {
      delete this.activeFilters[filterName];
    }

    this.updateActiveFilterCount();
    this.loadPage(0);
    this.updateUrl();
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

  applyFilters() {
    this.activeFilters = {};

    // Only process filters that are currently selected
    const activeFilterNames = new Set(this.filters.map((f) => f.name));

    Object.keys(this.filterForm.controls).forEach((key) => {
      if (!activeFilterNames.has(key)) {
        return; // Skip if filter is not selected
      }

      const control = this.filterForm.get(key);
      const filterDef = this.filters.find((f) => f.name === key);

      if (control && this.hasFilterValue(control.value)) {
        // For relationship filters, they're already handled by individual subscriptions
        if (filterDef?.type !== 'relationship') {
          this.activeFilters[key] = control.value;
        }
      }
    });

    this.updateActiveFilterCount();
    this.loadPage(0);
    this.updateUrl();
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

    this.updateActiveFilterCount();

    // Reload data
    this.loadPage(0);

    // Force URL update with empty filters
    this.updateUrl();
  }

  hasRelationshipFilters(): boolean {
    return this.filters.some((filter) => filter.type === 'relationship');
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

  toggleFilters() {
    this.showFilters = !this.showFilters;
    this.cdr.detectChanges();
  }

  private updateActiveFilterCount() {
    this.activeFilterCount = Object.keys(this.activeFilters).length;
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.activeFilters).length > 0;
  }

  getActiveFilterCount(): number {
    return Object.keys(this.activeFilters).length;
  }

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

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    if (this._isLoading !== value) {
      this._isLoading = value;
      // Use markForCheck instead of detectChanges for better performance
      this.cdr.markForCheck();
    }
  }

  async loadPage(page: number) {
    console.trace(`loadPage(${page}) CALLED`);
    this.currentPage = page;
    this.isLoading = true;
    this.hasError = false;

    try {
      if (page === 0 || this.totalCount === 0) {
        this.totalCount = await this.fetchTotalCount();
      }

      this.nodes = await this.fetchNodes(page * this.pageSize, this.pageSize);
      this.updatePagination();

      // Update URL after successful load
      // this.updateUrl();
    } catch (error) {
      console.error('Error loading page:', error);
      this.hasError = true;
      this.errorMessage = 'Ha ocurrido un error al intentar cargar los datos.';
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchNodes(offset: number, limit: number): Promise<any[]> {
    const { query, parameters } = this.buildCompleteQuery(offset, limit);

    console.trace('fetchNodes', query, parameters);

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
    const { query, parameters } = this.buildCompleteQuery(0, 0, true);

    console.log('totalCount', query, parameters);

    const result = await this.irokoApiService
      .executeQuery({
        query,
        parameters,
        readonly: true,
      })
      .toPromise();

    return result?.[0]?.count || 0;
  }

  private buildRelationshipFilterParameters(): any {
    const params: any = {};

    Object.keys(this.activeFilters).forEach((filterName, index) => {
      const filterValue = this.activeFilters[filterName];
      const filterDef = this.filters.find((f) => f.name === filterName);

      if (
        filterDef?.type === 'relationship' &&
        filterValue &&
        filterValue.ids &&
        filterValue.ids.length > 0
      ) {
        const relationshipConfig = (filterDef as any).relationshipConfig;
        if (relationshipConfig) {
          const alias = relationshipConfig.alias || `related${index}`;

          // Add node ID parameters
          filterValue.ids.forEach((rel: string, relIndex: number) => {
            const relParamName = `${alias}Id${relIndex}`;
            params[relParamName] = rel;
          });

          // Add relationship attribute parameter if present
          if (filterValue.attributeValues) {
            Object.entries(filterValue.attributeValues).forEach(
              ([attribute, attrConfig]: [string, any]) => {
                const attrParamName = `relAttr${index}_${attribute}`;
                const value = attrConfig.value;
                params[attrParamName] = value;
              }
            );
          }
        }
      }
    });

    return params;
  }

  getRelationshipFilterInitialValue(filterName: string): any {
    const activeFilter = this.activeFilters[filterName];
    if (activeFilter) {
      return activeFilter;
    }

    // Return empty structure if no active filter
    return { ids: [] };
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

  private buildWhereClause(): string {
    const conditions: string[] = [];

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

  private buildParameters(): any {
    const params: any = {};

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

      if (
        filterDef?.type === 'relationship' &&
        filterValue &&
        filterValue.ids &&
        filterValue.ids.length > 0
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
          const relAlias = `rel${index}`;

          // Add MATCH pattern with relationship alias
          relationshipMatches += `\nMATCH (n)${direction}-[${relAlias}:${relationshipConfig.relationshipType}]-${arrow}(${alias}${targetLabel})`;

          // Add WHERE conditions for the specific related nodes
          const relConditions = filterValue.ids
            .map((rel: string, relIndex: number) => {
              const relParamName = `${alias}Id${relIndex}`;
              return `${alias}.iroko_uuid = $${relParamName}`;
            })
            .join(' OR ');

          relationshipConditions.push(`(${relConditions})`);

          // Add relationship attribute conditions if present
          if (filterValue.attributeValues) {
            Object.entries(filterValue.attributeValues).forEach(
              ([attribute, attrConfig]: [string, any]) => {
                const attrParamName = `relAttr${index}_${attribute}`;
                const attrCondition = this.buildRelationshipAttributeCondition(
                  relAlias,
                  attribute,
                  attrConfig.operator || 'EQUALS',
                  attrParamName
                );
                relationshipConditions.push(`(${attrCondition})`);
              }
            );
          }
        }
      }
    });

    return { relationshipMatches, relationshipConditions };
  }

  private buildRelationshipAttributeCondition(
    relAlias: string,
    attribute: string,
    operator: string,
    paramName: string
  ): string {
    switch (operator) {
      case 'EQUALS':
        return `${relAlias}.${attribute} = $${paramName}`;
      case 'GREATER_THAN':
        return `${relAlias}.${attribute} > $${paramName}`;
      case 'LESS_THAN':
        return `${relAlias}.${attribute} < $${paramName}`;
      case 'GREATER_EQUAL':
        return `${relAlias}.${attribute} >= $${paramName}`;
      case 'LESS_EQUAL':
        return `${relAlias}.${attribute} <= $${paramName}`;
      default:
        return `${relAlias}.${attribute} = $${paramName}`;
    }
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
    const calculatedPages = Math.ceil(this.totalCount / this.pageSize);
    this.totalPages = Math.max(1, calculatedPages) || 1; // Ensure at least 1 page

    if (this.currentPage >= this.totalPages) {
      this.currentPage = Math.max(0, this.totalPages - 1);
    }

    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + 5);

    this.paginationRange = [];
    for (let i = startPage; i < endPage; i++) {
      this.paginationRange.push(i);
    }
    this.updatePaginationInfo();
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

  onSortChange() {
    console.trace('onSortChange() CALLED');
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

  updatePaginationInfo() {
    if (this.totalCount === 0) {
      this.paginationInfoText = 'No se encontraron resultados.';
    }

    const startIdx = this.currentPage * this.pageSize + 1;
    const endIdx = Math.min(startIdx + this.nodes.length - 1, this.totalCount);
    const totalPages = this.totalPages;

    this.paginationInfoText = `Mostrando ${startIdx}–${endIdx} de ${
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

  getNodeDisplayName(node: any): string {
    return (
      node.name || node.title || node.label || node.iroko_uuid || 'Unnamed'
    );
  }

  hasAdvancedQuery(): boolean {
    return !!this.customWhereClause || this.customParameters.length > 0;
  }

  onRelationshipFilterChange(filterName: string, filterValue: any) {
    console.log(
      'Selection relationship filter changed',
      filterName,
      filterValue
    );

    // Update the form control with the selected IDs
    this.filterForm.get(filterName)?.setValue(filterValue);

    // The relationship filter's valueChanges subscription will handle the rest
  }

  private readFromUrl(): void {
    console.trace('readFromUrl() CALLED');
    const params = this.route.snapshot.queryParams;
    // Read page
    if (params['page'] !== undefined) {
      const page = parseInt(params['page'], 10);
      if (!isNaN(page) && page >= 0) {
        this.currentPage = page;
      }
    }
    // Read sort
    if (params['sort']) {
      const sortParts = params['sort'].split(':');
      if (sortParts.length === 2) {
        const attribute = sortParts[0];
        const direction = sortParts[1].toUpperCase();
        if (direction === 'ASC' || direction === 'DESC') {
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
      if (filter.type === 'relationship') {
        // Handle relationship filters - read IDs and attributes separately
        const idsParam = params[`filter_${filter.name}_ids`];

        const filterValue: FilterValue = { ids: [], attributeValues: {} };

        if (idsParam) {
          filterValue.ids = idsParam.split(',').map((v: string) => v.trim());
        }

        if (
          filter.relationshipConfig &&
          filter.relationshipConfig.attributeConfig
        ) {
          filter.relationshipConfig.attributeConfig.forEach((element) => {
            let pvalue = `filter_${filter.name}_attr_${element.attribute}_value`;
            let poperator = `filter_${filter.name}_attr_${element.attribute}_operator`;
            if (params[pvalue] && params[poperator]) {
              let attributeValue = params[pvalue];
              switch (element.type) {
                case 'number':
                  attributeValue = Number(params[pvalue]);
                  break;
                case 'date':
                  attributeValue = new Date(params[pvalue]).toISOString();
                  break;
                // text type doesn't need conversion
              }
              (filterValue.attributeValues ||
                (filterValue.attributeValues = {}))[element.attribute] = {
                value: attributeValue,
                operator: params[poperator],
              };
            }
          });
        }
        console.log(filterValue);

        if (filterValue.ids.length > 0) {
          this.activeFilters[filter.name] = filterValue;
          this.filterForm
            .get(filter.name)
            ?.setValue(filterValue, { emitEvent: false });
        }
      } else {
        const paramName = `filter_${filter.name}`;
        if (params[paramName] !== undefined) {
          let value = params[paramName];
          if (filter.type === 'multiselect') {
            if (typeof value === 'string' && value.includes(',')) {
              value = value.split(',').map((v: string) => v.trim());
            } else if (typeof value === 'string') {
              value = [value];
            }
          }

          if (value && (!Array.isArray(value) || value.length > 0)) {
            this.filterForm
              .get(filter.name)
              ?.setValue(value, { emitEvent: false });
            this.activeFilters[filter.name] = value;
          }
        }
      }
    });

    this.loadPage(this.currentPage);
  }

  private updateUrl(): void {
    console.trace('updateUrl() CALLED');
    const queryParams: any = {};

    // Add page (only if not first page)
    // if (this.currentPage > 0) {
    //   queryParams.page = this.currentPage;
    // } else {
    //   queryParams.page = null;
    // }
    queryParams.page = this.currentPage;

    // Add sort (only if exists)
    if (this.sortBy.attribute) {
      queryParams.sort = `${this.sortBy.attribute}:${this.sortBy.direction}`;
    } else {
      queryParams.sort = null;
    }

    // Add active filters (including relationship filters with attributes)
    let hasActiveFilters = false;
    Object.keys(this.activeFilters).forEach((key, index) => {
      const filterValue = this.activeFilters[key];
      const filterDef = this.filters.find((f) => f.name === key);

      if (this.hasFilterValue(filterValue)) {
        if (filterDef?.type === 'relationship') {
          // Handle relationship filters - store IDs and attributes separately
          if (filterValue.ids && filterValue.ids.length > 0) {
            queryParams[`filter_${key}_ids`] = filterValue.ids.join(',');
            hasActiveFilters = true;

            // Store attribute filter if present
            if (filterValue.attributeValues) {
              Object.entries(filterValue.attributeValues).forEach(
                ([attribute, attrConfig]: [string, any]) => {
                  const value = attrConfig.value;
                  const operator = attrConfig.operator || 'EQUALS';
                  queryParams[`filter_${key}_attr_${attribute}_value`] = value;
                  queryParams[`filter_${key}_attr_${attribute}_operator`] =
                    operator;
                }
              );
            }
          }
        } else if (Array.isArray(filterValue) && filterValue.length > 0) {
          queryParams[`filter_${key}`] = filterValue.join(',');
          hasActiveFilters = true;
        } else if (!Array.isArray(filterValue)) {
          queryParams[`filter_${key}`] = filterValue;
          hasActiveFilters = true;
        }
      } else {
        // Remove filter params if empty
        queryParams[`filter_${key}`] = null;
        queryParams[`filter_${key}_ids`] = null;
        queryParams[`filter_${key}_attr_value`] = null;
        queryParams[`filter_${key}_attr_operator`] = null;
      }
    });

    // Update the URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
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
