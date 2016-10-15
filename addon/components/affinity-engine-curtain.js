import Ember from 'ember';
import layout from '../templates/components/affinity-engine-curtain';
import { ConfigurableMixin, configurable, registrant } from 'affinity-engine';
import { BusSubscriberMixin } from 'ember-message-bus';
import multiton from 'ember-multiton-service';

const {
  Component,
  computed,
  get,
  getProperties,
  run,
  set
} = Ember;

const { later } = run;
const { String: { camelize } } = Ember;

const configurationTiers = [
  'config.attrs.component.curtain',
  'config.attrs'
];

export default Component.extend(BusSubscriberMixin, ConfigurableMixin, {
  layout,

  filesToPreload: '',
  hook: 'affinity_engine_curtain',
  classNames: ['et-curtain'],

  animator: registrant('affinity-engine/animator'),
  config: multiton('affinity-engine/config', 'engineId'),
  fixtureStore: multiton('affinity-engine/fixture-store', 'engineId'),
  preloader: registrant('affinity-engine/preloader'),
  translator: registrant('affinity-engine/translator'),

  baseTitle: configurable(configurationTiers, 'title'),
  transitionOut: configurable(configurationTiers, 'transitionOut.effect'),
  transitionOutDuration: configurable(configurationTiers, 'transitionOut.duration', 'transitionDuration'),
  preTransitionOutPauseDuration: configurable(configurationTiers, 'preTransitionOutPauseDuration'),

  title: computed('baseTitle', {
    get() {
      const title = get(this, 'baseTitle');

      return get(this, 'translator').translate(title) || title;
    }
  }),

  init(...args) {
    this._super(...args);

    const {
      engineId,
      filesToPreload,
      fixtureStore,
      preloader
    } = getProperties(this, 'engineId', 'filesToPreload', 'fixtureStore', 'preloader');

    Object.keys(filesToPreload).forEach((fixtureName) => {
      const fixtures = fixtureStore.findAll(camelize(fixtureName));
      const attribute = filesToPreload[fixtureName];

      this._preloadFixtures(preloader, fixtures, attribute);
    });

    this.on(`ae:${engineId}:preloadProgress`, this._setProgress);
    this.on(`ae:${engineId}:preloadCompletion`, this._complete);
  },

  _preloadFixtures(preloader, fixtures, attribute) {
    fixtures.forEach((fixture) => {
      const src = get(fixture, attribute);
      const id = preloader.idFor(fixture, attribute);

      preloader.loadFile({ src, id });
    });
  },

  _setProgress({ progress }) {
    set(this, 'progress', progress);
  },

  _complete() {
    const pauseDuration = get(this, 'preTransitionOutPauseDuration');

    later(() => {
      const effect = get(this, 'transitionOut');
      const duration = get(this, 'transitionOutDuration');

      get(this, 'animator').animate(this.element, effect, { duration }).then(() => {
        run(() => {
          this.attrs.completePreload();
        });
      });
    }, pauseDuration);
  }
});
