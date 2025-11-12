// src/app/pages/node-view/node-view.component.ts
import { Component, inject, OnInit } from '@angular/core';

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
import { LabelsService } from '../../services/labels.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-node-view',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NodeViewerComponent,
    MatTabsModule,
    NodeEvaluationsComponent,
    MatChipsModule
],
  templateUrl: './node-view.component.html',
  styleUrls: ['./node-view.component.scss'],
})
export class NodeViewComponent implements OnInit {
  nodeType: string = '';
  nodeDisplayType: string = '';
  nodeId: string = '';
  nodeName: string = '';
  node: any = null;
  activeTab = 0;
  private dialog = inject(MatDialog);

  loading = true;

  private routeSub!: Subscription;
  private authService = inject(AuthService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private labelService: LabelsService,
    private metadataService: MetadataService
  ) {}

  ngOnInit() {
    this.labelService.loadData().subscribe((labels) => {
      this.routeSub = this.route.params.subscribe((params) => {
        this.nodeType = labels.nodes[params['type']].label;
        this.nodeId = params['iroko_uuid'];
        this.nodeDisplayType = labels.nodes[params['type']].display;
        this.metadataService.updateMetadata({
          title: `${this.nodeName}`,
          description: `Información sobre el nodo ${this.nodeName} de tipo ${this.nodeDisplayType}`,
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  onNodeLoaded(node: any): void {
    this.nodeName = node.name || node.title || node.iroko_uuid;
    this.node = node;
    this.metadataService.updateMetadata({
      title: `${this.nodeName}`,
      description: `Información sobre el nodo ${this.nodeName} de tipo ${this.nodeType}`,
    });
    this.loading = false;
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
  openEditPage() {
    this.router.navigate(['/edit', this.nodeType, this.nodeId]);
  }
  canEdit(){
    return this.authService.canEditNode();
  }
}
