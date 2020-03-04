/**
 Application state
 **/

import { from } from 'rxjs';

/**
 Should not be accessed directly by application code.
 Read access goes through subscriptions.
 Updates via event handlers.
 **/
export default () => from({});