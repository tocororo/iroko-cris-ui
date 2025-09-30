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
      label: 'Término',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'description',
      label: 'Descripción',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'vocabulary',
      label: 'Vocabulario',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'broader_terms',
      label: 'Términos Más Generales',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'narrower_terms',
      label: 'Términos Más Específicos',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'related_terms',
      label: 'Términos Relacionados',
      sortable: false,
      filterable: true,
      type: 'array',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Vocabularios & Terms',
      description:
        'Explore controlled vocabularies, taxonomies, and classification terms',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Vocabulario term selected:', node);
    // Navigate to term detail or show dialog
  }
}
