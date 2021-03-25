// https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource#parameters
declare interface EventSourceOptions {
  withCredentials?: boolean;
}

declare module '@heroku/eventsource' {
  class EventSource {
    constructor(url: string, eventSourceOptions: EventSourceOptions);

    addEventListener(event: string, callback: (x: any) => void): void;

    close(): void;
  }

  export = EventSource
}
