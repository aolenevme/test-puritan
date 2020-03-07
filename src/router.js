/**
 * Router loop
 **/

import { compareFsmStatesAndTriggers, nextTick } from './utils';
import { queue } from 'rxjs/internal/scheduler/queue';

/**
 * Events can have metadata which says to pause event processing.
 * event metadata -> "run later" functions
 * @type {{yield: *, flushDom: (function(*=): *)}}
 */
const laterFns = {
  flushDom: f => nextTick(() => nextTick(f)),
  yield: nextTick
};

const defineNewFsmStateAndTrigger = (
  { arg, fsmState, self, trigger },
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

        return runNextTick(self);
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
    return ['running', () => runQueue(self)];
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

// Create implementation of the EventQueue
// Final State Machine implementation
const EventQueue = ({ fsmState, postEventCallbackFns, queue }) => {
  // Clean up the queue
  function purge() {
    queue = [];
  }

  // Add new event
  const addEvent = nextEvent => {
    queue.push(nextEvent);
  };

  const processFirstEventInQueue = self => ({});

  // Run next Tick
  const runNextTick = self =>
    nextTick(() =>
      fsmTrigger({ self, arg: null, trigger: 'run-queue' })
    );

  /**
   * Process all the events currently in the queue, but not any new ones.
   * Be aware that events might have metadata which will pause processing.
   */
  const runQueue = () => {
    // Get the length of queue
    let queueLength = queue.length;

    // Finish the execution of events
    if (queueLength === 0) {
      fsmTrigger({ self, arg: null, trigger: 'finish-run' });
    }

    while (queueLength > 0) {
      // TODO: Rewrite into JS: if-let [later-fn (some later-fns (-> queue peek meta keys))]
      const laterFn = () => ({});

      if (laterFn) {
        fsmTrigger({
          self,
          arg: laterFn,
          trigger: 'pause'
        });
      } else {
        processFirstEventInQueue(self);

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
    laterFn(() => fsmTrigger({ self, arg: null, trigger: 'resume' }));

  const callPostEventCallbacks = (_, eventV) => {
    Object.values(postEventCallbackFns).forEach(callback =>
      callback(eventV, queue)
    );
  };

  const resume = () => {
    processFirstEventInQueue(self);

    runQueue();
  };

  /**
   * The following "case" implements the Finite State Machine.
   * Given a "trigger", and the existing FSM state, it computes the new FSM state and the transition action (function).
   **/
  const fsmTrigger = ({ self, arg, trigger }) => {
    // Get new FSM state and an action function
    const [newFsmState, actionFn] = defineNewFsmStateAndTrigger(
      { self, fsmState, arg, trigger },
      { addEvent, exception, pause, resume, runNextTick, runQueue }
    );

    // The "case" above computed both the new FSM state, and the action. Now, make it happen.
    fsmState = newFsmState;
    actionFn && actionFn();
  };

  return {
    // Called by dispatch
    push: (self, arg) =>
      fsmTrigger({ self, arg, trigger: 'add-event' }),

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

    purge
  };
};

/**
 * Event Queue
 * When "dispatch" is called, the event is added into this event queue.  Later,
 * the queue will "run" and the event will be "handled" by the registered function.
 */
const eventQueue = EventQueue({
  fsmState: 'idle',
  queue: [],
  postEventCallbackFns: {}
});
