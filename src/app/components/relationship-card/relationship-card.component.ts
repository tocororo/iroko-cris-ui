import {
  Component,
  inject,
  SimpleChanges,
  input,
  output
} from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ListColumn } from '../../services/labels.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-relationship-card',
  templateUrl: './relationship-card.component.html',
  styleUrls: ['./relationship-card.component.scss'],
  imports: [
    RouterModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    NgxJsonViewerModule,
  ],
})
export class RelationshipCardComponent {
  readonly node = input<any>();
  readonly relationship = input<any>();
  readonly nodeLabels = input<string[]>([]);
  readonly nodeLabelsDisplay = input<string[]>([]);
  readonly relationshipType = input<string>('');
  readonly properties = input<ListColumn[]>([]);
  readonly direction = input<'INCOMING' | 'OUTGOING'>('OUTGOING');
  readonly nodeSelected = output<any>();
  readonly nodeDelete = output<any>();

  private authService = inject(AuthService);
  private router = inject(Router);

  public calculatedRelationshipProperties: { key: string; value: any }[] = [];
  public calculatedNodeProperties: { key: string; value: any }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['relationship'] || changes['node']) {
      this.calculatedRelationshipProperties =
        this._calculateRelationshipProperties();
      this.calculatedNodeProperties = this._calculateNodeProperties();
    }
  }

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

  private _calculateRelationshipProperties(): { key: string; value: any }[] {
    const relationship = this.relationship();
    if (!relationship) return [];

    return (
      Object.entries(relationship)
        // .filter(...) // Apply your filters here
        .map(([key, value]) => ({ key, value }))
    );
  }
  private _calculateNodeProperties(): { key: string; value: any }[] {
    const node = this.node();
    if (!node) return [];
    const properties = this.properties();
    const props = Array.isArray(properties) ? properties : [];

    if (props.length > 0) {
      const result: { key: string; value: any }[] = [];
      this.properties().forEach((element) => {
        const nodeValue = this.node();
        if (element.name in nodeValue) {
          result.push({
            key: element.label,
            value: nodeValue[element.name],
          });
        }
      });
      return result;
    } else {
      return Object.entries(node)
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

  // Get relationship properties
  getRelationshipProperties(): { key: string; value: any }[] {
    return this.calculatedRelationshipProperties;
  }

  // Check if relationship has properties
  hasRelationshipProperties(): boolean {
    return this.calculatedRelationshipProperties.length > 0;
  }

  hasNodeProperties() {
    return this.calculatedNodeProperties.length > 0;
  }
  getNodeProperties(): { key: string; value: any }[] {
    return this.calculatedNodeProperties;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  getNodeDisplayName(): string {
    const node = this.node();
    if (!node) return 'Unknown';

    return (
      node.name ||
      node.title ||
      node.label ||
      node.iroko_uuid ||
      'Unnamed'
    );
  }

  getNodeType(): string {
    const nodeLabelsDisplay = this.nodeLabelsDisplay();
    if (nodeLabelsDisplay && nodeLabelsDisplay.length > 0) {
      return nodeLabelsDisplay.join(', ');
    }

    const node = this.node();
    if (node?.labels && Array.isArray(node.labels)) {
      return node.labels.join(', ');
    }

    if (node?.type) {
      return node.type;
    }

    return 'Node';
  }

  shouldShowViewDetails(): boolean {
    const primaryType = this.nodeLabels()[0];

    return this.allowedNodeTypes.includes(primaryType);
  }

  onNodeClick(): void {
    const node = this.node();
    if (node && node.iroko_uuid) {
      this.nodeSelected.emit(node);
    }
  }

  onNodeDelete(): void {
    const node = this.node();
    if (node && node.iroko_uuid) {
      this.nodeDelete.emit(node);
    }
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();

    const primaryType = this.nodeLabels()[0].toLowerCase();
    const nodeId = this.node().iroko_uuid;

    if (nodeId && primaryType) {
      this.router.navigate(['/view', primaryType, nodeId]);
      this.nodeSelected.emit(this.node());
    }
  }

  getDirectionIcon(): string {
    return this.direction() === 'INCOMING' ? 'arrow_back' : 'arrow_forward';
  }

  getDirectionLabel(): string {
    return this.direction() === 'INCOMING' ? 'Incoming' : 'Outgoing';
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
  canEdit() {
    return this.authService.canEditNode();
  }
}
