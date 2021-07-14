import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
//@ts-ignore
import { setupMirage } from 'ember-cli-mirage/test-support';
import type CompressionService from 'navi-core/services/compression';
import type NaviMetadataService from 'navi-data/services/navi-metadata';
import type StoreService from '@ember-data/store';
import type ReportModel from 'navi-core/models/report';

let Service: CompressionService;
let Store: StoreService;

module('Unit | Service | compression', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    Service = this.owner.lookup('service:compression');
    Store = this.owner.lookup('service:store');
    const naviMetadata = this.owner.lookup('service:navi-metadata') as NaviMetadataService;
    await naviMetadata.loadMetadata();
  });

  test('compress and decompress', async function (assert) {
    assert.expect(3);

    const object = { foo: 'bar' };
    const compressedString = await Service.compress(object);

    assert.equal(
      compressedString,
      encodeURIComponent(compressedString),
      'The object compressed to a string safe for use in a URL without requiring an id'
    );

    assert.ok(
      compressedString.length < 1000,
      'The object compresses to a string significantly shorter than the URL limit'
    );

    const decompressedObject = await Service.decompress(compressedString);

    assert.deepEqual(decompressedObject, { foo: 'bar' }, 'Decompressing the string returns the original object');
  });

  test('compressModel and decompressModel', async function (assert) {
    assert.expect(5);

    const user = Store.createRecord('user', { id: 'midna' });
    const request = Store.createFragment('bard-request-v2/request', {
      dataSource: 'bardOne',
    });
    const report = Store.createRecord('report', {
      id: '1234',
      title: 'Hello World',
      owner: user,
      request,
    });
    const compressedString = await Service.compressModel(report);

    assert.equal(
      compressedString,
      encodeURIComponent(compressedString),
      'The model compresses to a string safe for use in a URL'
    );

    assert.ok(
      compressedString.length < 1000,
      'The model compresses to a string significantly shorter than the URL limit'
    );

    const decompressedModel = (await Service.decompressModel(compressedString)) as ReportModel;
    assert.deepEqual(
      decompressedModel.getProperties('id', 'title'),
      { id: '1234', title: 'Hello World' },
      'The decompressed model contains the same properties as the original'
    );

    const decompressedUser = await decompressedModel.get('owner');
    assert.equal(decompressedUser, user, 'The decompressed model maintains the original relationships');

    assert.equal(decompressedModel.get('request'), request, 'The decompressed model maintains the original fragments');
  });

  test('compressModel: id is required', function (assert) {
    assert.expect(1);
    const store = Service.get('store');
    const report = store.createRecord('report', { title: 'Hello World' });

    Service.compressModel(report).catch((e) => {
      assert.throws(
        () => {
          throw e; // re throw
        },
        /A model given to `compress` must have an id/,
        'An error is thrown if the model does not have an id set'
      );
    });
  });
});
