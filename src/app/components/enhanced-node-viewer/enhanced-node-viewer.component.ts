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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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

  constructor(
    private irokoApiService: IrokoApiService,
    private cypherBuilder: CypherBuilderService,
    private labelService: RelationshipsLabelService
  ) {}

  ngOnInit() {
    this.relationshipSearchIndices = this.labelService.getIndices() || {};
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

  // Add search method
  onRelationshipSearch(group: RelationshipGroup, searchTerm: string): void {
    group.searchTerm = searchTerm;
    group.currentPage = 0;
    this.loadRelationshipPage(group, group.currentPage);
  }

  // Add clear search method
  clearRelationshipSearch(group: RelationshipGroup): void {
    group.searchTerm = '';
    group.currentPage = 0;
    this.loadRelationshipPage(group, group.currentPage);
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
            pageSize: 10,
            isLoading: false,
            searchIndex: this.relationshipSearchIndices[row.relationshipType], // Set search index from config
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
      if (group.totalCount > group.pageSize || group.searchIndex) {
        this.loadRelationshipCount(group);
      }
    });
  }
  private loadRelationshipCount(group: RelationshipGroup): void {
    let countQuery;

    if (group.searchTerm && group.searchIndex) {
      countQuery = this.cypherBuilder.buildRelationshipCountQueryWithSearch(
        this.nodeId,
        group.type,
        group.direction,
        [this.nodeType],
        group.searchIndex,
        group.searchTerm
      );
    } else {
      countQuery = this.cypherBuilder.buildRelationshipCountQuery(
        this.nodeId,
        group.type,
        group.direction,
        [this.nodeType]
      );
    }

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
  }

  loadRelationshipPage(group: RelationshipGroup, page: number): void {
    if (group.isLoading) return;

    group.isLoading = true;
    group.isSearching = !!group.searchTerm;

    let relationshipsQuery;

    if (group.searchTerm && group.searchIndex) {
      // Use full-text search query
      relationshipsQuery =
        this.cypherBuilder.buildPaginatedRelationshipsQueryWithSearch(
          this.nodeId,
          group.type,
          group.direction,
          [this.nodeType],
          group.searchIndex,
          group.searchTerm,
          page,
          group.pageSize
        );
    } else {
      // Use regular paginated query
      relationshipsQuery = this.cypherBuilder.buildPaginatedRelationshipsQuery(
        this.nodeId,
        group.type,
        group.direction,
        [this.nodeType],
        page,
        group.pageSize
      );
    }

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
    return `<mat-icon class="direction-icon">${dicon} </mat-icon> ${this.labelName(
      group.type
    )} (${group.totalCount})`;
  }
  labelName(name: string): string {
    return this.labelService.getLabel(name);
  }
}
