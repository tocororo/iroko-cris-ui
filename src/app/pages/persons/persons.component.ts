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
      label: 'Full Name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'last_name',
      label: 'Last Name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'email_addresses',
      label: 'Email Addresses',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'research_interests',
      label: 'Research Interests',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'academic_titles',
      label: 'Academic Titles',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'affiliations',
      label: 'Affiliations',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'gender',
      label: 'Gender',
      sortable: true,
      filterable: true,
      type: 'string',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Researchers',
      description:
        'Explore researchers, scientists, and contributors in the knowledge graph',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Person selected:', node);
    // Navigate to person detail or show dialog
  }
}
