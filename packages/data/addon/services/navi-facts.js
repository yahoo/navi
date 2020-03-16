/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 *
 * Description: Bard facts service that executes and delivers the results
 */

import Service from '@ember/service';
import { getOwner } from '@ember/application';
import NaviFactsModel from 'navi-data/models/navi-facts';
import RequestBuilder from 'navi-data/builder/request';
import config from 'ember-get-config';

export default class NaviFactsService extends Service {
  /**
   * @method _adapterFor
   *
   * @param {String} type
   * @returns {Adapter} adpater instance for type
   */
  _adapterFor(type = 'bard-facts') {
    return getOwner(this).lookup(`adapter:${type}`);
  }

  /**
   * @method _serializerFor
   *
   * @param {String} type
   * @returns {Serializer} serializer instance for type
   */
  _serializerFor(type = 'bard-facts') {
    return getOwner(this).lookup(`serializer:${type}`);
  }

  /**
   * Creates a new request builder instance
   *
   * @method request
   * @param {Object} baseRequest - existing request to start from
   * @returns {Object} request builder interface
   */
  request(baseRequest) {
    return RequestBuilder.create(baseRequest);
  }

  /**
   * @method getURL - Uses the adapter to get the bard query url for the request
   * @param {Object} request - request object
   * @param {Object} [options] - options object
   * @returns {String} - url for the request
   */
  getURL(request, options) {
    const type = config.navi.dataSources[0].type,
      adapter = this._adapterFor(type);
    return adapter.urlForFindQuery(request, options);
  }

  /**
   * @method fetch - Returns the bard response model for the request
   * @param {Object} request - request object
   * @param {Object} [options] - options object
   * @param {Number} [options.timeout] - milliseconds to wait before timing out
   * @param {String} [options.clientId] - clientId value to be passed as a request header
   * @param {Object} [options.customHeaders] - hash of header names and values
   * @returns {Promise} - Promise with the bard response model object
   */
  fetch(request, options) {
    const type = config.navi.dataSources[0].type,
      adapter = this._adapterFor(type),
      serializer = this._serializerFor(type);

    return adapter.fetchDataForRequest(request, options).then(payload => {
      return NaviFactsModel.create({
        request: request,
        response: serializer.normalize(payload),
        _factsService: this
      });
    });
  }

  /**
   * @method fetchNext
   * @param {Object} response
   * @param {Object} request
   * @return {Promise|null} returns the promise with the next set of results or null
   */
  fetchNext(response, request) {
    if (response.meta.pagination) {
      const { perPage, numberOfResults, currentPage } = response.meta.pagination;

      const totalPages = numberOfResults / perPage;

      if (currentPage < totalPages) {
        let options = {
          page: currentPage + 1,
          perPage: perPage
        };

        return this.fetch(request, options);
      }
    }
    return null;
  }

  /**
   * @method fetchPrevious
   * @param {Object} response
   * @param {Object} request
   * @return {Promise|null} returns the promise with the previous set of results or null
   */
  fetchPrevious(response, request) {
    if (response.meta.pagination) {
      if (response.meta.pagination.currentPage > 1) {
        const options = {
          page: response.meta.pagination.currentPage - 1,
          perPage: response.meta.pagination.rowsPerPage
        };

        return this.fetch(request, options);
      }
    }

    return null;
  }
}
