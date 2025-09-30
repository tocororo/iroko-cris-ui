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
      label: 'Título',
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
      label: 'Tipo de Fuente',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'source_status',
      label: 'Estado',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'repository_status',
      label: 'Estado del Repositorio',
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
      label: 'Año de Inicio',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'end_year',
      label: 'Año de Finalización',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'frequency',
      label: 'Frecuencia',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Fuentes de Datos',
      description:
        'Explora revistas, repositorios y fuentes de datos en el grafos de conocimiento',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Source selected:', node);
    // Navigate to source detail or show dialog
  }
}
