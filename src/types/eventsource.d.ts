/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
declare interface EventSourceOptions {
  withCredentials?: boolean;
}

declare module '@heroku/eventsource' {
  class EventSource {
    constructor(url: string, eventSourceOptions: EventSourceOptions);

    addEventListener(event: string, callback: (x: any) => void): void;

    close(): void;
  }

  export = EventSource;
}
