// src/app/services/label.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface ListColumn {
  name: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'string' | 'number' | 'date' | 'array';
}

export interface LabelsData {
  nodes: {
    [key: string]: {
      label: string;
      display: string;
      properties: ListColumn[];
    };
  };
  relationships: { [key: string]: string };
  searchIndices: { [key: string]: string };
}

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  private labelsData: LabelsData = {
    nodes: {},
    relationships: {},
    searchIndices: {},
  };

  private labelsLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  loadData(): Observable<LabelsData> {
    return this.http.get('/labels.json').pipe(
      tap((data: any) => {
        this.labelsData.nodes = data.nodes;
        this.labelsData.relationships = data.relationships;
        this.labelsData.searchIndices = data.searchIndices;
        this.labelsLoaded.next(true);
      })
    );
  }
  getLabelsData() {
    return this.labelsData;
  }
  getIndices() {
    return this.labelsData.searchIndices;
  }

  getRelationshipLabel(key: string): string {
    return this.labelsData.relationships[key] || key;
  }

  getNodeByPath(path: string) {
    return this.labelsData.nodes[path];
  }

  isLoaded(): Observable<boolean> {
    return this.labelsLoaded.asObservable();
  }
}
