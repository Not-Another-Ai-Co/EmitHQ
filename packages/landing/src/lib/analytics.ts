declare global {
  // eslint-disable-next-line no-var
  var umami:
    | {
        track: (eventName: string, data?: Record<string, string | number | boolean>) => void;
      }
    | undefined;
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof umami !== 'undefined') {
    umami.track(name, props);
  }
}
