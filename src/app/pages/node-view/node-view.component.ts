// src/app/pages/node-view/node-view.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { MetadataService } from '../../services/metadata.service';
import { NodeViewerComponent } from '../../components/node-viewer/node-viewer.component';
import { NodeEvaluationsComponent } from '../../components/node-evaluations/node-evaluations.component';
import { Subscription } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { EvaluationSelectionDialogComponent } from '../../components/evaluation-selection-dialog/evaluation-selection-dialog.component';

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
    NodeViewerComponent,
    MatTabsModule,
    NodeEvaluationsComponent,
    MatChipsModule,
  ],
  templateUrl: './node-view.component.html',
  styleUrls: ['./node-view.component.scss'],
})
export class NodeViewComponent implements OnInit {
  nodeType: string = '';
  nodeId: string = '';
  nodeName: string = '';
  node: any = null;
  activeTab = 0;
  private dialog = inject(MatDialog);

  private routeSub!: Subscription;

  // Map entity types to display names
  private nodeTypes: { [key: string]: string } = {
    organization: 'Organization',
    person: 'Person',
    author: 'Autor',
    source: 'Source',
    project: 'Project',
    output: 'Output',
    term: 'Term',
    subject: 'Subject',
    index: 'Index',
    licence: 'Licence',
  };

  // Map entity types to display names
  private typeDisplayNames: { [key: string]: string } = {
    Organization: 'Organización',
    Person: 'Investigador',
    Author: 'Autor',
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
        title: `${displayName}`,
        description: `Información sobre el nodo ${this.nodeName} de tipo ${this.nodeType}`,
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
    this.nodeName = node.name || node.title || node.id;
    this.node = node;
    this.metadataService.updateMetadata({
      title: `${this.nodeName}`,
      description: `Información sobre el nodo ${this.nodeName} de tipo ${this.nodeType}`,
    });
  }

  onRelatedNodeSelect(nodeData: any): void {
    console.log('NodeViewComponent - Related node selected:', nodeData);
  }

  openEvaluationSelection() {
    const dialogRef = this.dialog.open(EvaluationSelectionDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        nodeId: this.nodeId,
        nodeType: this.nodeType,
        nodeData: this.node,
      },
    });

    // Optional: Handle dialog close if needed
    dialogRef.afterClosed().subscribe((result) => {
      console.log('Evaluation selection dialog closed', result);
    });
  }
}
