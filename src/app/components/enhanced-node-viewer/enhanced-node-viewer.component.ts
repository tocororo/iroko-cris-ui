import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IrokoApiService } from '../../services/iroko-api.service';
import { CypherBuilderService } from '../../services/cypher-builder.service';
import { RelationshipCardComponent } from '../relationship-card/relationship-card.component';
import { RelationshipPaginationComponent } from '../relationship-pagination/relationship-pagination.component';
import { RelationshipsLabelService } from '../../services/relationships-label.service';
import { ConfigService } from '../../services/config.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

interface RelationshipGroup {
  type: string;
  relationships: RelationshipData[];
  direction: 'INCOMING' | 'OUTGOING';
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  searchTerm?: string; // Add search term
  searchIndex?: string; // Add search index
  isSearching?: boolean; // Add search state
  showSearch?: boolean;
}

interface RelationshipData {
  node: any;
  relationship: any;
  nodeLabels: string[];
}

@Component({
  selector: 'app-enhanced-node-viewer',
  templateUrl: './enhanced-node-viewer.component.html',
  styleUrls: ['./enhanced-node-viewer.component.scss'],
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    NgxJsonViewerModule,
    MatProgressSpinnerModule,
    RelationshipCardComponent,
    RelationshipPaginationComponent,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
})
export class EnhancedNodeViewerComponent implements OnInit {
  @Input() nodeId!: string;
  @Input() nodeType!: string;
  @Output() nodeLoaded = new EventEmitter<any>();
  @Output() nodeSelected = new EventEmitter<any>();
  node: any;
  relationshipGroups: RelationshipGroup[] = [];
  loading = false;
  activeTab = 0;
  relationshipSearchIndices: { [key: string]: string } = {};
  isExporting = false;

  searchControls: Map<string, FormControl> = new Map();
  private searchSubscriptions: Subscription[] = [];

  constructor(
    private irokoApiService: IrokoApiService,
    private cypherBuilder: CypherBuilderService,
    private labelService: RelationshipsLabelService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.labelService.loadRelData().subscribe((metadata) => {
      this.relationshipSearchIndices = metadata.searchIndices;
      this.loadNode();
    });
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.searchSubscriptions.forEach((sub) => sub.unsubscribe());
    this.searchSubscriptions = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('EnhancedNodeViewerComponent - Input changes:', changes);

    // Reload node when nodeId or nodeType changes
    if (
      (changes['nodeId'] && changes['nodeId'].currentValue) ||
      (changes['nodeType'] && changes['nodeType'].currentValue)
    ) {
      this.loadNode();
    }
  }

  loadNode() {
    this.activeTab = 0;
    if (!this.nodeId || !this.nodeType) {
      console.warn('EnhancedNodeViewerComponent - Missing nodeId or nodeType');
      return;
    }

    console.log('EnhancedNodeViewerComponent - Loading node:', {
      nodeId: this.nodeId,
      nodeType: this.nodeType,
    });

    this.loading = true;

    // Load node with all relationships
    const queryData = this.cypherBuilder.buildNodeWithRelationshipsQuery(
      this.nodeId,
      [this.nodeType]
    );
    console.log(queryData);

    this.irokoApiService.executeQuery(queryData).subscribe({
      next: (result) => {
        if (result && result.length > 0) {
          this.node = result[0].n;
          this.nodeLoaded.emit(this.node);

          this.processAllRelationships(result);
        } else {
          console.warn('EnhancedNodeViewerComponent - No node found');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error(
          'EnhancedNodeViewerComponent - Error loading node:',
          error
        );
        this.loading = false;
      },
    });
  }

  // Add search method
  onRelationshipSearch(group: RelationshipGroup, searchTerm: string): void {
    // group.searchTerm = searchTerm;
    // group.currentPage = 0;
    // this.loadRelationshipPage(group, group.currentPage);
  }

  // Add clear search method
  clearRelationshipSearch(group: RelationshipGroup): void {
    const control = this.searchControls.get(this.getGroupKey(group));
    if (control) {
      control.setValue('', { emitEvent: true });
    } else {
      // Fallback if control doesn't exist
      group.searchTerm = '';
      group.currentPage = 0;
      this.loadRelationshipCount(group).then(() => {
        this.loadRelationshipPage(group, 0);
      });
    }
  }

  private processAllRelationships(result: any[]) {
    const relationshipMap = new Map<string, RelationshipGroup>();

    // Process all relationships from the result
    result.forEach((row: any) => {
      if (row.relationshipType && row.related) {
        const direction: 'INCOMING' | 'OUTGOING' = row.isOutgoing
          ? 'OUTGOING'
          : 'INCOMING';
        const key = `${row.relationshipType}_${direction}`;

        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, {
            type: row.relationshipType,
            relationships: [],
            direction: direction,
            totalCount: 0,
            currentPage: 0,
            pageSize: 5,
            isLoading: false,
            searchIndex: this.relationshipSearchIndices[row.relationshipType], // Set search index from config
          });
        }

        const group = relationshipMap.get(key)!;

        // Only store the first page (10 items) initially
        if (group.relationships.length < group.pageSize) {
          group.relationships.push({
            node: row.related,
            relationship: row.relationProperties,
            nodeLabels: row.relatedLabels || [],
          });
        }

        // Count all relationships for this type
        group.totalCount++;
      }
    });

    this.relationshipGroups = Array.from(relationshipMap.values());
    this.initializeSearchControls();

    // For groups with more than 10 items, we need to load counts properly
    this.relationshipGroups.forEach((group) => {
      if (group.totalCount > group.pageSize || group.searchIndex) {
        this.loadRelationshipCount(group);
        group.showSearch = true;
      }
    });
  }
  private loadRelationshipCount(group: RelationshipGroup): Promise<void> {
    return new Promise((resolve) => {
      let countQuery;

      if (group.searchTerm) {
        if (group.searchIndex) {
          // Use full-text count query if index is available
          countQuery = this.cypherBuilder.buildRelationshipCountQueryWithSearch(
            this.nodeId,
            group.type,
            group.searchIndex,
            group.searchTerm,
            group.direction,
            [this.nodeType]
          );
          this.irokoApiService.executeFullTextQuery(countQuery).subscribe({
            next: (countResult) => {
              if (countResult && countResult.length > 0) {
                group.totalCount = countResult[0].count || group.totalCount;
              }
              resolve();
            },
            error: (error) => {
              console.error('Error loading relationship count:', error);
              resolve();
            },
          });
        } else {
          // Use regular count query when no search index is available
          countQuery =
            this.cypherBuilder.buildRelationshipCountQueryWithRegularSearch(
              this.nodeId,
              group.type,
              group.searchTerm,
              group.direction,
              [this.nodeType]
            );
          this.irokoApiService.executeQuery(countQuery).subscribe({
            next: (countResult) => {
              if (countResult && countResult.length > 0) {
                group.totalCount = countResult[0].count || group.totalCount;
              }
              resolve();
            },
            error: (error) => {
              console.error('Error loading relationship count:', error);
              resolve();
            },
          });
        }
      } else {
        // Regular count query for non-search scenarios
        countQuery = this.cypherBuilder.buildRelationshipCountQuery(
          this.nodeId,
          group.type,
          group.direction,
          [this.nodeType]
        );
        this.irokoApiService.executeQuery(countQuery).subscribe({
          next: (countResult) => {
            if (countResult && countResult.length > 0) {
              group.totalCount = countResult[0].count || group.totalCount;
            }
            resolve();
          },
          error: (error) => {
            console.error('Error loading relationship count:', error);
            resolve();
          },
        });
      }
    });
  }

  loadRelationshipPage(group: RelationshipGroup, page: number): void {
    if (group.isLoading) return;

    group.isLoading = true;
    group.isSearching = !!group.searchTerm;

    let relationshipsQuery;
    this.loadRelationshipCount(group).then(() => {
      if (group.searchTerm && group.showSearch) {
        // Use regular search when no search index is available
        relationshipsQuery =
          this.cypherBuilder.buildPaginatedRelationshipsQueryWithRegularSearch(
            this.nodeId,
            group.type,
            group.searchTerm,
            group.direction,
            [this.nodeType],
            page,
            group.pageSize
          );
        this.irokoApiService.executeQuery(relationshipsQuery).subscribe({
          next: (result) => {
            group.relationships = result.map((row: any) => ({
              node: row.related,
              relationship: row.relationProperties,
              nodeLabels: row.relatedLabels || [],
            }));
            group.currentPage = page;
            group.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading relationships:', error);
            group.isLoading = false;
          },
        });

        let countQuery =
          this.cypherBuilder.buildRelationshipCountQueryWithRegularSearch(
            this.nodeId,
            group.type,
            group.searchTerm,
            group.direction,
            [this.nodeType]
          );
        this.irokoApiService.executeQuery(countQuery).subscribe({
          next: (countResult) => {
            if (countResult && countResult.length > 0) {
              group.totalCount = countResult[0].count || group.totalCount;
            }
          },
          error: (error) => {
            console.error('Error loading relationship count:', error);
          },
        });

        // relationshipsQuery =
        //   this.cypherBuilder.buildPaginatedRelationshipsQueryWithSearch(
        //     this.nodeId,
        //     group.type,
        //     group.searchIndex,
        //     group.searchTerm,
        //     group.direction,
        //     [this.nodeType],
        //     page,
        //     group.pageSize
        //   );
        // this.irokoApiService.executeFullTextQuery(relationshipsQuery).subscribe({
        //   next: (result) => {
        //     group.relationships = result.map((row: any) => ({
        //       node: row.related,
        //       relationship: row.relationProperties,
        //       nodeLabels: row.relatedLabels || [],
        //     }));
        //     group.currentPage = page;
        //     group.isLoading = false;
        //   },
        //   error: (error) => {
        //     console.error('Error loading relationships:', error);
        //     group.isLoading = false;
        //   },
        // });
      } else {
        // Use regular paginated query
        relationshipsQuery =
          this.cypherBuilder.buildPaginatedRelationshipsQuery(
            this.nodeId,
            group.type,
            group.direction,
            [this.nodeType],
            page,
            group.pageSize
          );
        this.irokoApiService.executeQuery(relationshipsQuery).subscribe({
          next: (result) => {
            group.relationships = result.map((row: any) => ({
              node: row.related,
              relationship: row.relationProperties,
              nodeLabels: row.relatedLabels || [],
            }));
            group.currentPage = page;
            group.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading relationships:', error);
            group.isLoading = false;
          },
        });
      }
    });
  }

  getNodeProperties(): { key: string; value: any }[] {
    if (!this.node) return [];

    return Object.entries(this.node)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => ({ key, value }));
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  onRelatedNodeSelect(nodeData: any): void {
    if (nodeData && nodeData.id) {
      // Extract the primary node type from labels
      const nodeLabels = nodeData.labels || nodeData.nodeLabels || [];
      const primaryType = nodeLabels.length > 0 ? nodeLabels[0] : 'node';

      // Emit the node data with type information

      this.nodeSelected.emit({
        node: nodeData,
        type: primaryType,
      });
    }
  }
  getDisplayedRelationships(group: RelationshipGroup): RelationshipData[] {
    return group.relationships;
  }
  private initializeSearchControls() {
    // Clean up existing subscriptions
    this.searchSubscriptions.forEach((sub) => sub.unsubscribe());
    this.searchSubscriptions = [];
    this.searchControls.clear();

    // Create form controls and subscriptions for each group
    this.relationshipGroups.forEach((group) => {
      const control = new FormControl(group.searchTerm || '');
      this.searchControls.set(this.getGroupKey(group), control);

      // Subscribe to value changes with debounce
      const subscription = control.valueChanges
        .pipe(
          debounceTime(400), // Wait 400ms after user stops typing
          distinctUntilChanged() // Only emit if value changed
        )
        .subscribe((searchTerm) => {
          this.onSearchInput(group, searchTerm || '');
        });

      this.searchSubscriptions.push(subscription);
    });
  }

  // Add a helper method to get the form control safely
  getSearchControl(group: RelationshipGroup): FormControl {
    const key = this.getGroupKey(group);
    let control = this.searchControls.get(key);

    if (!control) {
      // Create control if it doesn't exist
      control = new FormControl(group.searchTerm || '');
      this.searchControls.set(key, control);

      // Subscribe to value changes
      const subscription = control.valueChanges
        .pipe(debounceTime(400), distinctUntilChanged())
        .subscribe((searchTerm) => {
          this.onSearchInput(group, searchTerm || '');
        });

      this.searchSubscriptions.push(subscription);
    }

    return control;
  }

  private getGroupKey(group: RelationshipGroup): string {
    return `${group.type}_${group.direction}`;
  }

  private onSearchInput(group: RelationshipGroup, searchTerm: string) {
    group.searchTerm = searchTerm;
    group.currentPage = 0;

    // Load count first, then load the page
    this.loadRelationshipCount(group).then(() => {
      this.loadRelationshipPage(group, 0);
    });
  }

  shouldShowPagination(group: RelationshipGroup): boolean {
    return group.totalCount > group.pageSize;
  }

  getTabLabel(group: RelationshipGroup): string {
    const dicon =
      group.direction === 'INCOMING' ? 'arrow_back' : 'arrow_forward';
    return `<mat-icon class="direction-icon">${dicon} </mat-icon> ${this.labelName(
      group.type
    )} (${group.totalCount})`;
  }
  labelName(name: string): string {
    return this.labelService.getLabel(name);
  }

  exportCurrentView(group: RelationshipGroup): void {
    if (this.isExporting) return;

    this.isExporting = true;

    try {
      let exportObservable;

      if (group.searchTerm) {
        if (group.searchIndex) {
          // Build full-text search query for export
          const searchIndex = group.searchIndex;
          const searchTerm = group.searchTerm;
          const whereClause = this.buildExportWhereClause(group, true);
          const returnClause = this.buildExportReturnClause();
          const orderClause = this.buildExportOrderClause();
          const parameters = this.buildExportParameters(group, true);

          exportObservable = this.irokoApiService.exportFullTextQueryToCsv({
            searchIndex,
            searchTerm,
            whereClause,
            returnClause,
            orderClause,
            parameters,
          });
        } else {
          // Build regular search query for export
          const query = this.buildExportQuery(group);
          const parameters = this.buildExportParameters(group, false);

          exportObservable = this.irokoApiService.exportQueryToCsv({
            query,
            parameters,
            readonly: true,
          });
        }
      } else {
        // Build regular query for export (no search)
        const query = this.buildExportQuery(group);
        const parameters = this.buildExportParameters(group, false);

        exportObservable = this.irokoApiService.exportQueryToCsv({
          query,
          parameters,
          readonly: true,
        });
      }

      // Subscribe to the export observable
      exportObservable.subscribe({
        next: (blob: Blob) => {
          try {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = `relaciones_${group.type}_${this.nodeId}_${timestamp}.csv`;
            link.download = fileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.snackBar.open(
              'Exportación completada exitosamente',
              'Cerrar',
              {
                duration: 5000,
              }
            );
          } finally {
            this.isExporting = false;
          }
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.snackBar.open('Error al exportar los datos', 'Cerrar', {
            duration: 5000,
          });
          this.isExporting = false;
        },
      });
    } catch (error) {
      console.error('Export preparation failed:', error);
      this.snackBar.open('Error al preparar la exportación', 'Cerrar', {
        duration: 5000,
      });
      this.isExporting = false;
    }
  }

  private buildExportQuery(group: RelationshipGroup): string {
    const mainNodeLabelClause = this.nodeType ? `:${this.nodeType}` : '';

    let relationshipPattern: string;
    if (group.direction === 'OUTGOING') {
      relationshipPattern = `(parent)-[r:${group.type}]->(n)`;
    } else {
      relationshipPattern = `(parent)<-[r:${group.type}]-(n)`;
    }

    const whereClause = this.buildExportWhereClause(group, false);
    const orderClause = this.buildExportOrderClause();
    const returnClause = this.buildExportReturnClause();

    return `
      MATCH (parent${mainNodeLabelClause} {id: $nodeId})
      MATCH ${relationshipPattern}
      ${whereClause}
      ${returnClause}
      ${orderClause}
    `;
  }

  private buildExportWhereClause(
    group: RelationshipGroup,
    skipSearch: boolean = false
  ): string {
    const conditions: string[] = [];

    // Add search condition if applicable
    if (group.searchTerm && !skipSearch && !group.searchIndex) {
      const searchProperties = ['name', 'description', 'id'];
      const searchConditions = searchProperties
        .map(
          (prop) =>
            `toLower(COALESCE(toString(n.${prop}), '')) CONTAINS toLower($searchTerm)`
        )
        .join(' OR ');
      conditions.push(`(${searchConditions})`);
    }

    // For full-text search exports, we need to filter by entity type
    if (group.searchIndex && group.searchTerm) {
      conditions.push(`n:${this.nodeType}`);
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  private buildExportReturnClause(): string {
    return `
      RETURN n
    `;
  }
  // n.id as id,
  //       n.name as nombre,
  //       n.title as titulo,
  //       n.description as descripcion,
  //       n.label as etiqueta,
  // labels(n) as tipos,
  // type(r) as tipo_relacion,
  // properties(r) as propiedades_relacion

  private buildExportOrderClause(): string {
    return `ORDER BY n.name, n.title, n.id`;
  }

  private buildExportParameters(
    group: RelationshipGroup,
    skipSearch: boolean = false
  ): any {
    const params: any = {
      nodeId: this.nodeId,
    };

    if (group.searchTerm && !skipSearch && !group.searchIndex) {
      params.searchTerm = group.searchTerm;
    }

    return params;
  }
}
