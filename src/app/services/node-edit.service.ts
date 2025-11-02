// src/app/services/node-edit.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  NodePropertyUpdate,
  RelationshipUpdate,
  RelationshipDeleteRequest,
  NodeEditRequest,
  EditResponse,
  ExistingRelationship,
} from '../api/models/node-edit.model';

@Injectable({
  providedIn: 'root',
})
export class NodeEditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/${environment.apiVersion}`;

  // Update node properties
  updateNodeProperties(update: NodePropertyUpdate): Observable<EditResponse> {
    return this.http.patch<EditResponse>(
      `${this.apiUrl}/cypher/edit/node/properties`,
      update
    );
  }

  // Create or update relationship
  createOrUpdateRelationship(
    relationship: RelationshipUpdate
  ): Observable<EditResponse> {
    return this.http.post<EditResponse>(
      `${this.apiUrl}/cypher/edit/relationships`,
      relationship
    );
  }

  // Delete relationship
  deleteRelationship(
    relationship: RelationshipDeleteRequest
  ): Observable<EditResponse> {
    return this.http.delete<EditResponse>(
      `${this.apiUrl}/cypher/edit/relationships`,
      { body: relationship }
    );
  }

  // Full node edit (properties + relationships)
  fullNodeEdit(editRequest: NodeEditRequest): Observable<EditResponse> {
    return this.http.put<EditResponse>(
      `${this.apiUrl}/cypher/edit/node/full`,
      editRequest
    );
  }

  // Get existing relationships for a node
  getNodeRelationships(nodeId: string): Observable<ExistingRelationship[]> {
    const query = {
      query: `
          MATCH (n {iroko_uuid: $nodeId})
          OPTIONAL MATCH (n)-[r_out]->(related_out)
          OPTIONAL MATCH (n)<-[r_in]-(related_in)
          RETURN
            collect({
              relationship: properties(r_out),
              relatedNode: properties(related_out),
              direction: 'OUTGOING',
              type: type(r_out)
            }) as outgoing,
            collect({
              relationship: properties(r_in),
              relatedNode: properties(related_in),
              direction: 'INCOMING',
              type: type(r_in)
            }) as incoming
        `,
      parameters: { nodeId },
      readonly: true,
    };

    return this.http.post<any[]>(`${this.apiUrl}/cypher/query`, query).pipe(
      map((result: any) => {
        const outgoing = result[0]?.outgoing || [];
        const incoming = result[0]?.incoming || [];
        return [...outgoing, ...incoming].filter(
          (rel) => rel.relationship && rel.relatedNode
        );
      })
    );
  }
}
