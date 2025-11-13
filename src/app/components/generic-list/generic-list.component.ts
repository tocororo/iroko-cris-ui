import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  inject,
  input,
  output,
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
  GenericListQueryOptions,
  SortOption,
  AdvancedQueryOptions,
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
    RelationshipFilterComponent,
  ],
})
export class GenericListComponent implements OnInit, OnDestroy, OnChanges {
  private irokoApiService = inject(CypherApiService);
  private cypherBuilder = inject(CypherBuilderService);
  private exportService = inject(ExportService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private labelService = inject(LabelsService);
  private cdr = inject(ChangeDetectorRef);
  dialog = inject(MatDialog);

  readonly entityType = input.required<string>();
  readonly columns = input<ListColumn[]>([]);
  @Input() filters: ListFilter[] = [];
  readonly label = input<string>('');
  readonly pageSize = input<number>(10);
  readonly defaultSort = input<string>();
  readonly defaultSortOrder = input<'ASC' | 'DESC'>('ASC');
  readonly advancedQueryOptions = input<AdvancedQueryOptions>();
  readonly fixedFilters = input<QueryFilter[]>([]);
  readonly nodeSelected = output<any>();
  readonly detaillsText = input<string>('Ver detalles');

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

  constructor() {
    this.sortControl = this.fb.control('');
    this.filterForm = this.fb.group({});
  }

  ngOnInit() {
    console.trace('ngOnInit() CALLED');

    this.labelService.loadData().subscribe((labels) => {
      this.entityTypeDisplay =
        labels.nodes[this.entityType().toLocaleLowerCase()].display;
      this.initializeSorting();
      this.generateAutomaticFilters();
      this.initializeFilters();
      this.initializeAdvancedQuery();
      this.readFromUrl();
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
    this.columns().forEach((column) => {
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
        columns: this.columns(),
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
    const advancedQueryOptions = this.advancedQueryOptions();
    if (advancedQueryOptions) {
      this.customWhereClause = advancedQueryOptions.customWhereClause || '';

      if (advancedQueryOptions.customParameters) {
        // Convert the object to array for the UI form
        this.customParameters = Object.entries(
          advancedQueryOptions.customParameters
        ).map(([key, value]) => ({ key, value }));
      }
    }
  }

  private initializeSorting() {
    const sortableColumns = this.columns()
      .filter((col) => col.sortable)
      .map((col) => col.name);
    const defaultSort = this.defaultSort();
    const initialSortAttr =
      defaultSort && sortableColumns.includes(defaultSort)
        ? defaultSort
        : sortableColumns[0] || 'iroko_uuid';

    this.sortBy = {
      attribute: initialSortAttr,
      direction: this.defaultSortOrder(),
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
      this.columns().forEach((column) => {
        row[column.label] = this.formatPropertyValue(
          node[column.name],
          column.type
        );
      });
      return row;
    });

    const filename = `${this.entityType().toLowerCase()}-export-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    this.exportService.exportToCSV(exportData, filename);
  }

  async exportCurrentView(): Promise<void> {
    this.isExporting = true;

    try {
      let exportObservable: Observable<Blob>;

      // Use the new query builder service for export
      const { query, parameters } = this.buildCompleteQuery(0, 0, false, true);

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
            link.download = `${this.entityType().toLowerCase()}_export_${timestamp}.csv`;

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

      this.nodes = await this.fetchNodes(
        page * this.pageSize(),
        this.pageSize()
      );
      this.updatePagination();
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

  private buildCompleteQuery(
    offset: number,
    limit: number,
    isCount: boolean = false,
    forExport: boolean = false
  ): { query: string; parameters: any } {
    // Convert customParameters array back to object for the service
    const customParametersObj: { [key: string]: any } = {};
    this.customParameters.forEach((param) => {
      if (
        param.key &&
        param.value !== undefined &&
        param.value !== null &&
        param.value !== ''
      ) {
        customParametersObj[param.key] = param.value;
      }
    });

    const queryOptions: GenericListQueryOptions = {
      entityType: this.entityType(),
      fixedFilters: this.fixedFilters(),
      activeFilters: this.activeFilters,
      filterDefinitions: this.filters,
      customWhereClause: this.customWhereClause,
      customParameters: customParametersObj, // Use the object version
      advancedQueryOptions: this.advancedQueryOptions(),
      sortBy: this.sortBy,
      offset,
      limit,
      isCount,
      forExport,
    };

    return this.cypherBuilder.buildGenericListQuery(queryOptions);
  }

  getRelationshipFilterInitialValue(filterName: string): any {
    const activeFilter = this.activeFilters[filterName];
    if (activeFilter) {
      return activeFilter;
    }

    // Return empty structure if no active filter
    return { ids: [] };
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
    const calculatedPages = Math.ceil(this.totalCount / this.pageSize());
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

    const startIdx = this.currentPage * this.pageSize() + 1;
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
      this.entityType().toLowerCase(),
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
    return this.columns().map((col) => ({
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
          const columnExists = this.columns().some(
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
