/**
 * Copyright 2020, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import gql from 'graphql-tag';

export const asyncFactsMutationStr = `
  mutation($id: string, $query: string) {
    asyncQuery(op: UPSERT, data: { id: $id, query: $query, queryType: GRAPHQL_V1_0, status: QUEUED }) {
      edges {
        node {
          id
          query
          queryType
          status
          result {
            contentLength
            responseBody
            httpStatus
          }
        }
      }
    }
  }
`;

const mutation = gql`
  ${asyncFactsMutationStr}
`;

export default mutation;
