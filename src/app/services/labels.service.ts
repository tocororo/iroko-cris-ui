// src/app/services/label.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LabelsData } from '../models/list.model';

export type {
  ListColumn,
  DisplayItem,
  FilterValue,
  LabelsData,
  ListFilter,
  RelationshipFilterConfig,
  RelationshipAttributeConfig,
} from '../models/list.model';

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  private http = inject(HttpClient);

  private labelsData: LabelsData = {
    nodes: {},
    relationshipsAsTabs: {},
    relationshipsAsProp: {},
    searchIndices: {},
  };

  private labelsLoaded = new BehaviorSubject<boolean>(false);

  loadData(): Observable<LabelsData> {
    return this.http.get('/labels.json').pipe(
      tap((data: any) => {
        this.labelsData.nodes = data.nodes;
        this.labelsData.relationshipsAsTabs = data.relationshipsAsTabs;
        this.labelsData.relationshipsAsProp = data.relationshipsAsProp;
        this.labelsData.searchIndices = data.searchIndices;
        this.labelsLoaded.next(true);
      }),
    );
  }
  getLabelsData() {
    return this.labelsData;
  }
  getIndices() {
    return this.labelsData.searchIndices;
  }

  getRelationshipLabel(key: string): string {
    return (
      this.labelsData.relationshipsAsTabs[key] ||
      this.labelsData.relationshipsAsProp[key] ||
      key
    );
  }

  getNodeByPath(path: string) {
    return this.labelsData.nodes[path];
  }

  isLoaded(): Observable<boolean> {
    return this.labelsLoaded.asObservable();
  }
}
