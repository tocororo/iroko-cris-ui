// src/app/pages/mes/mes.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  AdvancedQueryOptions,
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-mes',
  templateUrl: './mes.component.html',
  styleUrls: ['./mes.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class MesComponent {
  mesColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'title',
      label: 'Título de la Revista',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'name',
      label: 'Nombre Corto',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'issn',
      label: 'ISSN',
      sortable: false,
      filterable: true,
      type: 'string',
    },
    {
      name: 'rnps',
      label: 'RNPS',
      sortable: false,
      filterable: true,
      type: 'string',
    },
    {
      name: 'seriadas_cubanas',
      label: 'Seriadas Cubanas',
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
      name: 'start_year',
      label: 'Año de Inicio',
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
    {
      name: 'organizations',
      label: 'Organizaciones Editoras',
      sortable: false,
      filterable: true,
      type: 'array',
    },
  ];

  mesAdvancedQuery: AdvancedQueryOptions = {
    customWhereClause:
      "EXISTS((n)-[:SOURCE_CREATED_IN]->(:Organization {id: '11514c12-3d6a-43d0-ba3b-3b992aa96295'}))",
  };

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Revistas MES',
      description: 'Revistas científicas del Ministerio de Educación Superior',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('MES journal selected:', node);
    // Navigate to journal detail or show dialog
  }
}
