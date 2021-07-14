import { A as arr } from '@ember/array';
import { attr, belongsTo } from '@ember-data/model';
//@ts-ignore
import { fragment } from 'ember-data-model-fragments/attributes';
import DeliverableItem from './deliverable-item';
import hasVisualization from 'navi-core/mixins/models/has-visualization';
import { validator, buildValidations } from 'ember-cp-validations';
import RequestFragment from './bard-request-v2/request';
import UserModel from './user';
import { Moment } from 'moment';
// eslint-disable-next-line ember/use-ember-data-rfc-395-imports
import DS from 'ember-data';

const Validations = buildValidations({
  visualization: [validator('belongs-to')],
  request: [validator('belongs-to')],
  title: [
    validator('presence', {
      presence: true,
      ignoreBlank: true,
      message: 'The report must have a title',
    }),
  ],
});

export default class ReportModel extends DeliverableItem.extend(hasVisualization, Validations) {
  @attr('string', { defaultValue: 'Untitled Report' })
  title!: string;

  @attr('moment')
  createdOn!: Moment;

  @attr('moment')
  updatedOn!: Moment;

  @belongsTo('user', { async: true })
  owner!: DS.PromiseObject<UserModel>;

  @fragment('bard-request-v2/request', { defaultValue: () => ({}) })
  request!: RequestFragment;

  /**
   * @property {Boolean} isOwner - is owner of report
   */
  get isOwner() {
    const userId = this.user.getUser()?.id;
    return this.owner.get('id') === userId;
  }

  /**
   * @property {Boolean} isFavorite - is favorite of owner
   */
  get isFavorite() {
    const user = this.user.getUser();
    const favoriteReports = user?.hasMany('favoriteReports').ids();
    return arr(favoriteReports).includes(this.id);
  }

  /**
   * Clones the model
   *
   * @method clone
   * @returns Object - cloned Report model
   */
  clone() {
    const clonedReport = this.toJSON() as this; //TODO not totally right
    return {
      title: clonedReport.title,
      visualization: this.store.createFragment(clonedReport.visualization.type, clonedReport.visualization),
      request: this.request.clone(),
    };
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    report: ReportModel;
  }
}
