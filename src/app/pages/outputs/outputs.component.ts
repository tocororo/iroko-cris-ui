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
      label: 'Título',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'creators',
      label: 'Autores',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'description',
      label: 'Resumen',
      sortable: false,
      filterable: true,
      type: 'string',
    },
    {
      name: 'publication_date',
      label: 'Fecha de Publicación',
      sortable: true,
      filterable: true,
      type: 'date',
    },
    {
      name: 'publisher',
      label: 'Editor',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'types',
      label: 'Tipos de Documento',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'language',
      label: 'Idioma',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'keywords',
      label: 'Palabras Clave',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'source_repo',
      label: 'Repositorio Fuente',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Resultados de Investigación',
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
