// src/app/services/label.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RelationshipsLabelService {
  private labels: { [key: string]: string } = {};
  private searchIndices: { [key: string]: string } = {};

  private labelsLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  loadRelData(): Observable<any> {
    return this.http.get('/rels.json').pipe(
      tap((data: any) => {
        this.labels = data.labels;
        this.searchIndices = data.searchIndices;
        this.labelsLoaded.next(true);
      })
    );
  }

  getIndices() {
    return this.searchIndices;
  }

  getLabel(key: string): string {
    return this.labels[key] || key;
  }

  isLoaded(): Observable<boolean> {
    return this.labelsLoaded.asObservable();
  }
}
