import { attr, belongsTo, hasMany, AsyncBelongsTo, AsyncHasMany } from '@ember-data/model';
import { A } from '@ember/array';
//@ts-ignore
import { fragment, fragmentArray } from 'ember-data-model-fragments/attributes';
import DeliverableItem from 'navi-core/models/deliverable-item';
import config from 'ember-get-config';
//@ts-ignore
import { copy } from 'ember-copy';
import { validator, buildValidations } from 'ember-cp-validations';
import UserModel from './user';
import FragmentArray from 'ember-data-model-fragments/FragmentArray';
import { Moment } from 'moment';
import FilterFragment from './bard-request-v2/fragments/filter';
import DashboardWidget from './dashboard-widget';
import PresentationFragment from './fragments/presentation';

const Validations = buildValidations({
  title: [
    validator('presence', {
      presence: true,
      ignoreBlank: true,
      message: 'The dashboard must have a title',
    }),
  ],
});

export default class DashboardModel extends DeliverableItem.extend(Validations) {
  @belongsTo('user', { async: true })
  owner!: AsyncBelongsTo<UserModel>;

  @attr('string')
  title!: string;

  @attr('moment')
  createdOn!: Moment;

  @attr('moment')
  updatedOn!: Moment;

  @hasMany('dashboard-widget', { async: true })
  widgets!: AsyncHasMany<DashboardWidget>;

  @fragmentArray('bard-request-v2/fragments/filter', { defaultValue: [] })
  filters!: FragmentArray<FilterFragment>;

  @fragment('fragments/presentation', { defaultValue: () => ({}) })
  presentation!: PresentationFragment;

  /**
   * user is the dashboard owner
   */
  get isUserOwner() {
    return this.owner.get('id') === config.navi.user;
  }

  /**
   * user is in the dashboard editor list
   */
  isUserEditor = false;

  /**
   * user has edit permissions for dashboard
   */
  get canUserEdit(): boolean {
    return this.isUserOwner || this.isUserEditor;
  }

  /**
   * is favorite of owner
   */
  get isFavorite() {
    const user = this.user.getUser();
    const favoriteDashboards = user?.hasMany('favoriteDashboards').ids();
    return A(favoriteDashboards).includes(this.id);
  }

  /**
   * Clones the model
   *
   * @returns cloned Dashboard model
   */
  clone() {
    const user = this.user.getUser();
    const clonedDashboard = Object.assign(this.toJSON(), {
      owner: user,
      widgets: [],
      filters: this.filters.map((filter) => {
        return this.store.createFragment('bard-request-v2/fragments/filter', {
          field: filter.field,
          parameters: filter.parameters,
          type: filter.type,
          operator: filter.operator,
          values: filter.values,
          source: filter.source,
        });
      }),
      presentation: copy(this.presentation),
      createdOn: null,
      updatedOn: null,
    });

    return this.store.createRecord('dashboard', clonedDashboard);
  }
}
// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    dashboard: DashboardModel;
  }
}
