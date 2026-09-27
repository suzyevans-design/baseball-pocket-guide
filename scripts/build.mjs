import{cp,mkdir,readFile,writeFile}from'node:fs/promises';
await mkdir('dist/client',{recursive:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await cp('public','dist/client',{recursive:true});await cp('worker/index.js','dist/server/index.js');await cp('.openai/hosting.json','dist/.openai/hosting.json');
JSON.parse(await readFile('public/editorial.json','utf8'));JSON.parse(await readFile('public/manifest.webmanifest','utf8'));
console.log('Built dist/client and dist/server/index.js');
