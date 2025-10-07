// src/app/pages/node-view/node-view.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { MetadataService } from '../../services/metadata.service';
import { EnhancedNodeViewerComponent } from '../../components/enhanced-node-viewer/enhanced-node-viewer.component';
import { NodeEvaluationsComponent } from '../../components/node-evaluations/node-evaluations.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-node-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EnhancedNodeViewerComponent,
    MatTabsModule,
    NodeEvaluationsComponent,
  ],
  templateUrl: './node-view.component.html',
  styleUrls: ['./node-view.component.scss'],
})
export class NodeViewComponent implements OnInit {
  nodeType: string = '';
  nodeId: string = '';
  activeTab = 0;

  private routeSub!: Subscription;

  // Map entity types to display names
  private nodeTypes: { [key: string]: string } = {
    organization: 'Organization',
    person: 'Person',
    source: 'Source',
    project: 'Project',
    output: 'Output',
    term: 'Término',
  };

  // Map entity types to display names
  private typeDisplayNames: { [key: string]: string } = {
    Organization: 'Organización',
    Person: 'Investigador',
    Source: 'Fuente',
    Project: 'Proyecto',
    Output: 'Resultado de Investigación',
    Term: 'Término',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private metadataService: MetadataService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.params.subscribe((params) => {
      this.nodeType = this.nodeTypes[params['type']];
      this.nodeId = params['id'];

      const displayName = this.typeDisplayNames[this.nodeType] || this.nodeType;
      this.metadataService.updateMetadata({
        title: `Detalles de ${displayName}`,
        description: `Ver detalles de ${displayName.toLowerCase()}`,
      });
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  goBack() {
    const listRoute = this.getListRoute();
    this.router.navigate([listRoute]);
  }

  private getListRoute(): string {
    const routeMap: { [key: string]: string } = {
      Organization: '/organizations',
      Person: '/persons',
      Source: '/sources',
      Project: '/projects',
      Output: '/outputs',
      Término: '/vocabularies',
    };
    return routeMap[this.nodeType] || '/';
  }

  getBreadcrumbLabel(): string {
    return this.typeDisplayNames[this.nodeType] || this.nodeType;
  }

  onNodeLoaded(node: any): void {
    const displayName = node.name || node.title || node.id;
    this.metadataService.updateMetadata({
      title: `Detalles de ${displayName}`,
      description: `Información sobre el nodo ${displayName} de tipo ${this.nodeType}`,
    });
  }

  onRelatedNodeSelect(nodeData: any): void {
    console.log('NodeViewComponent - Related node selected:', nodeData);
  }
}
