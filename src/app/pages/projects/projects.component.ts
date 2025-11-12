// src/app/pages/projects/projects.component.ts
import { Component, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { GenericListComponent } from '../../components/generic-list/generic-list.component';
import { LabelsService, ListColumn } from '../../services/labels.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  imports: [GenericListComponent, RouterModule],
})
export class ProjectsComponent {
  private metadataService = inject(MetadataService);
  private labelService = inject(LabelsService);

  projectColumns: ListColumn[] = [];
  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Proyectos de Investigación',
      description:
        'Explore research projects and initiatives in the knowledge graph',
      authors: [],
      subjects: [],
    });

    this.labelService.loadData().subscribe((labels) => {
      this.projectColumns = labels.nodes['project'].properties;
    });
  }

  onNodeSelected(node: any) {
    console.log('Project selected:', node);
    // Navigate to project detail or show dialog
  }
}
