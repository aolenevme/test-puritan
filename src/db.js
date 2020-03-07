/**
 * Application state
 **/

/**
 * Should not be accessed directly by application code.
 * Read access goes through subscriptions.
 * Updates via event handlers.
 **/
// TODO: Elaborate on a correct observable
export default () => new Proxy({}, {});
