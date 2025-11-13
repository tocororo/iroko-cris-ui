// src/app/api/services/cypher-builder.service.ts
import { Injectable } from '@angular/core';
import { FullTextCypherQuery } from '../api/models/cypher-query.model';
import { ListFilter } from './labels.service';

export interface QueryOptions {
  labels?: string[];
  properties?: string[];
  filters?: QueryFilter[];
  limit?: number;
  skip?: number;
  orderBy?: { property: string; direction: 'ASC' | 'DESC' };
  relationships?: { type: string; direction: 'IN' | 'OUT' }[];
}

export interface QueryFilter {
  property: string;
  operator: '=' | 'CONTAINS' | 'STARTS WITH' | 'ENDS WITH' | '>' | '<' | '>=';
  value: any;
}

export interface SortOption {
  attribute: string;
  direction: 'ASC' | 'DESC';
}

export interface AdvancedQueryOptions {
  customWhereClause?: string;
  customParameters?: { [key: string]: any };
  relationships?: {
    type: string;
    direction?: 'IN' | 'OUT';
    targetLabel?: string;
    alias?: string;
  }[];
  customReturn?: string;
}

export interface RelationshipExportOptions {
  nodeId: string;
  nodeType: string;
  relationshipType: string;
  direction: 'INCOMING' | 'OUTGOING';
  searchTerm?: string;
  searchIndex?: string;
}

export interface GenericListQueryOptions {
  entityType: string;
  fixedFilters: QueryFilter[];
  activeFilters: { [key: string]: any };
  filterDefinitions: ListFilter[];
  customWhereClause?: string;
  customParameters?: { [key: string]: any }; // Changed to object/map
  advancedQueryOptions?: AdvancedQueryOptions;
  sortBy?: SortOption;
  offset?: number;
  limit?: number;
  isCount?: boolean;
  forExport?: boolean;
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

  buildGenericListQuery(options: GenericListQueryOptions): {
    query: string;
    parameters: any;
  } {
    const baseWhereClause = this.buildWhereClause(options);
    const orderClause = options.isCount ? '' : this.buildOrderClause(options);
    const returnClause = options.isCount
      ? 'RETURN count(n) AS count'
      : this.buildReturnClause(options);
    const paginationClause =
      options.isCount || options.forExport ? '' : `SKIP $offset LIMIT $limit`;

    // Build relationship patterns and conditions ONLY if there are active relationship filters
    const { relationshipMatches, relationshipConditions } =
      this.buildRelationshipFilters(options);

    // Combine all conditions
    const allConditions: string[] = [];

    // Add base WHERE conditions (excluding relationship placeholder conditions)
    const baseConditions = baseWhereClause.replace('WHERE ', '').trim();
    if (baseConditions) {
      allConditions.push(baseConditions);
    }

    // Add relationship conditions if any
    if (relationshipConditions.length > 0) {
      allConditions.push(...relationshipConditions);
    }

    const finalWhereClause =
      allConditions.length > 0 ? `WHERE ${allConditions.join(' AND ')}` : '';

    const query = `
      MATCH (n:${options.entityType})
      ${relationshipMatches}
      ${finalWhereClause}
      ${returnClause}
      ${orderClause}
      ${paginationClause}
    `.trim();

    const parameters = {
      ...this.buildParameters(options),
      ...this.buildRelationshipFilterParameters(options),
    };

    if (!options.isCount && !options.forExport) {
      parameters.offset = options.offset || 0;
      parameters.limit = options.limit || 10;
    }

    return { query, parameters };
  }

  private buildWhereClause(options: GenericListQueryOptions): string {
    const conditions: string[] = [];

    // Fixed filters
    if (options.fixedFilters.length > 0) {
      options.fixedFilters.forEach((filter, index) => {
        const paramName = `fixedFilter${index}`;
        switch (filter.operator) {
          case 'CONTAINS':
            conditions.push(
              `toLower(n.${filter.property}) CONTAINS toLower($${paramName})`
            );
            break;
          case 'STARTS WITH':
            conditions.push(
              `toLower(n.${filter.property}) STARTS WITH toLower($${paramName})`
            );
            break;
          case 'ENDS WITH':
            conditions.push(
              `toLower(n.${filter.property}) ENDS WITH toLower($${paramName})`
            );
            break;
          default:
            conditions.push(
              `n.${filter.property} ${filter.operator} $${paramName}`
            );
        }
      });
    }

    // Custom filters from filter form (EXCLUDE relationship filters)
    Object.keys(options.activeFilters).forEach((filterName, index) => {
      const filterValue = options.activeFilters[filterName];
      const paramName = `filter${index}`;
      const filterDef = options.filterDefinitions.find(
        (f) => f.name === filterName
      );

      // Skip relationship filters - they are handled separately
      if (filterDef?.type === 'relationship') {
        return;
      }

      // Skip empty values
      if (Array.isArray(filterValue) && filterValue.length === 0) {
        return;
      }

      if (
        filterValue === '' ||
        filterValue === null ||
        filterValue === undefined
      ) {
        return;
      }

      if (Array.isArray(filterValue) && filterValue.length > 0) {
        // Multi-select filter
        conditions.push(`n.${filterName} IN $${paramName}`);
      } else if (typeof filterValue === 'boolean') {
        conditions.push(`n.${filterName} = $${paramName}`);
      } else if (filterValue instanceof Date) {
        conditions.push(`date(n.${filterName}) = date($${paramName})`);
      } else if (filterValue) {
        // Text filter
        conditions.push(
          `toLower(COALESCE(toString(n.${filterName}), '')) CONTAINS toLower($${paramName})`
        );
      }
    });

    // Custom WHERE clause from advanced query
    if (options.customWhereClause) {
      conditions.push(`(${options.customWhereClause})`);
    }

    // Relationships from advanced query options
    const advancedQueryOptions = options.advancedQueryOptions;
    if (advancedQueryOptions?.relationships) {
      advancedQueryOptions.relationships.forEach((rel, index) => {
        const alias = rel.alias || `related${index}`;
        const direction = rel.direction === 'IN' ? '<' : '';
        const arrow = rel.direction === 'OUT' ? '>' : '';
        const targetLabel = rel.targetLabel ? `:${rel.targetLabel}` : '';

        conditions.push(
          `EXISTS((n)${direction}-[:${rel.type}]-${arrow}(${alias}${targetLabel}))`
        );
      });
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  private buildReturnClause(options: GenericListQueryOptions): string {
    const advancedQueryOptions = options.advancedQueryOptions;
    if (advancedQueryOptions?.customReturn) {
      return advancedQueryOptions.customReturn;
    }
    return 'RETURN n';
  }

  private buildOrderClause(options: GenericListQueryOptions): string {
    if (!options.sortBy?.attribute) return '';
    return `ORDER BY n.${options.sortBy.attribute} ${options.sortBy.direction}`;
  }

  private buildParameters(options: GenericListQueryOptions): any {
    const params: any = {};

    // Fixed filter parameters
    options.fixedFilters.forEach((filter, index) => {
      params[`fixedFilter${index}`] = filter.value;
    });

    // Custom filter parameters - ONLY include non-empty values
    Object.keys(options.activeFilters).forEach((filterName, index) => {
      const filterValue = options.activeFilters[filterName];
      const filterDef = options.filterDefinitions.find(
        (f) => f.name === filterName
      );

      // Skip relationship filters (they are handled separately)
      if (filterDef?.type === 'relationship') {
        return;
      }

      // Skip empty arrays
      if (Array.isArray(filterValue) && filterValue.length === 0) {
        return;
      }

      // Skip empty strings, null, undefined
      if (
        filterValue === '' ||
        filterValue === null ||
        filterValue === undefined
      ) {
        return;
      }

      const paramName = `filter${index}`;

      if (filterValue instanceof Date) {
        params[paramName] = filterValue.toISOString();
      } else {
        params[paramName] = filterValue;
      }
    });

    // Custom parameters - fixed to handle object/map correctly
    if (options.customParameters) {
      Object.entries(options.customParameters).forEach(([key, value]) => {
        if (key && value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });
    }

    // Advanced query parameters
    const advancedQueryOptions = options.advancedQueryOptions;
    if (advancedQueryOptions?.customParameters) {
      Object.entries(advancedQueryOptions.customParameters).forEach(
        ([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = value;
          }
        }
      );
    }

    return params;
  }

  private buildRelationshipFilters(options: GenericListQueryOptions): {
    relationshipMatches: string;
    relationshipConditions: string[];
  } {
    let relationshipMatches = '';
    const relationshipConditions: string[] = [];

    Object.keys(options.activeFilters).forEach((filterName, index) => {
      const filterValue = options.activeFilters[filterName];
      const filterDef = options.filterDefinitions.find(
        (f) => f.name === filterName
      );

      if (
        filterDef?.type === 'relationship' &&
        filterValue &&
        filterValue.ids &&
        filterValue.ids.length > 0
      ) {
        const relationshipConfig = (filterDef as any).relationshipConfig;
        if (relationshipConfig) {
          const direction =
            relationshipConfig.relationshipDirection === 'IN' ? '<' : '';
          const arrow =
            relationshipConfig.relationshipDirection === 'OUT' ? '>' : '';
          const targetLabel = relationshipConfig.targetLabel
            ? `:${relationshipConfig.targetLabel}`
            : '';
          const alias = relationshipConfig.alias || `related${index}`;
          const relAlias = `rel${index}`;

          // Add MATCH pattern with relationship alias
          relationshipMatches += `\nMATCH (n)${direction}-[${relAlias}:${relationshipConfig.relationshipType}]-${arrow}(${alias}${targetLabel})`;

          // Add WHERE conditions for the specific related nodes
          const relConditions = filterValue.ids
            .map((rel: string, relIndex: number) => {
              const relParamName = `${alias}Id${relIndex}`;
              return `${alias}.iroko_uuid = $${relParamName}`;
            })
            .join(' OR ');

          relationshipConditions.push(`(${relConditions})`);

          // Add relationship attribute conditions if present
          if (filterValue.attributeValues) {
            Object.entries(filterValue.attributeValues).forEach(
              ([attribute, attrConfig]: [string, any]) => {
                const attrParamName = `relAttr${index}_${attribute}`;
                const attrCondition = this.buildRelationshipAttributeCondition(
                  relAlias,
                  attribute,
                  attrConfig.operator || 'EQUALS',
                  attrParamName
                );
                relationshipConditions.push(`(${attrCondition})`);
              }
            );
          }
        }
      }
    });

    return { relationshipMatches, relationshipConditions };
  }

  private buildRelationshipAttributeCondition(
    relAlias: string,
    attribute: string,
    operator: string,
    paramName: string
  ): string {
    switch (operator) {
      case 'EQUALS':
        return `${relAlias}.${attribute} = $${paramName}`;
      case 'GREATER_THAN':
        return `${relAlias}.${attribute} > $${paramName}`;
      case 'LESS_THAN':
        return `${relAlias}.${attribute} < $${paramName}`;
      case 'GREATER_EQUAL':
        return `${relAlias}.${attribute} >= $${paramName}`;
      case 'LESS_EQUAL':
        return `${relAlias}.${attribute} <= $${paramName}`;
      default:
        return `${relAlias}.${attribute} = $${paramName}`;
    }
  }

  private buildRelationshipFilterParameters(
    options: GenericListQueryOptions
  ): any {
    const params: any = {};

    Object.keys(options.activeFilters).forEach((filterName, index) => {
      const filterValue = options.activeFilters[filterName];
      const filterDef = options.filterDefinitions.find(
        (f) => f.name === filterName
      );

      if (
        filterDef?.type === 'relationship' &&
        filterValue &&
        filterValue.ids &&
        filterValue.ids.length > 0
      ) {
        const relationshipConfig = (filterDef as any).relationshipConfig;
        if (relationshipConfig) {
          const alias = relationshipConfig.alias || `related${index}`;

          // Add node ID parameters
          filterValue.ids.forEach((rel: string, relIndex: number) => {
            const relParamName = `${alias}Id${relIndex}`;
            params[relParamName] = rel;
          });

          // Add relationship attribute parameter if present
          if (filterValue.attributeValues) {
            Object.entries(filterValue.attributeValues).forEach(
              ([attribute, attrConfig]: [string, any]) => {
                const attrParamName = `relAttr${index}_${attribute}`;
                const value = attrConfig.value;
                params[attrParamName] = value;
              }
            );
          }
        }
      }
    });

    return params;
  }

  // ... (rest of the existing methods remain unchanged)
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
      parameters.searchTerm = `${searchTerm}*`;
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

    const mainNodeLabelClause =
      nodeLabels.length > 0 ? `:${nodeLabels.join(':')}` : '';

    let relationshipPattern: string;
    if (direction === 'OUTGOING') {
      relationshipPattern = `(n)-[r:${relationshipType}]->(related)`;
    } else {
      relationshipPattern = `(n)<-[r:${relationshipType}]-(related)`;
    }

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

  buildRelationshipCountQueryWithRegularSearch(
    nodeId: string,
    relationshipType: string,
    searchTerm: string,
    direction: 'INCOMING' | 'OUTGOING',
    nodeLabels: string[] = [],
    searchProperties: string[] = ['name', 'description', 'iroko_uuid']
  ): { query: string; parameters: any } {
    const mainNodeLabelClause =
      nodeLabels.length > 0 ? `:${nodeLabels.join(':')}` : '';

    let relationshipPattern: string;
    if (direction === 'OUTGOING') {
      relationshipPattern = `(n)-[r:${relationshipType}]->(related)`;
    } else {
      relationshipPattern = `(n)<-[r:${relationshipType}]-(related)`;
    }

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

  // Node Viewer specific methods
  buildRelationshipExportQuery(
    options: RelationshipExportOptions
  ): { query: string; parameters: any } | FullTextCypherQuery {
    const {
      nodeId,
      nodeType,
      relationshipType,
      direction,
      searchTerm,
      searchIndex,
    } = options;

    if (searchIndex && searchTerm) {
      // Full-text search query
      const mainNodeLabelClause = nodeType ? `:${nodeType}` : '';

      let relationshipPattern: string;
      if (direction === 'OUTGOING') {
        relationshipPattern = `(parent)-[r:${relationshipType}]->(n)`;
      } else {
        relationshipPattern = `(parent)<-[r:${relationshipType}]-(n)`;
      }

      const whereClause = `MATCH (parent${mainNodeLabelClause} {iroko_uuid: $nodeId}) MATCH ${relationshipPattern} WHERE n = related`;
      const returnClause = 'RETURN n';
      const orderClause = 'ORDER BY n.name, n.title, n.iroko_uuid';

      const parameters: any = { nodeId };
      if (searchTerm) {
        parameters.searchTerm = `${searchTerm}*`;
      }

      return {
        searchIndex,
        searchTerm,
        whereClause,
        returnClause,
        orderClause,
        parameters,
      };
    } else {
      // Regular query
      const mainNodeLabelClause = nodeType ? `:${nodeType}` : '';

      let relationshipPattern: string;
      if (direction === 'OUTGOING') {
        relationshipPattern = `(parent)-[r:${relationshipType}]->(n)`;
      } else {
        relationshipPattern = `(parent)<-[r:${relationshipType}]-(n)`;
      }

      const conditions: string[] = [];

      if (searchTerm) {
        const searchProperties = ['name', 'description', 'iroko_uuid'];
        const searchConditions = searchProperties
          .map(
            (prop) =>
              `toLower(COALESCE(toString(n.${prop}), '')) CONTAINS toLower($searchTerm)`
          )
          .join(' OR ');
        conditions.push(`(${searchConditions})`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const orderClause = `ORDER BY n.name, n.title, n.iroko_uuid`;
      const returnClause = `RETURN n`;

      const query = `
          MATCH (parent${mainNodeLabelClause} {iroko_uuid: $nodeId})
          MATCH ${relationshipPattern}
          ${whereClause}
          ${returnClause}
          ${orderClause}
        `.trim();

      const parameters: any = { nodeId };
      if (searchTerm) {
        parameters.searchTerm = searchTerm;
      }

      return { query, parameters };
    }
  }

  buildNodeExportQuery(
    nodeId: string,
    nodeType: string
  ): { query: string; parameters: any } {
    const mainNodeLabelClause = nodeType ? `:${nodeType}` : '';

    const query = `
        MATCH (n${mainNodeLabelClause} {iroko_uuid: $nodeId})
        RETURN n
      `.trim();

    return {
      query,
      parameters: { nodeId },
    };
  }
}
