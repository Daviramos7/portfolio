import test from 'node:test'
import assert from 'node:assert/strict'
import { createTrackAudio, audioRoomEligible, safeAudioVolume, passAudioWindow } from '../src/scene/trackside/audio.ts'

const state = { mode:'immersive',renderStatus:'ready',documentVisible:true,panelOpen:false,ambientEnabled:true,reducedMotion:false,audio:'on',audioVolume:.25 }
const event = {id:'first',startMs:0,durationMs:4000,direction:'left-to-right'}
function param(){return {value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v}}}
function buffer(channels=2,length=48000,rate=48000){const data=Array.from({length:channels},()=>new Float32Array(length).fill(.2));return {numberOfChannels:channels,length,sampleRate:rate,duration:length/rate,getChannelData:c=>data[c],copyToChannel:(src,c)=>data[c].set(src)}}
function fixture(overrides={}){
  const nodes=[],contexts=[];let requests=0
  function node(props={}){const n={connect(){},disconnect(){this.disconnected=true},...props};nodes.push(n);return n}
  const ctx={state:'suspended',currentTime:0,destination:{},listener:Object.fromEntries(['positionX','positionY','positionZ','forwardX','forwardY','forwardZ','upX','upY','upZ'].map(k=>[k,param()])),
    resume:async()=>{ctx.state='running'},suspend:async()=>{ctx.state='suspended'},close:async()=>{ctx.state='closed'},
    createGain:()=>node({gain:param()}),createPanner:()=>node({positionX:param(),positionY:param(),positionZ:param()}),
    createBufferSource:()=>node({playbackRate:param(),start(){this.started=true},stop(){this.stopped=true}}),
    decodeAudioData:async()=>buffer(),createBuffer:buffer}
  Object.assign(ctx,overrides.context)
  const audio=createTrackAudio({createContext:()=>{contexts.push(ctx);return ctx},fetchAsset:async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}},...overrides.options})
  return {audio,ctx,nodes,contexts,get requests(){return requests}}
}
test('volume/state updates never create context or request samples before gesture',()=>{
  const f=fixture();f.audio.update(state);f.audio.setAudioVolume(1);f.audio.muteAudio();assert.equal(f.contexts.length,0);assert.equal(f.requests,0);assert.equal(f.audio.diagnostics.consent,false);f.audio.dispose()
})
test('available requires real decode/resume; sources are distinct recorded buffers and bounded',async()=>{
  const f=fixture();assert.equal(await f.audio.requestAudioFromGesture(),'on');f.audio.update(state)
  assert.equal(f.requests,3);assert.equal(f.audio.diagnostics.assets,3);assert.equal(f.audio.diagnostics.roomSources,2)
  assert.equal(f.nodes.filter(n=>n.started).length,2);assert.ok(f.audio.diagnostics.masterGain>0)
  f.audio.setAudioVolume(0);assert.equal(f.audio.diagnostics.masterGain,0)
  f.audio.muteAudio();assert.equal(f.ctx.state,'closed');assert.equal(f.audio.diagnostics.assets,0);assert.ok(f.nodes.filter(n=>n.started).every(n=>n.stopped&&n.disconnected));f.audio.muteAudio();f.audio.dispose()
})
test('sample 404, bad decode, denied resume and construction fail safely',async()=>{
  for(const overrides of [
    {options:{fetchAsset:async()=>({ok:false})}},
    {context:{decodeAudioData:async()=>{throw Error('invalid mp3')}}},
    {context:{resume:async()=>{throw Error('not allowed')}}},
    {options:{createContext:()=>{throw Error('unsupported')}}},
  ]){const f=fixture(overrides);assert.equal(await f.audio.requestAudioFromGesture(),'unavailable');assert.equal(f.audio.diagnostics.consent,false);assert.equal(f.audio.diagnostics.context,'none');f.audio.dispose()}
})
test('mute or dispose while awaiting assets cannot turn audio back on',async()=>{
  let resolve;const gate=new Promise(r=>resolve=r)
  const f=fixture({options:{fetchAsset:async()=>{await gate;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}}}})
  const requested=f.audio.requestAudioFromGesture();assert.equal(requested,f.audio.requestAudioFromGesture());f.audio.muteAudio();resolve();assert.equal(await requested,'unavailable');assert.equal(f.audio.diagnostics.context,'none');assert.equal(f.audio.diagnostics.consent,false)
  f.audio.dispose();assert.equal(await f.audio.requestAudioFromGesture(),'unavailable')
})
test('room audio ignores movement/reduced gates but pauses on hide/recruiter/not-ready',async()=>{
  const f=fixture();await f.audio.requestAudioFromGesture()
  f.audio.update({...state,ambientEnabled:false,reducedMotion:true});assert.equal(f.ctx.state,'running');assert.ok(f.audio.diagnostics.masterGain>0)
  for(const change of [{documentVisible:false},{mode:'recruiter'},{renderStatus:'unavailable'}]){f.audio.update({...state,...change});assert.equal(f.ctx.state,'suspended');assert.equal(f.audio.diagnostics.masterGain,0);f.audio.update(state);await Promise.resolve();assert.equal(f.ctx.state,'running')}
  assert.equal(audioRoomEligible(null),false);f.audio.dispose()
})
test('consent mid-pass waits for the next event; one engine follows shared progress/pose and cancellation',async()=>{
  const f=fixture(),tick=(e,p,started)=>f.audio.updatePass(e,p,started,[3,1,-8],[0,2,8],[0,0,-1])
  f.audio.update({...state,audio:'off'});tick(event,.1,true);await f.audio.requestAudioFromGesture();f.audio.update(state);tick(event,.5,false);assert.equal(f.audio.diagnostics.passStarts,0)
  tick(null,0,false);const next={...event,id:'second'};tick(next,0,true);tick(next,.5,false);assert.equal(f.audio.diagnostics.passStarts,1);assert.equal(f.audio.diagnostics.passId,'second');assert.equal(f.ctx.listener.positionY.value,2)
  const engine=f.nodes.filter(n=>n.started).at(-1);assert.equal(engine.playbackRate.value,1)
  f.audio.update({...state,panelOpen:true});assert.equal(f.audio.diagnostics.passId,null);assert.equal(engine.stopped,true);f.audio.dispose()
})
test('invalid volume clamps safely and never grants consent',()=>{for(const [v,want] of [[-2,0],[2,1],[NaN,0],[Infinity,0],[.4,.4]])assert.equal(safeAudioVolume(v),want)})
test('shorter passes select a central source window without changing original pitch',()=>{
  for(const durationMs of [1500,2400,5000]){const window=passAudioWindow(4.788,durationMs);assert.ok(window.seconds<=durationMs/1000);assert.ok(window.offset>=0&&window.offset+window.seconds<=4.788);assert.ok(Math.abs(window.offset+window.seconds/2-4.788/2)<1e-8)}
})
