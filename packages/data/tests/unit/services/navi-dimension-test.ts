import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { DimensionFilter } from 'navi-data/adapters/dimensions/interface';
import { TestContext as Context } from 'ember-test-helpers';
import NaviDimensionModel from 'navi-data/models/navi-dimension';
import NaviDimensionService from 'navi-data/services/navi-dimension';
import NaviMetadataService from 'navi-data/services/navi-metadata';
import DimensionMetadataModel from 'navi-data/models/metadata/dimension';
// @ts-ignore
import { setupMirage } from 'ember-cli-mirage/test-support';
import GraphQLScenario from 'navi-data/mirage/scenarios/elide-one';
import { Server } from 'miragejs';

interface TestContext extends Context {
  metadataService: NaviMetadataService;
  server: Server;
}

module('Unit | Service | navi-dimension', function(hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function(this: TestContext) {
    this.metadataService = this.owner.lookup('service:navi-metadata');
    GraphQLScenario(this.server);
    await this.metadataService.loadMetadata({ dataSourceName: 'elideOne' });
  });

  test('all', async function(this: TestContext, assert) {
    const service = this.owner.lookup('service:navi-dimension') as NaviDimensionService;
    const columnMetadata = this.metadataService.getById(
      'dimension',
      'table0.dimension1',
      'elideOne'
    ) as DimensionMetadataModel;
    const expectedDimensionModels = [
      'Handcrafted Frozen Mouse',
      'Licensed Soft Ball',
      'Awesome Concrete Table',
      'Handcrafted Concrete Mouse'
    ].map(dimVal => NaviDimensionModel.create({ value: dimVal, dimensionColumn: { columnMetadata } }));
    const all = await service.all({ columnMetadata });

    assert.deepEqual(all, expectedDimensionModels, '`all` gets all the unfiltered values for a dimension');
  });

  test('find', async function(this: TestContext, assert) {
    const service = this.owner.lookup('service:navi-dimension') as NaviDimensionService;
    const columnMetadata = this.metadataService.getById(
      'dimension',
      'table0.dimension1',
      'elideOne'
    ) as DimensionMetadataModel;
    const findValues = ['Awesome Plastic Fish', 'Refined Fresh Bacon'];
    const filters: DimensionFilter[] = [{ operator: 'in', values: findValues }];
    const expectedDimensionModels = findValues.map(dimVal =>
      NaviDimensionModel.create({ value: dimVal, dimensionColumn: { columnMetadata } })
    );
    const find = await service.find({ columnMetadata }, filters);
    assert.deepEqual(
      find,
      expectedDimensionModels,
      '`find` gets all the values for a dimension that match the specified filter'
    );
  });

  test('search', async function(this: TestContext, assert) {
    assert.expect(2);

    const service = this.owner.lookup('service:navi-dimension') as NaviDimensionService;
    const columnMetadata = this.metadataService.getById(
      'dimension',
      'table0.dimension2',
      'elideOne'
    ) as DimensionMetadataModel;
    const search = await service.search({ columnMetadata }, 'Plastic');
    const expectedDimensionModels = ['Licensed Plastic Pants', 'Awesome Plastic Fish'].map(dimVal =>
      NaviDimensionModel.create({ value: dimVal, dimensionColumn: { columnMetadata } })
    );
    assert.deepEqual(
      search,
      expectedDimensionModels,
      '`search` gets all the values for a dimension that contain the query'
    );

    const noResultSearch = await service.search({ columnMetadata }, 'fuggedaboutit');
    assert.deepEqual(noResultSearch, [], 'Empty array is returned when no values are found');
  });
});
