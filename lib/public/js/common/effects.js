// -- ACTION CONSTANTS

export const CALL = 'CALL'

// -- ACTION CREATORS

export const call = (fn, ...args) => (
  { type: 'CALL', fn, args }
)
