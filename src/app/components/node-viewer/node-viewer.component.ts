import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CypherApiService } from '../../services/cypher-api.service';
import { CypherBuilderService } from '../../services/cypher-builder.service';
import { RelationshipsLabelService } from '../../services/relationships-label.service';
import { NodePropertiesComponent } from '../node-properties/node-properties.component';
import { RelationshipGroup } from '../../api/models/relationship.models';
import { RelationshipGroupComponent } from '../relationship-group/relationship-group.component';

@Component({
  selector: 'app-node-viewer',
  templateUrl: './node-viewer.component.html',
  styleUrls: ['./node-viewer.component.scss'],
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    NodePropertiesComponent,
    RelationshipGroupComponent,
  ],
})
export class NodeViewerComponent implements OnInit, OnDestroy {
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

  constructor(
    private irokoApiService: CypherApiService,
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
    // Clean up if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('EnhancedNodeViewerComponent - Input changes:', changes);

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

  private processAllRelationships(result: any[]) {
    const relationshipMap = new Map<string, RelationshipGroup>();

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
            searchIndex: this.relationshipSearchIndices[row.relationshipType],
          });
        }

        const group = relationshipMap.get(key)!;

        if (group.relationships.length < group.pageSize) {
          group.relationships.push({
            node: row.related,
            relationship: row.relationProperties,
            nodeLabels: row.relatedLabels || [],
          });
        }

        group.totalCount++;
      }
    });

    this.relationshipGroups = Array.from(relationshipMap.values());

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
      } else {
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

  onRelatedNodeSelect(nodeData: any): void {
    if (nodeData && nodeData.id) {
      const nodeLabels = nodeData.labels || nodeData.nodeLabels || [];
      const primaryType = nodeLabels.length > 0 ? nodeLabels[0] : 'node';

      this.nodeSelected.emit({
        node: nodeData,
        type: primaryType,
      });
    }
  }

  // Event handlers for relationships component
  onRelationshipPageChange(group: RelationshipGroup, page: number): void {
    this.loadRelationshipPage(group, page);
  }

  onRelationshipSearch(group: RelationshipGroup, searchTerm: string): void {
    group.searchTerm = searchTerm;
    group.currentPage = 0;
    this.loadRelationshipCount(group).then(() => {
      this.loadRelationshipPage(group, 0);
    });
  }

  onRelationshipExport(group: RelationshipGroup): void {
    this.exportCurrentView(group);
  }

  onSearchClear(group: RelationshipGroup): void {
    group.searchTerm = '';
    group.currentPage = 0;
    this.loadRelationshipCount(group).then(() => {
      this.loadRelationshipPage(group, 0);
    });
  }

  labelName(name: string): string {
    return this.labelService.getLabel(name);
  }

  // Export functionality (keep existing implementation)
  exportCurrentView(group: RelationshipGroup): void {
    if (this.isExporting) return;

    this.isExporting = true;

    try {
      let exportObservable;

      if (group.searchTerm) {
        if (group.searchIndex) {
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
          const query = this.buildExportQuery(group);
          const parameters = this.buildExportParameters(group, false);

          exportObservable = this.irokoApiService.exportQueryToCsv({
            query,
            parameters,
            readonly: true,
          });
        }
      } else {
        const query = this.buildExportQuery(group);
        const parameters = this.buildExportParameters(group, false);

        exportObservable = this.irokoApiService.exportQueryToCsv({
          query,
          parameters,
          readonly: true,
        });
      }

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
