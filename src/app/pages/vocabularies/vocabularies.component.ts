// src/app/pages/vocabularies/vocabularies.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-vocabularies',
  templateUrl: './vocabularies.component.html',
  styleUrls: ['./vocabularies.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class VocabulariesComponent {
  vocabularyColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'name',
      label: 'Term',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'description',
      label: 'Description',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'vocabulary',
      label: 'Vocabulary',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'broader_terms',
      label: 'Broader Terms',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'narrower_terms',
      label: 'Narrower Terms',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'related_terms',
      label: 'Related Terms',
      sortable: false,
      filterable: true,
      type: 'array',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Vocabularies & Terms',
      description:
        'Explore controlled vocabularies, taxonomies, and classification terms',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Vocabulary term selected:', node);
    // Navigate to term detail or show dialog
  }
}
