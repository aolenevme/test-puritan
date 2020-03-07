/**
 * Router loop
 **/

import { compareFsmStatesAndTriggers, nextTick } from './utils';
import { queue } from 'rxjs/internal/scheduler/queue';
import { handle } from './events';

/**
 * TODO: Still don`t understand the purspose of laterFns
 * Events can have metadata which says to pause event processing.
 * event metadata -> "run later" functions
 * @type {{yield: *, flushDom: (function(*=): *)}}
 */
const laterFns = {
  flushDom: f => nextTick(() => nextTick(f)),
  yield: nextTick
};

/**
 * -- FSM Implementation ---------------------------------------------------
 *
 */
const defineNewFsmStateAndTrigger = (
  { arg, fsmState, trigger },
  { addEvent, exception, pause, resume, runNextTick, runQueue }
) => {
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
    return [
      'scheduled',
      () => {
        addEvent(arg);

        return runNextTick();
      }
    ];
  }

  // State: :scheduled  (the queue is scheduled to run, soon)
  else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'scheduled',
      'add-event'
    ])
  ) {
    return ['scheduled', () => addEvent(arg)];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'scheduled',
      'run-queue'
    ])
  ) {
    return ['running', () => runQueue()];
  }

  // State: :running (the queue is being processed one event after another)
  else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'add-event'
    ])
  ) {
    return ['running', () => addEvent(arg)];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'pause'
    ])
  ) {
    return ['paused', () => pause(arg)];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'exception'
    ])
  ) {
    return ['idle', () => exception(arg)];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'running',
      'finish-run'
    ])
  ) {
    // If queue is not an empty array, run next tick or set fsm into the idle state
    return Array.isArray(queue) && queue.length > 0
      ? ['scheduled', () => runNextTick()]
      : ['idle'];
  }

  //    State: :paused (:flush-dom metadata on an event has caused a temporary pause in processing)
  else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'paused',
      'add-event'
    ])
  ) {
    return ['paused', () => addEvent(arg)];
  } else if (
    compareFsmStatesAndTriggers(arrayFsmStateTrigger, [
      'paused',
      'resume'
    ])
  ) {
    return ['running', () => resume()];
  }
  // Throw exception if nothing has matched
  else {
    throw {
      message: 'Re-frame: router state transition not found.',
      fsmState,
      trigger
    };
  }
};

/**
 * ---------------------------------------------------------------------------
 * Create implementation of the EventQueue
 * Final State Machine implementation
 */
const EventQueue = ({ fsmState, postEventCallbackFns, queue }) => {
  // Clean up the queue
  function purge() {
    queue = [];
  }

  // Add new event
  const addEvent = nextEvent => {
    queue.push(nextEvent);
  };

  const processFirstEventInQueue = () => ({});

  // Run next Tick
  const runNextTick = () =>
    nextTick(() => fsmTrigger({ arg: null, trigger: 'run-queue' }));

  /**
   * Process all the events currently in the queue, but not any new ones.
   * Be aware that events might have metadata which will pause processing.
   */
  const runQueue = () => {
    // Get the length of queue
    let queueLength = queue.length;

    // Finish the execution of events
    if (queueLength === 0) {
      fsmTrigger({ arg: null, trigger: 'finish-run' });
    }

    while (queueLength > 0) {
      // TODO: Rewrite into JS: if-let [later-fn (some later-fns (-> queue peek meta keys))]
      const laterFn = () => ({});

      if (laterFn) {
        fsmTrigger({
          arg: laterFn,
          trigger: 'pause'
        });
      } else {
        processFirstEventInQueue();

        // Decrement the length of the queue locally
        --queueLength;
      }
    }
  };

  const exception = ex => {
    // Clean up the queue
    purge();

    throw ex;
  };

  const pause = laterFn =>
    laterFn(() => fsmTrigger({ arg: null, trigger: 'resume' }));

  const resume = () => {
    processFirstEventInQueue();

    runQueue();
  };

  /**
   * The following "case" implements the Finite State Machine.
   * Given a "trigger", and the existing FSM state, it computes the new FSM state and the transition action (function).
   **/
  const fsmTrigger = ({ arg, trigger }) => {
    // Get new FSM state and an action function
    const [newFsmState, actionFn] = defineNewFsmStateAndTrigger(
      { fsmState, arg, trigger },
      { addEvent, exception, pause, resume, runNextTick, runQueue }
    );

    // The "case" above computed both the new FSM state, and the action. Now, make it happen.
    fsmState = newFsmState;
    actionFn && actionFn();
  };

  return {
    // Register a callback function which will be called after each event is processed
    addPostEventCallback: ({ id, callbackFn }) => {
      const isEventContained =
        typeof postEventCallbackFns === 'object' &&
        Object.keys(postEventCallbackFns).includes(id);

      if (isEventContained) {
        console.warn(
          `Re-frame: overwriting existing post event call back with id: ${id}`
        );
      } else {
        postEventCallbackFns = {
          ...postEventCallbackFns,
          ...{ [id]: callbackFn }
        };
      }
    },

    removePostEventCallback: (_, id) => {
      const isEventContained =
        typeof postEventCallbackFns === 'object' &&
        Object.keys(postEventCallbackFns).includes(id);

      if (!isEventContained) {
        console.warn(
          `re-frame: could not remove post event call back with id: ${id}`
        );
      } else {
        postEventCallbackFns = {
          ...postEventCallbackFns,
          ...{ [id]: undefined }
        };
      }
    },

    callPostEventCallbacks: eventV => {
      Object.values(postEventCallbackFns).forEach(callback =>
        callback(eventV, queue)
      );
    },

    // Called by dispatch
    push: arg => fsmTrigger({ arg, trigger: 'add-event' }),

    purge
  };
};

/**
 * ---------------------------------------------------------------------------
 * Event Queue
 * When "dispatch" is called, the event is added into this event queue.  Later,
 * the queue will "run" and the event will be "handled" by the registered function.
 */
const eventQueue = EventQueue({
  fsmState: 'idle',
  queue: [],
  postEventCallbackFns: {}
});

/**
 * ---------------------------------------------------------------------------
 * Dispatching
 */

/**
 * Enqueue `event` for processing by event handling machinery.
 *
 * `event` is a vector of length >= 1. The 1st element identifies the kind of event.
 *
 * Note: the event handler is not run immediately - it is not run
 * synchronously. It will likely be run 'very soon', although it may be
 * added to the end of a FIFO queue which already contain events.
 *
 * Usage:
 * dispatch(["order-pizza", {supreme: 2, meatlovers: 1, veg: 1}])
 */
export const dispatch = event => {
  if (!event) {
    throw `re-frame: you called "dispatch" without an event vector. ${{}}`;
  } else {
    eventQueue.push(event);
  }

  // TODO: Do return null? Really Ensure nil return. See https://github.com/day8/re-frame/wiki/Beware-Returning-False
  return null;
};

/**
 * Synchronously (immediately) process `event`. Do not queue.
 *
 * Generally, don't use this. Instead use `dispatch`. It is an error
 * to use `dispatch-sync` within an event handler.
 *
 * Useful when any delay in processing is a problem:
 * 1. the `:on-change` handler of a text field where we are expecting fast typing.
 * 2  when initialising your app - see 'main' in todomvc examples
 * 3. in a unit test where we don't want the action 'later'
 *
 * Usage:
 * dispatchSync(["sing" "falsetto" 634])
 */
export const dispatchSync = eventV => {
  handle(eventV);

  // Slightly ugly hack. Run the registered post event callbacks.
  eventQueue.callPostEventCallbacks(eventV);

  // TODO: Do return null? Ensure nil return. See https://github.com/day8/re-frame/wiki/Beware-Returning-False
  return null;
};
