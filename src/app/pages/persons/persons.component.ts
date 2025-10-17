// src/app/pages/persons/persons.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  styleUrls: ['./persons.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class PersonsComponent {
  personColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'name',
      label: 'Nombre Completo',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'last_name',
      label: 'Apellido',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'email_addresses',
      label: 'Direcciones de Correo',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'research_interests',
      label: 'Intereses de Investigación',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'academic_titles',
      label: 'Títulos Académicos',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'affiliations',
      label: 'Afiliaciones',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'gender',
      label: 'Género',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Autores',
      description:
        'Investigadores, científicos y colaboradores de diversas instituciones y disciplinas. ',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Person selected:', node);
    // Navigate to person detail or show dialog
  }
}
