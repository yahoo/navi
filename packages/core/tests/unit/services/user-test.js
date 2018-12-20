import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import { setupMock, teardownMock } from '../../helpers/mirage-helper';
import config from 'ember-get-config';
import Mirage from 'ember-cli-mirage';
import DS from 'ember-data';
import UserAdapter from 'navi-core/adapters/base-json-adapter';

const { getOwner } = Ember;

let Store, NaviUser;

moduleFor('service:user', 'Unit | Service | user', {
  beforeEach() {
    NaviUser = config.navi.user;
    setupMock();
    // Mock fact service
    this.register(
      'model:user',
      DS.Model.extend({
        reports: DS.attr()
      })
    );
    this.register('adapter:user', UserAdapter);
    Store = getOwner(this).lookup('service:store');
  },

  afterEach() {
    teardownMock();
    config.navi.user = NaviUser; //reset user in navi config
  }
});

test('getUser - invoked without userId param', function(assert) {
  assert.expect(2);

  let service = this.subject();

  assert.equal(service.getUser(), null, 'getUser returns null for non registered');

  Ember.run(() => {
    let userModel = Store.createRecord('user', { id: NaviUser });

    assert.equal(service.getUser(), userModel, `getUser return model for registered logged-in "${NaviUser}" user`);
  });
});

test('getUser - invoked with userId param', function(assert) {
  assert.expect(2);

  let service = this.subject(),
    naviUser = 'some_user';

  assert.equal(service.getUser(naviUser), null, 'getUser returns null for non registered');

  Ember.run(() => {
    let userModel = Store.createRecord('user', { id: naviUser });

    assert.equal(service.getUser(naviUser), userModel, `getUser return model for registered "${naviUser}" user`);
  });
});

test('findUser - invoked without userId param', function(assert) {
  assert.expect(2);

  let service = this.subject();

  return Ember.run(() => {
    return service.findUser().then(user => {
      let userModel = Store.peekRecord('user', NaviUser);

      assert.equal(user, userModel, `findUser returns model for registered logged-in "${NaviUser}" user`);

      config.navi.user = 'unregistered_user';
      return service.findUser().catch(() => {
        assert.ok(true, 'findUser returns an error promise when an unregistered user is fetched');
      });
    });
  });
});

test('findUser - invoked with userId param', function(assert) {
  assert.expect(3);

  let service = this.subject(),
    userId = 'ciela';

  return Ember.run(() => {
    return service.findUser(userId).then(user => {
      let userModel = Store.peekRecord('user', userId);

      assert.ok(user, 'findUser returns a non empty user model');

      assert.equal(user, userModel, `findUser returns model for registered logged-in "${NaviUser}" user`);

      userId = 'unregistered_user';
      return service.findUser(userId).catch(() => {
        assert.ok(true, 'findUser returns an error promise when an unregistered user is fetched');
      });
    });
  });
});

test('register - unregistered logged-in user', function(assert) {
  assert.expect(3);

  let service = this.subject(),
    naviUser = (config.navi.user = 'unregistered_user');

  return Ember.run(() => {
    assert.notOk(Store.peekRecord('user', naviUser), `"${naviUser}" user is initially not present in the store`);

    return service.register().then(user => {
      let userModel = Store.peekRecord('user', naviUser);

      assert.ok(user, 'register returns a non empty model as expected');

      assert.equal(user, userModel, `register returns model for "${naviUser}" user`);
    });
  });
});

test('register - handle server error', function(assert) {
  assert.expect(1);

  let service = this.subject();

  //mock persistence WS to throw error
  server.urlPrefix = config.navi.appPersistence.uri;
  server.post('/users', () => {
    return new Mirage.Response(500);
  });

  return Ember.run(() => {
    return service.register().catch(() => {
      assert.ok(true, 'register return an error promise when server throws an error');
    });
  });
});

test('findOrRegister - unregistered user', function(assert) {
  assert.expect(2);

  let service = this.subject(),
    naviUser = (config.navi.user = 'unregistered_user');

  return Ember.run(() => {
    assert.notOk(Store.peekRecord('user', naviUser), `"${naviUser}" user is initially not present in the store`);

    return service.findOrRegister().then(user => {
      let userModel = Store.peekRecord('user', naviUser);

      assert.equal(user, userModel, 'findOrRegister registers an unregistered user and return model as expected');
    });
  });
});

test('findOrRegister - registered user not present in store', function(assert) {
  assert.expect(3);

  let service = this.subject();

  return Ember.run(() => {
    assert.equal(Store.peekRecord('user', NaviUser), null, `"${NaviUser}" user is initially not present in the store`);

    return service.findOrRegister().then(user => {
      let userModel = Store.peekRecord('user', NaviUser);

      assert.ok(user, 'findOrRegister returns a non empty user model');

      assert.equal(user, userModel, 'findOrRegister returns model for a registered user');
    });
  });
});

test('findOrRegister - handle server errors', function(assert) {
  assert.expect(1);

  let service = this.subject();

  //mock persistence WS to throw error
  server.urlPrefix = config.navi.appPersistence.uri;
  server.post('/users', () => {
    return new Mirage.Response(500);
  });

  return Ember.run(() => {
    return service.register().catch(() => {
      assert.ok(true, 'register return an error promise when server throws an error');
    });
  });
});
