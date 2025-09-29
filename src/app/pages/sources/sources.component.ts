// src/app/pages/sources/sources.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-sources',
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class SourcesComponent {
  sourceColumns: ListColumn[] = [
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
      name: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'source_type',
      label: 'Source Type',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'source_status',
      label: 'Status',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'repository_status',
      label: 'Repository Status',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'url',
      label: 'URLs',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'start_year',
      label: 'Start Year',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'end_year',
      label: 'End Year',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'frequency',
      label: 'Frequency',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Data Sources',
      description:
        'Explore journals, repositories, and data sources in the knowledge graph',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Source selected:', node);
    // Navigate to source detail or show dialog
  }
}
