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
      MATCH (${alias}${
      labelString ? ':' + labelString : ''
    } {iroko_uuid: $iroko_uuid})
      OPTIONAL MATCH (${alias})-[r]-(related)
      RETURN ${alias}, type(r) as relationshipType, collect(related) as relatedNodes
    `;

    return {
      query,
      parameters: { iroko_uuid: nodeId },
    };
  }

  buildRelationshipQuery(
    nodeId: string,
    relationshipType?: string
  ): { query: string; parameters: any } {
    let query = `
      MATCH (n {iroko_uuid: $iroko_uuid})-[r${
        relationshipType ? ':' + relationshipType : ''
      }]-(related)
      RETURN type(r) as relationshipType, r, properties(r) as relationProperties, related
      ORDER BY relationshipType
    `;

    return {
      query,
      parameters: { iroko_uuid: nodeId },
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
      MATCH (${alias}${
      labelString ? ':' + labelString : ''
    } {iroko_uuid: $iroko_uuid})
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
      parameters: { iroko_uuid: nodeId },
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
      } {iroko_uuid: $iroko_uuid})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {iroko_uuid: $iroko_uuid})<-[r:${relationshipType}]-(related)`;
    }

    const query = `
      ${matchClause}
      RETURN count(related) as count
    `;

    return {
      query,
      parameters: { iroko_uuid: nodeId },
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
      } {iroko_uuid: $iroko_uuid})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {iroko_uuid: $iroko_uuid})<-[r:${relationshipType}]-(related)`;
    }

    const query = `
      ${matchClause}
      RETURN related, r, properties(r) as relationProperties, labels(related) as relatedLabels
      ORDER BY related.name, related.iroko_uuid
      SKIP $skip
      LIMIT $limit
    `;

    return {
      query,
      parameters: {
        iroko_uuid: nodeId,
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
      } {iroko_uuid: $iroko_uuid})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {iroko_uuid: $iroko_uuid})<-[r:${relationshipType}]-(related)`;
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
    //     ORDER BY related.name, related.iroko_uuid
    //     SKIP $skip
    //     LIMIT $limit
    //   `;
    // }
    let whereClause = `${matchClause} WHERE n = related`;
    let returnClause =
      'RETURN related, r,properties(r) as relationProperties, labels(related) as relatedLabels, score';
    let orderClause = 'ORDER BY score DESC, related.name';
    const parameters: any = {
      iroko_uuid: nodeId,
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
      } {iroko_uuid: $iroko_uuid})-[r:${relationshipType}]->(related)`;
    } else {
      matchClause = `MATCH (${alias}${
        labelString ? ':' + labelString : ''
      } {iroko_uuid: $iroko_uuid})<-[r:${relationshipType}]-(related)`;
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

    const parameters: any = { iroko_uuid: nodeId };

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

  /**
   * Builds a paginated relationships query with regular search (toLower + CONTAINS)
   * @param nodeId The ID of the main node
   * @param relationshipType The type of relationship to follow
   * @param searchTerm The search term to filter related nodes
   * @param direction The direction of the relationship
   * @param nodeLabels The labels of the main node
   * @param page The page number (0-based)
   * @param pageSize The number of items per page
   * @param searchProperties The properties to search in (defaults to common properties)
   * @returns CypherQuery object
   */
  buildPaginatedRelationshipsQueryWithRegularSearch(
    nodeId: string,
    relationshipType: string,
    searchTerm: string,
    direction: 'INCOMING' | 'OUTGOING',
    nodeLabels: string[] = [],
    page: number = 0,
    pageSize: number = 10,
    searchProperties: string[] = ['name', 'description', 'iroko_uuid']
  ): { query: string; parameters: any } {
    const skip = page * pageSize;
    const limit = pageSize;

    // Build the main node match with labels
    const mainNodeLabelClause =
      nodeLabels.length > 0 ? `:${nodeLabels.join(':')}` : '';

    // Build relationship pattern based on direction
    let relationshipPattern: string;
    if (direction === 'OUTGOING') {
      relationshipPattern = `(n)-[r:${relationshipType}]->(related)`;
    } else {
      relationshipPattern = `(n)<-[r:${relationshipType}]-(related)`;
    }

    // Build search conditions for each property
    const searchConditions = searchProperties
      .map(
        (prop) =>
          `toLower(COALESCE(toString(related.${prop}), '')) CONTAINS toLower($searchTerm)`
      )
      .join(' OR ');

    const searchWhereClause = searchConditions
      ? `WHERE ${searchConditions}`
      : '';

    const query = `
    MATCH (n${mainNodeLabelClause} {iroko_uuid: $nodeId})
    MATCH ${relationshipPattern}
    ${searchWhereClause}
    RETURN related, r, labels(related) as relatedLabels, type(r) as relationshipType,
           startNode(r) = n as isOutgoing, properties(r) as relationProperties
    ORDER BY related.name, related.title, related.iroko_uuid
    SKIP $skip
    LIMIT $limit
  `;

    return {
      query: query.trim(),
      parameters: {
        nodeId,
        searchTerm,
        skip,
        limit,
      },
    };
  }

  /**
   * Builds a count query for relationships with regular search
   * @param nodeId The ID of the main node
   * @param relationshipType The type of relationship to follow
   * @param searchTerm The search term to filter related nodes
   * @param direction The direction of the relationship
   * @param nodeLabels The labels of the main node
   * @param searchProperties The properties to search in
   * @returns CypherQuery object
   */
  buildRelationshipCountQueryWithRegularSearch(
    nodeId: string,
    relationshipType: string,
    searchTerm: string,
    direction: 'INCOMING' | 'OUTGOING',
    nodeLabels: string[] = [],
    searchProperties: string[] = ['name', 'description', 'iroko_uuid']
  ): { query: string; parameters: any } {
    // Build the main node match with labels
    const mainNodeLabelClause =
      nodeLabels.length > 0 ? `:${nodeLabels.join(':')}` : '';

    // Build relationship pattern based on direction
    let relationshipPattern: string;
    if (direction === 'OUTGOING') {
      relationshipPattern = `(n)-[r:${relationshipType}]->(related)`;
    } else {
      relationshipPattern = `(n)<-[r:${relationshipType}]-(related)`;
    }

    // Build search conditions for each property
    const searchConditions = searchProperties
      .map(
        (prop) =>
          `toLower(COALESCE(toString(related.${prop}), '')) CONTAINS toLower($searchTerm)`
      )
      .join(' OR ');

    const searchWhereClause = searchConditions
      ? `WHERE ${searchConditions}`
      : '';

    const query = `
    MATCH (n${mainNodeLabelClause} {iroko_uuid: $nodeId})
    MATCH ${relationshipPattern}
    ${searchWhereClause}
    RETURN count(related) as count
  `;

    return {
      query: query.trim(),
      parameters: {
        nodeId,
        searchTerm,
      },
    };
  }

  buildRelatedEntitiesSearchQuery(
    entityType: string,
    relationshipConfig: {
      relationshipType: string;
      relationshipDirection: 'IN' | 'OUT';
      targetLabel: string;
      alias?: string;
    },
    searchTerm: string,
    limit: number = 10
  ): { query: string; parameters: any } {
    const direction =
      relationshipConfig.relationshipDirection === 'IN' ? '<' : '';
    const arrow = relationshipConfig.relationshipDirection === 'OUT' ? '>' : '';
    const targetLabel = relationshipConfig.targetLabel
      ? `:${relationshipConfig.targetLabel}`
      : '';
    const alias = relationshipConfig.alias || 'related';

    const query = `
      MATCH (n:${entityType})${direction}-[:${relationshipConfig.relationshipType}]-${arrow}(${alias}${targetLabel})
      WHERE toLower(${alias}.name) CONTAINS toLower($searchTerm)
      RETURN ${alias}
      ORDER BY ${alias}.name
      LIMIT $limit
    `;

    return {
      query,
      parameters: {
        searchTerm,
        limit,
      },
    };
  }
}
