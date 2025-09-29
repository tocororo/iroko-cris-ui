// src/app/pages/home/home.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  stats = [
    {
      label: 'Organizations',
      count: '1,234',
      icon: 'corporate_fare',
      route: '/organizations',
      color: 'primary',
    },
    {
      label: 'Researchers',
      count: '8,765',
      icon: 'people',
      route: '/persons',
      color: 'accent',
    },
    {
      label: 'Research Outputs',
      count: '45,678',
      icon: 'article',
      route: '/outputs',
      color: 'warn',
    },
    {
      label: 'Projects',
      count: '2,345',
      icon: 'folder',
      route: '/projects',
      color: 'primary',
    },
    {
      label: 'Data Sources',
      count: '567',
      icon: 'source',
      route: '/sources',
      color: 'accent',
    },
    {
      label: 'Vocabularies',
      count: '89',
      icon: 'tag',
      route: '/vocabs',
      color: 'warn',
    },
  ];

  quickActions = [
    {
      label: 'Advanced Search',
      description: 'Search across all entities',
      icon: 'search',
      route: '/search',
    },
    {
      label: 'Cypher Query',
      description: 'Run custom graph queries',
      icon: 'code',
      route: '/query',
    },
    {
      label: 'Browse Catalog',
      description: 'Explore by categories',
      icon: 'explore',
      route: '/sources',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Iroko Knowledge Graph Explorer',
      description:
        'Explore research data, organizations, and publications in the Cuban research ecosystem',
      authors: [],
      subjects: [],
    });
  }

  ngOnDestroy() {
    this.metadataService.resetMetadata();
  }
}
