/**
 * In many places, re-frame asks you to associate an `id` (keyword)
 * with a `handler` (function).  This namespace contains the
 * central registry of such associations.
 **/

/**
 * Kind of handlers
 **/
const kinds = new Set(['event', 'fx', 'cofx', 'sub']);

/**
 * This atom contains a register of all handlers.
 * Contains a two layer map, keyed first by `kind` (of handler), and then `id` of handler.
 * Leaf nodes are handlers.
 * TODO: Write down a correct Observable
 */
const kind2Id2Handler = new Proxy(
  {},
  {
    set: function(target, name, newVal) {
      console.log(`New value is set: ${name}: ${newVal}`);

      target[name] = newVal;
    },

    get: function(target, name) {
      console.log(`Got a value for ${name}`);
      return target[name];
    }
  }
);
// TODO: You definitely have to elaborate how to get value from getHandler when observable is triggered
export const getHandler = (kind, id, isRequired) => {
  // If only kind is passed into
  if (kind && !id && !isRequired) {
    return kind2Id2Handler.toPromise();
  }

  if (kind && id && !isRequired) {
    return kind2Id2Handler[kind][id];
  }

  if (kind && id && isRequired) {
    const handler = getHandler(kind, id);

    // TODO: There is some logic related to debugging. Elaborate on it.

    if (isRequired && !handler) {
      console.error(
        `Re-frame: No ${kind} handler registered for: ${id}`
      );
    }

    return handler;
  }
};

export const registerHandler = (kind, id, handlerFn) => {
  // TODO: There is some logic related to debugging. Elaborate on it.

  kind2Id2Handler[kind][id] = handlerFn;

  return handlerFn;
};
