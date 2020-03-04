/**
 * Router loop
 **/

// TODO: Add laterFns

    const defineNewFsmStateAndTrigger = (fsmState, trigger) => {
        switch ([fsmState, trigger]) {
            /**
             * You should read the following "case" as:
             * [current-FSM-state trigger] -> [new-FSM-state action-fn]
             * So, for example, the next line should be interpreted as:
             * if you are in state ":idle" and a trigger ":add-event"
             * happens, then move the FSM to state ":scheduled" and execute
             * that two-part "do" function.
             */
            case ["idle", 'add-event']: /** TODO: Finish trigger **/ return ["scheduled", () => ({})]

            // State: :scheduled  (the queue is scheduled to run, soon)
            case ["scheduled", 'add-event']: /** TODO: Finish trigger **/ return ["scheduled", () => ({})]
            case ["scheduled", 'run-queue']: /** TODO: Finish trigger **/ return ["running", () => ({})]

            // State: :running (the queue is being processed one event after another)
            case ["running", 'add-event']: /** TODO: Finish trigger **/ return ["running", () => ({})]
            case ["running", 'pause']: /** TODO: Finish trigger **/ return ["paused", () => ({})]
            case ["running", 'exception']: /** TODO: Finish trigger **/ return ["idle", () => ({})]
            case ["running", 'finish-run']: /** TODO: Finish trigger **/ return []

        //    State: :paused (:flush-dom metadata on an event has caused a temporary pause in processing)
            case ["paused", 'add-event']: /** TODO: Finish trigger **/ return ["paused", () => ({})]
            case ["paused", 'resume']: /** TODO: Finish trigger **/ return ["running", () => ({})]

            default: /** TODO: Throw an exception here**/ console.error('Puritan: Router state transition not found')
        }
};

// Create implementation of the EventQueue
const EventQueue = (fsmState, queue, postEventCallbackFns) => {
    // FSM Implementation

    /**
     The following "case" implements the Finite State Machine.
     Given a "trigger", and the existing FSM state, it computes the new FSM state and the transition action (function).
     */
    const fsmTrigger = (self, trigger, arg) => {
        // TODO: purpose of locking? Block a Java object from mutations? Used for the concurrent programming?

        // TODO: purpose of with-trace?

        // Get new FSM state and an action function
        const [newFsmState, actionFn] = defineNewFsmStateAndTrigger(fsmState, trigger);
    }
}