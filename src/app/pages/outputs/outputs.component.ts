// src/app/pages/outputs/outputs.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-outputs',
  templateUrl: './outputs.component.html',
  styleUrls: ['./outputs.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class OutputsComponent {
  outputColumns: ListColumn[] = [
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
      name: 'creators',
      label: 'Authors',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'description',
      label: 'Abstract',
      sortable: false,
      filterable: true,
      type: 'string',
    },
    {
      name: 'publication_date',
      label: 'Publication Date',
      sortable: true,
      filterable: true,
      type: 'date',
    },
    {
      name: 'publisher',
      label: 'Publisher',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'types',
      label: 'Document Types',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'language',
      label: 'Language',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'keywords',
      label: 'Keywords',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'source_repo',
      label: 'Source Repository',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Research Outputs',
      description:
        'Explore research publications, articles, and scientific outputs in the knowledge graph',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Output selected:', node);
    // Navigate to output detail or show dialog
  }
}
