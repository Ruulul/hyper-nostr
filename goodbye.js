import goodbye from 'graceful-goodbye'

let counter = 0
export default function customGoodbye (cb) {
  goodbye(cb, counter--)
}
