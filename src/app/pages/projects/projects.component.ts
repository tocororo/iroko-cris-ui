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
      label: 'Title',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'creator',
      label: 'Principal Investigator',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'fundingReference',
      label: 'Funding',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'language',
      label: 'Languages',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'publisher',
      label: 'Publisher',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Research Projects',
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
