
// -- EFFECT CREATORS

export const listen = (event, msg, opts = {}) => (
  { type: 'LISTEN', event, msg, opts }
)

// -- UTILS

export const debounce = (func, wait, immediate) => {
	let timeout

  return function(...args) {
		let context = this

		let later = () => {
			timeout = null
			if (!immediate)
        func.apply(context, args)
		}

    let callNow = immediate && !timeout

    clearTimeout(timeout)
		timeout = setTimeout(later, wait)

    if (callNow)
      func.apply(context, args)
	}
}

export const throttle = (fn, threshhold) => {
  threshhold || (threshhold = 250)

  let last, deferTimer

  return function () {
    let context = this

    let now  = +new Date
      , args = arguments

    if (last && now < last + threshhold) {

      clearTimeout(deferTimer)

      deferTimer = setTimeout(function () {
        last = now
        fn.apply(context, args)
      }, threshhold)

    } else {
      last = now
      fn.apply(context, args)
    }
  }
}
