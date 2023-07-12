#define BEE\
import Autobase from'autobase'\
import goodbye from'./goodbye.js'\
import Autodeebee from'hyperdeebee/autodeebee.js'\
export default async function createBee(sdk,topic){const IOCores=await sdk.namespace(topic)\
const localInput=IOCores.get({name:'local-input'})\
const localOutput=IOCores.get({name:'local-output'})\
await Promise.all([localInput.ready(),localOutput.ready()])\
const autobase=new Autobase({inputs:[localInput],localInput,localOutput})\
goodbye(async _=>{console.log('closing bee...')\
await autobase.close()\
await localInput.close()\
await localOutput.close()\
await IOCores.close()})\
return new Autodeebee(autobase)}\