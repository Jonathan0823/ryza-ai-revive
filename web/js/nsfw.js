/* Screen clothing vs atlas variant. No costume ids, no player-keyword lists.

   The user must explicitly allow NSFW in Settings before the LLM can turn it
   on. The tag-line field is `undress:on` / `undress:off` (`nsfw` still
   parsed as an alias). Copying the filled prefix (or omit / keep) leaves the
   screen. Atlas files stay `{page}nsfw.png`. Policy text lives once in api.js. */
(function (global) {
  'use strict';

  var VARIANT = 'nsfw';

  function configuredEnabled() {
    try {
      return !!(global.Config && Config.section('app').nsfwEnabled === true);
    } catch (e) { return false; }
  }

  function apply(on) {
    /* Permission is a hard gate: model output cannot bypass it. */
    on = !!on && Nsfw._enabled;
    Nsfw._on = on;
    var av = global.Avatar;
    if (av && typeof av.setAtlasVariant === 'function') {
      av.setAtlasVariant(on ? VARIANT : 'default');
    }
  }

  var Nsfw = {
    VARIANT: VARIANT,
    _on: false,
    _enabled: false,
    active: function () { return !!Nsfw._on; },
    enabled: function () { return !!Nsfw._enabled; },
    apply: apply,
    restore: function () {
      Nsfw._enabled = configuredEnabled();
      apply(Nsfw._enabled);
    },
    setEnabled: function (on) {
      Nsfw._enabled = !!on;
      try {
        if (global.Config && typeof Config.set === 'function') {
          Config.set('app.nsfwEnabled', Nsfw._enabled);
        }
      } catch (e) {}
      apply(Nsfw._enabled);
    },
    reset: function () { apply(false); },
    /* One fact for the system prompt. Not a rule list. */
    screenFact: function () {
      return Nsfw._on
        ? 'いまの画面：肌が見えている（服は脱いだあと）。'
        : 'いまの画面：普段の服を着ている。';
    },
    onTurn: function (reply) {
      var flag = reply && typeof reply.nsfw === 'boolean' ? reply.nsfw : null;
      if (flag === true) apply(true);
      else if (flag === false) apply(false);
    }
  };

  global.Nsfw = Nsfw;
})(typeof window !== 'undefined' ? window : globalThis);
