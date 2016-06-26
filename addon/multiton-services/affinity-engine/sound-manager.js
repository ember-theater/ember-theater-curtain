import Ember from 'ember';
import { BusSubscriberMixin } from 'ember-message-bus';
import multiton, { MultitonService } from 'ember-multiton-service';
import { MultitonIdsMixin } from 'affinity-engine';

const {
  computed,
  get,
  isBlank,
  on,
  set
} = Ember;

export default MultitonService.extend(BusSubscriberMixin, MultitonIdsMixin, {
  config: multiton('affinity-engine/config', 'engineId'),

  idMap: computed(() => Ember.Object.create()),

  setupEvents: on('init', function() {
    const engineId = get(this, 'engineId');

    this.on(`et:${engineId}:reseting`, this, this.clearSounds);
  }),

  findOrCreateInstance(soundId, instanceId = 0) {
    const instance = get(this, `idMap.${soundId}.${instanceId}`);

    return instance || this._createInstance(soundId, instanceId);
  },

  _createInstance(soundId, instanceId) {
    const idMap = get(this, 'idMap');

    if (isBlank(get(idMap, soundId))) {
      set(idMap, soundId, Ember.Object.create());
    }

    const instance = createjs.Sound.createInstance(soundId);

    return set(idMap, `${soundId}.${instanceId}`, instance);
  },

  clearSounds() {
    const idMap = get(this, 'idMap');

    Object.keys(idMap).forEach((mapKey) => {
      const map = get(idMap, mapKey);

      Object.keys(map).forEach((instanceKey) => {
        get(map, instanceKey).stop();
      });
    });

    set(this, 'idMap', Ember.Object.create());
  }
});