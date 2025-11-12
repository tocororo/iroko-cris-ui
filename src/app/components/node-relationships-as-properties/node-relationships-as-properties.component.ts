import { Component, input } from '@angular/core';
import { RelationshipGroup } from '../../api/models/relationship.models';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-node-relationships-as-properties',
  imports: [NgxJsonViewerModule, MatCardModule],
  templateUrl: './node-relationships-as-properties.component.html',
  styleUrl: './node-relationships-as-properties.component.scss',
})
export class NodeRelationshipsAsPropertiesComponent {
  readonly group = input.required<RelationshipGroup>();

  getDisplayedRelationships(group: RelationshipGroup) {
    return group.relationships;
  }
  getNodeProperties(node: any): { key: string; value: any }[] {
    if (!node) return [];
    const excludeKeywords = ['iroko_uuid', 'vocabulary'];

    return Object.entries(node)
      .filter(([key]) => !key.startsWith('_'))
      .filter(([key]) => !excludeKeywords.includes(key.toLowerCase()))
      .map(([key, value]) => ({ key, value }));
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
