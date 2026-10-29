(function(root){
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function fresh(ids){return {version:2,records:Object.fromEntries(ids.map(id=>[id,{streak:0,attempts:0,wrong:0}])),queue:[...ids],total:0,correct:0,xp:0,combo:0,best:0};}
 function answer(state,id,ok,assisted=false){
  const r=state.records[id];if(r.streak===1)return 0;r.attempts++;state.total++;state.correct+=ok?1:0;
  r.streak=ok?1:0;
  if(!ok)r.wrong++;
  state.combo=ok?state.combo+1:0;state.best=Math.max(state.best,state.combo);
  const earned=ok?10:0;state.xp+=earned;
  state.queue=state.queue.filter(x=>x!==id&&state.records[x].streak<1);
  if(!ok)state.queue.splice(Math.min(3,state.queue.length),0,id);
  return earned;
 }
 function next(state,mode='all'){return state.queue.find(id=>state.records[id].streak<1&&(mode!=='wrong'||state.records[id].wrong>0))??null;}
 function restore(raw,ids){
  const x=JSON.parse(raw);if(![1,2].includes(x.version)||!x.records||!Array.isArray(x.queue))throw Error('存檔格式不符');
  const s=fresh(ids);
  for(const id of ids){const r=x.records[id];if(!r||!['streak','attempts','wrong'].every(k=>Number.isInteger(r[k])&&r[k]>=0)||r.streak>(x.version===1?2:1)||r.wrong>r.attempts)throw Error('存檔資料不符');s.records[id]={streak:x.version===1?Number(r.attempts>r.wrong):r.streak,attempts:r.attempts,wrong:r.wrong};}
  for(const key of ['total','correct','xp','combo','best']){if(!Number.isInteger(x[key])||x[key]<0)throw Error('存檔數值不符');s[key]=x[key];}
  if(s.correct>s.total||s.total!==Object.values(s.records).reduce((n,r)=>n+r.attempts,0))throw Error('存檔統計不符');
  s.queue=[...new Set(x.queue.filter(id=>ids.includes(id)&&s.records[id].streak<1))];for(const id of ids)if(s.records[id].streak<1&&!s.queue.includes(id))s.queue.push(id);return s;
 }
 const api={shuffle,fresh,answer,next,restore};if(typeof module!=='undefined')module.exports=api;else root.ReviewEngine=api;
})(typeof window!=='undefined'?window:globalThis);
