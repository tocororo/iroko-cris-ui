import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ListColumn } from '../../services/labels.service';

@Component({
  selector: 'app-relationship-card',
  templateUrl: './relationship-card.component.html',
  styleUrls: ['./relationship-card.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    NgxJsonViewerModule,
  ],
})
export class RelationshipCardComponent {
  @Input() node: any;
  @Input() relationship: any;
  @Input() nodeLabels: string[] = [];
  @Input() nodeLabelsDisplay: string[] = [];
  @Input() relationshipType: string = '';
  @Input() properties: ListColumn[] = [];
  @Input() direction: 'INCOMING' | 'OUTGOING' = 'OUTGOING';
  @Output() nodeSelected = new EventEmitter<any>();

  private router = inject(Router);

  // Allowed node types for view details
  private readonly allowedNodeTypes = [
    'Publication',
    'Organization',
    'Person',
    'Project',
    'Output',
    'Term',
    'Subject',
    'Index',
    'Licence',
  ];

  // Get relationship properties
  getRelationshipProperties(): { key: string; value: any }[] {
    if (!this.relationship) return [];

    return Object.entries(this.relationship)
      .filter(
        ([key]) =>
          !key.startsWith('_') &&
          key !== 'type' &&
          key !== 'identity' &&
          key !== 'elementId' &&
          key !== 'start' &&
          key !== 'end'
      )
      .map(([key, value]) => ({ key, value }));
  }

  // Check if relationship has properties
  hasRelationshipProperties(): boolean {
    return this.getRelationshipProperties().length > 0;
  }

  hasNodeProperties() {
    return this.getNodeProperties().length > 0;
  }
  getNodeProperties(): { key: string; value: any }[] {
    if (!this.node) return [];
    const props = Array.isArray(this.properties) ? this.properties : [];

    if (props.length > 0) {
      const result: { key: string; value: any }[] = [];
      this.properties.forEach((element) => {
        if (element.name in this.node) {
          result.push({
            key: element.label,
            value: this.node[element.name],
          });
        }
      });
      return result;
    } else {
      return Object.entries(this.node)
        .filter(
          ([key]) =>
            !key.startsWith('_') &&
            key !== 'labels' &&
            key !== 'identity' &&
            key !== 'elementId'
        )
        .map(([key, value]) => ({ key, value }));
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  getNodeDisplayName(): string {
    if (!this.node) return 'Unknown';

    return (
      this.node.name ||
      this.node.title ||
      this.node.label ||
      this.node.id ||
      'Unnamed'
    );
  }

  getNodeType(): string {
    if (this.nodeLabelsDisplay && this.nodeLabelsDisplay.length > 0) {
      return this.nodeLabelsDisplay.join(', ');
    }

    if (this.node?.labels && Array.isArray(this.node.labels)) {
      return this.node.labels.join(', ');
    }

    if (this.node?.type) {
      return this.node.type;
    }

    return 'Node';
  }


  shouldShowViewDetails(): boolean {
    const primaryType = this.nodeLabels[0];

    return this.allowedNodeTypes.includes(primaryType);
  }

  onNodeClick(): void {
    if (this.node && this.node.id) {
      this.nodeSelected.emit(this.node);
    }
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();

    const primaryType = this.nodeLabels[0].toLowerCase();
    const nodeId = this.node.id;

    if (nodeId && primaryType) {
      this.router.navigate(['/view', primaryType, nodeId]);
      this.nodeSelected.emit(this.node);
    }
  }

  getDirectionIcon(): string {
    return this.direction === 'INCOMING' ? 'arrow_back' : 'arrow_forward';
  }

  getDirectionLabel(): string {
    return this.direction === 'INCOMING' ? 'Incoming' : 'Outgoing';
  }

  // Helper to format property values for display
  formatPropertyValue(value: any): any {
    if (this.isArray(value)) {
      return value;
    } else if (this.isObject(value)) {
      return value;
    } else if (typeof value === 'string' && value.length > 150) {
      return value.substring(0, 150) + '...';
    }
    return value;
  }
}
