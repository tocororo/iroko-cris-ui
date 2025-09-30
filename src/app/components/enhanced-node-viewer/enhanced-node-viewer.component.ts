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

import { IrokoApiService } from '../../api/services/iroko-api.service';
import { CypherBuilderService } from '../../services/cypher-builder.service';
import { RelationshipCardComponent } from '../relationship-card/relationship-card.component';
import { RelationshipPaginationComponent } from '../relationship-pagination/relationship-pagination.component';

interface RelationshipGroup {
  type: string;
  relationships: RelationshipData[];
  direction: 'INCOMING' | 'OUTGOING';
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
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

  constructor(
    private irokoApiService: IrokoApiService,
    private cypherBuilder: CypherBuilderService
  ) {}

  ngOnInit() {
    this.loadNode();
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

  private processAllRelationships(result: any[]) {
    const relationshipMap = new Map<string, RelationshipGroup>();

    // Process all relationships from the result
    result.forEach((row: any) => {
      if (row.relationshipType && row.related) {
        const direction: 'INCOMING' | 'OUTGOING' = row.isOutgoing
          ? 'OUTGOING'
          : 'INCOMING';
        const key = `${row.relationshipType}-${direction}`;

        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, {
            type: row.relationshipType,
            relationships: [],
            direction: direction,
            totalCount: 0, // We'll count as we process
            currentPage: 0,
            pageSize: 10,
            isLoading: false,
          });
        }

        const group = relationshipMap.get(key)!;

        // Only store the first page (10 items) initially
        if (group.relationships.length < group.pageSize) {
          group.relationships.push({
            node: row.related,
            relationship: row.r,
            nodeLabels: row.relatedLabels || [],
          });
        }

        // Count all relationships for this type
        group.totalCount++;
      }
    });

    this.relationshipGroups = Array.from(relationshipMap.values());

    // For groups with more than 10 items, we need to load counts properly
    this.relationshipGroups.forEach((group) => {
      if (group.totalCount > group.pageSize) {
        this.loadRelationshipCount(group);
      }
    });
  }

  private loadRelationshipCount(group: RelationshipGroup): void {
    const countQuery = this.cypherBuilder.buildRelationshipCountQuery(
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
      },
      error: (error) => {
        console.error('Error loading relationship count:', error);
        // Keep the estimated count we have
      },
    });
  }

  loadRelationshipPage(group: RelationshipGroup, page: number): void {
    if (group.isLoading) return;

    group.isLoading = true;

    const relationshipsQuery =
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
          relationship: row.r,
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

  shouldShowPagination(group: RelationshipGroup): boolean {
    return group.totalCount > group.pageSize;
  }

  getTabLabel(group: RelationshipGroup): string {
    const dicon =
      group.direction === 'INCOMING' ? 'arrow_back' : 'arrow_forward';
    return `<mat-icon class="direction-icon">${dicon} </mat-icon> ${group.type} (${group.totalCount})`;
  }
}
