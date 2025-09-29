import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

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
  @Input() relationshipType: string = '';
  @Input() direction: 'INCOMING' | 'OUTGOING' = 'OUTGOING';
  @Output() nodeSelected = new EventEmitter<any>();

  private router = inject(Router); // Inject Router

  // Allowed node types for view details
  private readonly allowedNodeTypes = [
    'Source',
    'Organization',
    'Person',
    'Project',
    'Output',
    'Term',
  ];

  getNodeProperties(): { key: string; value: any }[] {
    if (!this.node) return [];

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
    // Try multiple ways to get the node type
    if (this.nodeLabels && this.nodeLabels.length > 0) {
      return this.nodeLabels.join(', ');
    }

    if (this.node?.labels && Array.isArray(this.node.labels)) {
      return this.node.labels.join(', ');
    }

    if (this.node?.type) {
      return this.node.type;
    }

    return 'Node';
  }

  getPrimaryNodeType(): string {
    const nodeType = this.getNodeType();
    return nodeType.split(',')[0].trim(); // Get the first label as primary type
  }

  shouldShowViewDetails(): boolean {
    const primaryType = this.getPrimaryNodeType();
    return this.allowedNodeTypes.includes(primaryType);
  }

  getViewDetailsRoute(): any[] {
    console.log('aaaa');

    const primaryType = this.getPrimaryNodeType().toLowerCase();
    const nodeId = this.node.id;

    if (nodeId) {
      return ['/view', primaryType, nodeId];
    }

    return ['/']; // Fallback route if no ID
  }

  onNodeClick(): void {
    if (this.node && this.node.id) {
      this.nodeSelected.emit(this.node);
    }
  }

  onViewDetails(event: Event): void {
    console.log(this.node);
    event.stopPropagation(); // Prevent card click event

    const primaryType = this.getPrimaryNodeType().toLowerCase();
    const nodeId = this.node.id;

    if (nodeId && primaryType) {
      console.log('Navigating to:', ['/view', primaryType, nodeId]);
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
      return value; // Arrays are handled by the array container
    } else if (this.isObject(value)) {
      return value; // Objects are handled by JSON viewer
    } else if (typeof value === 'string' && value.length > 150) {
      // Only truncate very long strings for display, but keep full text in title
      return value.substring(0, 150) + '...';
    }
    return value;
  }
}
