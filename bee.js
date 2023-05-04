import Autobase from 'autobase'
import Autodeebee from 'hyperdeebee/autodeebee.js'

export const beeOpts = { keyEncoding: 'binary', valueEncoding: 'binary' }

export default async function createBee (sdk, topic) {
  const IOCores = await sdk.namespace(topic)
  const localInput = IOCores.get({ name: 'local-input' })
  const localOutput = IOCores.get({ name: 'local-output' })
  await Promise.all([localInput.ready(), localOutput.ready()])
  const autobase = new Autobase({ inputs: [localInput], localInput, localOutput })
  return new Autodeebee(autobase, beeOpts)
}
