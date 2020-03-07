/**
 * In many places, re-frame asks you to associate an `id` (keyword)
 * with a `handler` (function).  This namespace contains the
 * central registry of such associations.
 **/
import { from } from 'rxjs';

/**
 * Kind of handlers
 **/
const kinds = new Set(['event', 'fx', 'cofx', 'sub']);

/**
 * This atom contains a register of all handlers.
 * Contains a two layer map, keyed first by `kind` (of handler), and then `id` of handler.
 * Leaf nodes are handlers.
 */
const kind2Id2Handler = from({});

export const getHandler = async (kind, id, isRequired) => {
  // If only kind is passed into
  if (kind && !id && !isRequired) {
    return await kind2Id2Handler.toPromise();
  }

  if (kind && id && !isRequired) {
    return await kind2Id2Handler.toPromise();
  }
};
