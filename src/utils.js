/**
 * Set of different functions
 **/

/**
 * Compares FsmStates and triggers
 * @param {string} firstFsmState
 * @param {string} firstTrigger
 * @param {string} secondFsmState
 * @param {string} secondTrigger
 * @returns {boolean}
 */
export const compareFsmStatesAndTriggers = (
  [firstFsmState, firstTrigger],
  [secondFsmState, secondTrigger]
) =>
  firstFsmState === secondFsmState && firstTrigger === secondTrigger;

/**
 * Next tick implementation for the FE
 * @param {Function} callback
 * @returns {number}
 */
export const nextTick = callback => setTimeout(callback, 0);
