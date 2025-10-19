import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CypherApiService } from './cypher-api.service';
import { CypherBuilderService } from './cypher-builder.service';

export interface RelatedEntity {
  id: string;
  name: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class RelationshipSearchService {
  constructor(
    private cypherApiService: CypherApiService,
    private cypherBuilder: CypherBuilderService
  ) {}

  searchRelatedEntities(
    entityType: string,
    relationshipConfig: {
      relationshipType: string;
      relationshipDirection: 'IN' | 'OUT';
      targetLabel: string;
      alias?: string;
    },
    searchTerm: string,
    limit: number = 10
  ): Observable<RelatedEntity[]> {
    const query = this.cypherBuilder.buildRelatedEntitiesSearchQuery(
      entityType,
      relationshipConfig,
      searchTerm,
      limit
    );

    return this.cypherApiService
      .executeQuery({
        query: query.query,
        parameters: query.parameters,
        readonly: true,
      })
      .pipe(
        map((result: any[]) => {
          return result.map((item) => {
            const entity = item.related || item;
            return {
              id: entity.elementId,
              name: entity.properties?.name || 'Unnamed',
              ...entity.properties,
            };
          });
        })
      );
  }

  getRelatedEntitiesByIds(
    entityType: string,
    relationshipConfig: {
      relationshipType: string;
      relationshipDirection: 'IN' | 'OUT';
      targetLabel: string;
      alias?: string;
    },
    entityIds: string[]
  ): Observable<RelatedEntity[]> {
    const direction =
      relationshipConfig.relationshipDirection === 'IN' ? '<' : '';
    const arrow = relationshipConfig.relationshipDirection === 'OUT' ? '>' : '';
    const targetLabel = relationshipConfig.targetLabel
      ? `:${relationshipConfig.targetLabel}`
      : '';
    const alias = relationshipConfig.alias || 'related';

    const query = `
      MATCH (n:${entityType})${direction}-[:${relationshipConfig.relationshipType}]-${arrow}(${alias}${targetLabel})
      WHERE ${alias}.elementId IN $entityIds
      RETURN ${alias}
    `;

    return this.cypherApiService
      .executeQuery({
        query,
        parameters: { entityIds },
        readonly: true,
      })
      .pipe(
        map((result: any[]) => {
          return result.map((item) => {
            const entity = item.related || item;
            return {
              id: entity.elementId,
              name: entity.properties?.name || 'Unnamed',
              ...entity.properties,
            };
          });
        })
      );
  }
}
