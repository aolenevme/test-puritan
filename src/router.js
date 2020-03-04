/**
 * Router loop
 **/

import { compareFsmStatesAndTriggers } from './utils';

// TODO: Add laterFns
const defineNewFsmStateAndTrigger = (fsmState, trigger) => {
  const arrayFsmStateTrigger = [fsmState, trigger];

  /**
   * You should read the following "case" as:
   * [current-FSM-state trigger] -> [new-FSM-state action-fn]
   * So, for example, the next line should be interpreted as:
   * if you are in state ":idle" and a trigger ":add-event"
   * happens, then move the FSM to state ":scheduled" and execute
   * that two-part "do" function.
   */
  if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'idle',
      'add-event'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['scheduled', () => ({})];
  }

  // State: :scheduled  (the queue is scheduled to run, soon)
  else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'scheduled',
      'add-event'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['scheduled', () => ({})];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'scheduled',
      'run-queue'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['running', () => ({})];
  }

  // State: :running (the queue is being processed one event after another)
  else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'add-event'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['running', () => ({})];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'pause'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['paused', () => ({})];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'exception'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['idle', () => ({})];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'finish-run'
    ])
  ) {
    /** TODO: Finish trigger **/ return [];
  }

  //    State: :paused (:flush-dom metadata on an event has caused a temporary pause in processing)
  else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'paused',
      'add-event'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['paused', () => ({})];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'paused',
      'resume'
    ])
  ) {
    /** TODO: Finish trigger **/ return ['running', () => ({})];
  } else {
    /** TODO: Throw an exception here**/

    console.error('Puritan: Router state transition not found');
  }
};

// Create implementation of the EventQueue
const EventQueue = (fsmState, queue, postEventCallbackFns) => {
  // FSM Implementation

  const addEvent = (_, nextEvent) => ({});

  const processFirstEventInQueue = self => ({});

  const runNextTick = self => ({});

  /**
   * Process all the events currently in the queue, but not any new ones.
   * Be aware that events might have metadata which will pause processing.
   */
  const runQueue = self => ({});

  const exception = (self, ex) => ({});

  const pause = (self, laterFn) => ({});

  const callPostEventCallbacks = (_, eventV) => ({});

  const resume = self => ({});

  /**
     The following "case" implements the Finite State Machine.
     Given a "trigger", and the existing FSM state, it computes the new FSM state and the transition action (function).
     */
  const fsmTrigger = (self, trigger, arg) => {
    // TODO: purpose of locking? Block a Java object from mutations? Used for the concurrent programming?

    // TODO: purpose of with-trace?

    // Get new FSM state and an action function
    const [newFsmState, actionFn] = defineNewFsmStateAndTrigger(
      fsmState,
      trigger
    );
  };

  return {
    // Called by dispatch
    push: (self, nextEvent) => ({}),

    // Register a callback function which will be called after each event is processed
    addPostEventCallback: (_, id, callbackFn) => ({}),

    removePostEventCallback: (_, id) => ({}),

    purge: () => ({})
  };
};
