export const listen = (selector, event, msg, opts = {}) => (
  { type: 'LISTEN', event, msg, opts }
)
