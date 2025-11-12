import { Component, input } from '@angular/core';

import { NgxJsonViewerModule } from 'ngx-json-viewer';

@Component({
  selector: 'app-node-properties',
  templateUrl: './node-properties.component.html',
  styleUrls: ['./node-properties.component.scss'],
  imports: [NgxJsonViewerModule],
})
export class NodePropertiesComponent {
  readonly node = input<any>();

  getNodeProperties(): { key: string; value: any }[] {
    const node = this.node();
    if (!node) return [];
    return Object.entries(node)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => ({ key, value }));
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
