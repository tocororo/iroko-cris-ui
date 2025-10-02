// src/app/pages/organizations/organizations.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
  ListFilter,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class OrganizationsComponent {
  organizationColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
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
      name: 'organizationType',
      label: 'Tipos',
      sortable: true,
      filterable: true,
      type: 'array',
    },
    {
      name: 'status',
      label: 'Estado',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'acronyms',
      label: 'Siglas',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'established',
      label: 'Fundado',
      sortable: true,
      filterable: false,
      type: 'date',
    },
  ];

  organizationFilters: ListFilter[] = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Filtrar por nombre...',
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: ['active', 'inactive', 'pending'],
    },
    {
      name: 'organizationType',
      label: 'Tipo de Organización',
      type: 'multiselect',
      options: [
        'Education',
        'Healthcare',
        'Company',
        'Nonprofit',
        'Government',
      ],
    },
    {
      name: 'established',
      label: 'Año de Fundación',
      type: 'date',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Organizaciones',
      description: 'Explore organizations in the knowledge graph',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Organization selected:', node);
  }
}
