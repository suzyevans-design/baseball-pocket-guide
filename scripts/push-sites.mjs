// Receives a short-lived Sites credential over stdin. No credential is written to disk.
import{createInterface}from'node:readline';import{spawnSync}from'node:child_process';
const input=createInterface({input:process.stdin,terminal:false});
input.once('line',line=>{input.close();try{
  const c=JSON.parse(line),u=new URL(c.remote_url);
  if(u.protocol!=='https:'||u.hostname!=='git.chatgpt-team.site'||!c.token||c.auth_mode!=='http_extra_header')throw Error('Invalid Sites credential');
  const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.extraHeader',GIT_CONFIG_VALUE_0:`Authorization: Bearer ${c.token}`};
  const r=spawnSync('git',['push',c.remote_url,`HEAD:refs/heads/${c.branch}`],{env,encoding:'utf8'});
  process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exit(r.status??1);
}catch(e){console.error('Sites push could not complete:',e.message);process.exit(1)}});
