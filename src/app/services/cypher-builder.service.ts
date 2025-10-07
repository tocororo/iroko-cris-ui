// src/app/api/services/cypher-builder.service.ts
import { Injectable } from '@angular/core';
import { FullTextCypherQuery } from '../api/models/cypher-query.model';

export interface QueryFilter {
  property: string;
  operator: '=' | 'CONTAINS' | 'STARTS WITH' | 'ENDS WITH' | '>' | '<' | '>=';
  value: any;
}

export interface QueryOptions {
  labels?: string[];
  properties?: string[];
  filters?: QueryFilter[];
  limit?: number;
  skip?: number;
  orderBy?: { property: string; direction: 'ASC' | 'DESC' };
  relationships?: { type: string; direction: 'IN' | 'OUT' }[];
}

@Injectable({
  providedIn: 'root',
})
export class CypherBuilderService {
  buildListQuery(options: QueryOptions): { query: string; parameters: any } {
    const params: any = {};
    const labels = options.labels?.join(':') || '';
    const alias = 'n';

    let query = `MATCH (${alias}${labels ? ':' + labels : ''})`;

    // Add WHERE clauses for filters
    const whereClauses: string[] = [];
    options.filters?.forEach((filter, index) => {
      const paramName = `param${index}`;
      params[paramName] = filter.value;

      switch (filter.operator) {
        case 'CONTAINS':
          whereClauses.push(
            `toLower(${alias}.${filter.property}) CONTAINS toLower($${paramName})`
          );
          break;
        case 'STARTS WITH':
          whereClauses.push(
            `toLower(${alias}.${filter.property}) STARTS WITH toLower($${paramName})`
          );
          break;
        case 'ENDS WITH':
          whereClauses.push(
            `toLower(${alias}.${filter.property}) ENDS WITH toLower($${paramName})`
          );
          break;
        default:
          whereClauses.push(
            `${alias}.${filter.property} ${filter.operator} $${paramName}`
          );
      }
    });

    if (whereClauses.length > 0) {
      query += `\nWHERE ${whereClauses.join(' AND ')}`;
    }

    // RETURN clause
    const returnProps = options.properties?.length
      ? options.properties.map((prop) => `${alias}.${prop}`).join(', ')
      : `${alias}`;

    query += `\nRETURN ${returnProps}`;

    // ORDER BY
    if (options.orderBy) {
      query += `\nORDER BY ${alias}.${options.orderBy.property} ${options.orderBy.direction}`;
    }

    // SKIP and LIMIT
    if (options.skip) {
      query += `\nSKIP ${options.skip}`;
    }

    if (options.limit) {
      query += `\nLIMIT ${options.limit}`;
    }

    return { query, parameters: params };
  }

  buildNodeQuery(
    nodeId: string,
    labels?: string[]
  ): { query: string; parameters: any } {
    const labelString = labels?.join(':') || '';
    const alias = 'n';

    const query = `
      MATCH (${alias}${labelString ? ':' + labelString : ''} {id: $id})
      OPTIONAL MATCH (${alias})-[r]-(related)
      RETURN ${alias}, type(r) as relationshipType, collect(related) as relatedNodes
    `;

    return {
      query,
      parameters: { id: nodeId },
    };
  }

  buildRelationshipQuery(
    nodeId: string,
    relationshipType?: string
  ): { query: string; parameters: any } {
    let query = `
      MATCH (n {id: $id})-[r${
        relationshipType ? ':' + relationshipType : ''
      }]-(related)
      RETURN type(r) as relationshipType, r, properties(r) as relationProperties, related
      ORDER BY relationshipType
    `;

    return {
      query,
      parameters: { id: nodeId },
    };
  }
  buildSearchQuery(
    entityType: string,
    searchTerm: string,
    searchableColumns: string[]
  ): { query: string; parameters: any } {
    if (!searchTerm || searchableColumns.length === 0) {
      return {
        query: `MATCH (n:${entityType}) RETURN n`,
        parameters: {},
      };
    }

    const searchConditions = searchableColumns
      .map(
        (col) =>
          `toLower(COALESCE(toString(n.${col}), '')) CONTAINS toLower($searchTerm)`
      )
      .join(' OR ');

    const query = `
      MATCH (n:${entityType})
      WHERE ${searchConditions}
      RETURN n
    `;

    return {
      query,
      parameters: { searchTerm },
    };
  }

  buildNodeWithRelationshipsQuery(
    nodeId: string,
    labels?: string[]
  ): { query: string; parameters: any } {
    const labelString = labels?.join(':') || '';
    const alias = 'n';

    const query = `
      MATCH (${alias}${labelString ? ':' + labelString : ''} {id: $id})
      OPTIONAL MATCH (${alias})-[r]-(related)
      RETURN ${alias},
             type(r) as relationshipType,
             r,
             related,
             properties(r) as relationProperties,
             labels(related) as relatedLabels,
             startNode(r) = ${alias} as isOutgoing
      ORDER BY type(r), related.name
    `;

    return {
      query,
      parameters: { id: nodeId },
    };
  }

  buildRelationshipCountQuery(
    nodeId: string,
    relationshipType: string,
    direction: 'INCOMING' | 'OUTGOING',
    labels?: string[]
  ): { query: string; parameters: any } {
    const labelString = labels?.join(':') || '';
    const alias = 'n';

    let matchClause = '';
    if (direction === 'OUTGOING') {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})<-[r:${relationshipType}]-(related)`;
    }

    const query = `
      ${matchClause}
      RETURN count(related) as count
    `;

    return {
      query,
      parameters: { id: nodeId },
    };
  }

  buildPaginatedRelationshipsQuery(
    nodeId: string,
    relationshipType: string,
    direction: 'INCOMING' | 'OUTGOING',
    labels?: string[],
    page: number = 0,
    pageSize: number = 10
  ): { query: string; parameters: any } {
    const labelString = labels?.join(':') || '';
    const alias = 'n';

    let matchClause = '';
    if (direction === 'OUTGOING') {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})<-[r:${relationshipType}]-(related)`;
    }

    const query = `
      ${matchClause}
      RETURN related, r, properties(r) as relationProperties, labels(related) as relatedLabels
      ORDER BY related.name, related.id
      SKIP $skip
      LIMIT $limit
    `;

    return {
      query,
      parameters: {
        id: nodeId,
        skip: page * pageSize,
        limit: pageSize,
      },
    };
  }

  buildPaginatedRelationshipsQueryWithSearch(
    nodeId: string,
    relationshipType: string,
    searchIndex: string,
    searchTerm: string,
    direction: 'INCOMING' | 'OUTGOING',
    labels?: string[],
    page: number = 0,
    pageSize: number = 10
  ): FullTextCypherQuery {
    const labelString = labels?.join(':') || '';
    const alias = 'nrel';

    let matchClause = '';
    if (direction === 'OUTGOING') {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})<-[r:${relationshipType}]-(related)`;
    }

    // let query = '';

    // if (searchIndex && searchTerm) {
    //   // Use full-text search
    //   query = `
    //     CALL db.index.fulltext.queryNodes("${searchIndex}", $searchTerm)
    //     YIELD node, score
    //     WITH node, score
    //     ${matchClause}
    //     WHERE node = related
    //     RETURN related, r,properties(r) as relationProperties, labels(related) as relatedLabels, score
    //     ORDER BY score DESC, related.name
    //     SKIP $skip
    //     LIMIT $limit
    //   `;
    // } else {
    //   // Regular query
    //   query = `
    //     ${matchClause}
    //     RETURN related, r, labels(related) as relatedLabels
    //     ORDER BY related.name, related.id
    //     SKIP $skip
    //     LIMIT $limit
    //   `;
    // }
    let whereClause = `${matchClause} WHERE n = related`;
    let returnClause =
      'RETURN related, r,properties(r) as relationProperties, labels(related) as relatedLabels, score';
    let orderClause = 'ORDER BY score DESC, related.name';
    const parameters: any = {
      id: nodeId,
      skip: page * pageSize,
      limit: pageSize,
    };

    if (searchTerm) {
      parameters.searchTerm = `${searchTerm}*`; // Add wildcard for partial matching
    }

    return {
      searchIndex,
      searchTerm,
      whereClause,
      returnClause,
      orderClause,
      parameters,
    };
  }

  buildRelationshipCountQueryWithSearch(
    nodeId: string,
    relationshipType: string,
    searchIndex: string,
    searchTerm: string,
    direction: 'INCOMING' | 'OUTGOING',
    labels?: string[]
  ): FullTextCypherQuery {
    const labelString = labels?.join(':') || '';
    const alias = 'nrel';

    let matchClause = '';
    if (direction === 'OUTGOING') {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {id: $id})<-[r:${relationshipType}]-(related)`;
    }

    // let query = '';

    // if (searchIndex && searchTerm) {
    //   query = `
    //     CALL db.index.fulltext.queryNodes("${searchIndex}", $searchTerm)
    //     YIELD node, score
    //     WITH node, score
    //     ${matchClause}
    //     WHERE node = related
    //     RETURN count(node) as count
    //   `;
    // } else {
    //   query = `
    //     ${matchClause}
    //     RETURN count(related) as count
    //   `;
    // }

    let whereClause = `${matchClause} WHERE n = related`;
    let returnClause =
      'RETURN related, r,properties(r) as relationProperties, labels(related) as relatedLabels, score';
    let orderClause = 'ORDER BY score DESC, related.name';

    const parameters: any = { id: nodeId };

    if (searchTerm) {
      parameters.searchTerm = `${searchTerm}*`;
    }
    let countTotal = true;

    return {
      searchIndex,
      searchTerm,
      whereClause,
      returnClause,
      orderClause,
      parameters,
      countTotal,
    };
  }
}
