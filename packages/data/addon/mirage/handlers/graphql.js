/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import createGraphQLHandler from 'ember-cli-mirage-graphql/handler';
import schema from 'navi-data/gql/schema';
import gql from 'graphql-tag';
import faker from 'faker';
import moment from 'moment';

const API_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * @param {string} filter
 * @returns 3 sequential days in format YYYY-MM-DD ending on today
 */
function _getDates(/* filter */) {
  // TODO: Generate dates based on filters on time dimensions and the chosen grain
  let day = moment();
  let days = [];
  for (let i = 0; i < 3; i++) {
    days.push(moment(day).format(API_DATE_FORMAT));
    day = moment(day).subtract(1, 'days');
  }

  return days;
}

/**
 * @param {Number} n
 * @returns n random dimension values
 */
function _dimensionValues(n) {
  const vals = [];
  for (let i = 0; i < n; i++) {
    vals.push(faker.commerce.productName());
  }

  return vals;
}

/**
 * @param {String} queryStr - stringified graphql query
 * @returns {Object}
 */
function _parseGQLQuery(queryStr) {
  const queryAST = gql`
    ${queryStr}
  `;

  // Parse requested table, columns, and filters from graphql query
  const selection = queryAST.definitions[0]?.selectionSet.selections[0];
  return {
    table: selection?.name.value,
    args: selection?.arguments.reduce((argsObj, arg) => {
      argsObj[arg.name.value] = arg.value.value;
      return argsObj;
    }, {}),
    fields: selection?.selectionSet.selections[0].selectionSet.selections[0].selectionSet.selections.map(
      field => field.name.value
    )
  };
}

function _getResponseBody(db, parent) {
  // Create mocked response for an async query
  const { createdOn, query } = parent;
  const responseTime = Date.now();
  debugger;

  // Only respond if query was created over 10 seconds ago
  if (responseTime - createdOn >= 10000) {
    parent.status = 'COMPLETE';

    // TODO: get args from _parseGQLQuery result and handle filtering
    const { table, args, fields } = _parseGQLQuery(JSON.parse(query).query || '');

    if (table) {
      debugger;
      const dbTable = db.tables.find(table) || db.metadataTables.find(table);
      const columns = fields.reduce(
        (groups, column) => {
          const type = ['metric', 'dimension', 'timeDimension'].find(t => dbTable[`${t}Ids`].includes(column));

          if (type) {
            groups[type].push(column);
          }
          return groups;
        },
        { metric: [], dimension: [], timeDimension: [] }
      );
      let dates = [];

      if (columns.timeDimension.length > 0) {
        dates = _getDates(args.filter);
      }

      // Convert each date into a row of data
      let rows = dates.map(dateTime => ({ dateTime }));

      // Add each dimension
      columns.dimension.forEach(dimension => {
        rows = rows.reduce((newRows, currentRow) => {
          let dimensionValues = _dimensionValues(faker.random.number({ min: 3, max: 5 }));

          return newRows.concat(
            dimensionValues.map(value => {
              let newRow = Object.assign({}, currentRow);
              newRow[dimension] = value;
              return newRow;
            })
          );
        }, []);
      });

      // Add each metric
      rows = rows.map(row => {
        columns.metric.forEach(metric => {
          row[metric] = faker.finance.amount();
        });

        return row;
      });

      return JSON.stringify({
        data: {
          [table]: {
            edges: rows.map(node => ({ node }))
          }
        }
      });
    }
    return JSON.stringify({
      errors: {
        message: 'Invalid query sent with AsyncQuery'
      }
    });
  }
  return null;
}

const OPTIONS = {
  fieldsMap: {
    AsyncQuery: {
      result(_, db, parent) {
        return {
          httpStatus: 200,
          contentLength: 5,
          responseBody: _getResponseBody(db, parent)
        };
      }
    }
  },
  argsMap: {
    // We have to use undefined as the type key because ember-cli-mirage-graphql does not define the type property for edges and connections
    undefined: {
      ids(records, _, ids) {
        return Array.isArray(ids) ? records.filter(record => ids.includes(record.id)) : records;
      }
    },
    AsyncQueryEdge: {
      ids(records, _, ids) {
        return Array.isArray(ids) ? records.filter(record => ids.includes(record.id)) : records;
      },
      op(records) {
        return records;
      }
    }
  },
  mutations: {
    asyncQuery(connection, { op, data }, { asyncQueries }) {
      data = data[0];
      const queryIds = data.id ? [data.id] : [];
      debugger;
      const existingQueries = asyncQueries.find(queryIds) || [];
      if (op === 'UPSERT' && existingQueries.length === 0) {
        const node = asyncQueries.insert({
          id: data.id,
          asyncAfterSeconds: 10,
          requestId: data.id,
          query: data.query,
          queryType: data.queryType,
          status: data.status,
          createdOn: Date.now(),
          result: null
        });
        return { edges: [{ node }] };
      } else if (op === 'UPDATE' && existingQueries.length > 0) {
        existingQueries.forEach(query => {
          query.status = data.status;
        });
        return { edges: existingQueries.map(node => ({ node })) };
      } else {
        throw new Error(`Unable to ${op} when ${existingQueries.length} queries exist with id `);
      }
    }
  }
};

export default createGraphQLHandler(schema, OPTIONS);
