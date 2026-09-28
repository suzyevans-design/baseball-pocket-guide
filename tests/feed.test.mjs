import test from 'node:test';
import assert from 'node:assert/strict';
import {apiResponse} from '../worker/index.js';

test('feed works when the hosting runtime forbids default cache access', async () => {
  const originalFetch=globalThis.fetch;
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'caches');
  Object.defineProperty(globalThis,'caches',{configurable:true,get(){throw Error('Default cache forbidden')}});
  globalThis.fetch=async()=>Response.json({dates:[]});
  try {
    const response=await apiResponse(new Request('https://example.com/api/schedule?teamId=112'));
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{dates:[]});
    assert.equal(response.headers.get('Cache-Control'),'public, max-age=60');
    globalThis.fetch=async()=>{throw Error('Network unavailable')};
    assert.equal((await apiResponse(new Request('https://example.com/api/schedule?teamId=112'))).status,502);
  } finally {
    globalThis.fetch=originalFetch;
    if(descriptor)Object.defineProperty(globalThis,'caches',descriptor);
    else delete globalThis.caches;
  }
});
