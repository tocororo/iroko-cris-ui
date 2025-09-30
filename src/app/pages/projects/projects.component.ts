// src/app/pages/projects/projects.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class ProjectsComponent {
  projectColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'title',
      label: 'Título',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'creator',
      label: 'Investigador Principal',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'fundingReference',
      label: 'Financiamiento',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'language',
      label: 'Idiomas',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'publisher',
      label: 'Editor',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Proyectos de Investigación',
      description:
        'Explore research projects and initiatives in the knowledge graph',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Project selected:', node);
    // Navigate to project detail or show dialog
  }
}
