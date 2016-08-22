import Ember from 'ember';
import layout from '../templates/components/infinity-loader';
import InViewportMixin from 'ember-in-viewport';

const { computed, observer, run } = Ember;

const ReachedInfinity = Ember.Component.extend(InViewportMixin, {
  classNames: ['infinity-loader'],
  classNameBindings: ['viewportEntered:in-viewport'],
  layout,

  collection: null,
  scrollBuffer: 100,
  debounce: 100,
  destroyOnReach: false,
  reachedInfinity: false,

  onReach: null,

  shouldShowLoader: computed('viewportEntered', 'reachedInfinity', function() {
    return this.get('viewportEntered') && !this.get('reachedInfinity');
  }).readOnly(),

  didInsertElement() {
    this._super(...arguments);
    this.setProperties({
      viewportSpy: true,
      viewportTolerance: {
        bottom : this.get('scrollBuffer'),
        top    : 0,
        left   : 0,
        right  : 0
      }
    });
  },

  willDestroyElement() {
    this._super(...arguments);
    this._cancelTimers();
  },

  didEnterViewport() {
    this._debounceReachedInfinity();
  },

  didExitViewport() {
    this._cancelTimers();
  },

  onReachedInfinity: observer('reachedInfinity', 'destroyOnReach', function() {
    if(this.get('reachedInfinity') && this.get('destroyOnReach')) {
      this.destroy();
    }
  }),

  scheduleReachedInfinity: observer('collection.[]', 'viewportEntered', function() {
    if(this.get('viewportEntered')) {
      /*
        Continue scheduling onReach until no longer in viewport
       */
      this._scheduleReachedInfinity();
    }
  }),

  _scheduleReachedInfinity() {
    this._schedulerTimer = run.scheduleOnce('afterRender', this, this._debounceReachedInfinity);
  },

  _debounceReachedInfinity() {
    /*
      This debounce is needed when there is not enough delay between onReach calls.
      Without this debounce, all collection will be rendered causing immense performance problems
     */
    if(!this.get('reachedInfinity')) {
      this._debounceTimer = run.debounce(this, this.sendAction, 'onReach', this.get('debounce'));
    }
  },

  _cancelTimers() {
    run.cancel(this._schedulerTimer);
    run.cancel(this._debounceTimer);
  }
});

ReachedInfinity.reopenClass({
  positionalParams: ['collection']
});

export default ReachedInfinity;
