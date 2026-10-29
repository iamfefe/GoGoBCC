const assert=require('node:assert/strict');
const E=require('./engine.js'),q=require('./questions.js'),ids=q.map(q=>q.id);
assert.equal(q.length,19);assert.equal(q.map(q=>'ABCD'[q.correct]).join(''),'CCDBCDD AADC CAABB CBA'.replaceAll(' ',''));
let s=E.fresh(ids);E.answer(s,1,false);assert.equal(s.queue[3],1);assert.equal(s.records[1].wrong,1);assert.equal(s.records[1].streak,0);
E.answer(s,1,true);assert.equal(s.records[1].streak,1);assert(!s.queue.includes(1));assert.equal(E.next(s,'wrong'),null);
const total=s.total;E.answer(s,1,false);assert.equal(s.total,total);assert.equal(s.records[1].streak,1);
E.answer(s,2,true,true);assert.equal(s.records[2].streak,1);assert(!s.queue.includes(2));
assert.deepEqual(E.restore(JSON.stringify(s),ids),s);assert.throws(()=>E.restore('{}',ids));
const bad=JSON.parse(JSON.stringify(s));bad.records[2].streak=3;assert.throws(()=>E.restore(JSON.stringify(bad),ids));
for(const id of ids.slice(2)){E.answer(s,id,true);}assert.equal(E.next(s),null);assert.equal(s.queue.length,0);assert.equal(ids.filter(id=>s.records[id].streak===1).length,19);assert.equal(s.total,20);assert.equal(s.correct,19);
s=E.fresh([1]);E.answer(s,1,false);assert.equal(E.next(s),1);E.answer(s,1,true);assert.equal(E.next(s),null);
const old=E.fresh([1,2,3]);old.version=1;old.records[1]={streak:2,attempts:2,wrong:0};old.records[2]={streak:0,attempts:3,wrong:2};old.total=5;old.correct=3;const migrated=E.restore(JSON.stringify(old),[1,2,3]);assert.equal(migrated.version,2);assert.equal(migrated.records[1].streak,1);assert.equal(migrated.records[2].streak,1);assert.deepEqual(migrated.queue,[3]);
for(let trial=0;trial<50;trial++){const run=E.fresh(ids),seen=new Set();let previous=0;while(E.next(run)!==null){const id=E.next(run);assert(!seen.has(id));const ok=run.records[id].wrong>=1||Math.random()>.5;E.answer(run,id,ok);const completed=ids.filter(i=>run.records[i].streak===1).length;assert.equal(completed,previous+(ok?1:0));if(ok)seen.add(id);previous=completed;}assert.equal(seen.size,19);}
for(let i=0;i<100;i++){const a=E.shuffle([0,1,2,3]);assert.deepEqual([...a].sort(),[0,1,2,3]);for(const item of q){const displayedCorrect=a.indexOf(item.correct);assert.equal(item.options[a[displayedCorrect]],item.options[item.correct]);}}
console.log('PASS: answer key; correct-once progress; only errors repeat; hinted pass; duplicate guard; legacy migration; 50 randomized full runs; 100% completion; shuffle identity.');
