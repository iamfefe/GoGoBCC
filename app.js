const E=ReviewEngine, $=id=>document.getElementById(id);
let bank=QUESTION_BANKS[0],ids=bank.questions.map(q=>q.id),KEY=bank.storageKey;
let state,storageOK;
function loadProgress(){
 state=E.fresh(ids);storageOK=true;
 try{const raw=localStorage.getItem(KEY);if(raw)state=E.restore(raw,ids);}catch{storageOK=false;}
}
loadProgress();
function chooseBank(id){
 const selected=QUESTION_BANKS.find(item=>item.id===id);if(!selected)return;
 if(bank.id!==selected.id){bank=selected;ids=bank.questions.map(q=>q.id);KEY=bank.storageKey;loadProgress();}
 render();start();
}
let celebrationTimers=[];
let mode='all',current=null,order=[],answered=false,assisted=false,sessionCount=0,sessionRight=0,soundOn=false,audio=null,lastFocus=null;
const game=$('game'),info=$('info');

const mastered=()=>ids.filter(id=>state.records[id].streak===1).length;
const wrongs=()=>ids.filter(id=>state.records[id].wrong>0&&state.records[id].streak<1);
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('toast-show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('toast-show'),3500);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('save-status').textContent=storageOK?'✓ 進度自動儲存於此瀏覽器':'⚠ 無法自動儲存，離開頁面後進度可能遺失';}
function render(){
 const n=mastered(),pct=Math.round(n/ids.length*100);
 $('progress-count').textContent='已答對 '+n+' / '+ids.length+' 題';
 $('progress-percent').textContent=pct+'%';
 $('study-bar').max=ids.length;$('study-bar').value=n;$('study-bar').textContent=n+' / '+ids.length;
 $('progress-remaining').textContent=n===ids.length?'全部答對！你做到了！':'還有 '+(ids.length-n)+' 題待答對';
 $('progress-attempts').textContent='已作答 '+state.total+' 次';
 $('wrong-count').textContent=wrongs().length;
 const menu=$('bank-menu');menu.replaceChildren();
 for(const item of QUESTION_BANKS){
  const button=document.createElement('button');button.className='bank-button';
  button.dataset.bank=item.id;
  const icon=document.createElement('span');icon.className='bank-icon';icon.textContent='▤';icon.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.className='bank-label';
  const title=document.createElement('strong');title.textContent=item.title;
  const caption=document.createElement('small');caption.textContent=item.questions.length+' 題 · 點選開始複習';
  label.append(title,caption);const arrow=document.createElement('span');arrow.textContent='➜';arrow.setAttribute('aria-hidden','true');
  button.append(icon,label,arrow);button.onclick=()=>chooseBank(item.id);menu.append(button);
 }
 $('tools-title').textContent=bank.title+' · 複習工具';
 $('save-status').textContent=storageOK?'✓ 進度自動儲存於此瀏覽器':'⚠ 無法讀取或儲存，離開頁面後進度可能遺失';
}
function openDialog(d){lastFocus=document.activeElement;if(d!==game&&game.open)game.close();if(d!==info&&info.open)info.close();if(!d.open)d.showModal();}
function closeDialog(d){if(d===game){celebrationTimers.forEach(clearTimeout);celebrationTimers=[];$('confetti').replaceChildren();}d.close();if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>closeDialog(b.closest('dialog')));
function start(m='all',id=null){mode=m;sessionCount=0;sessionRight=0;openDialog(game);if(id!==null)showQuestion(id);else advance();}
function showQuestion(id){
 current=bank.questions.find(q=>q.id===id);answered=false;assisted=false;order=E.shuffle([0,1,2,3]);
 const r=state.records[id];$('game-category').textContent=mode==='wrong'?'♡ 錯題練習':bank.title;
 $('game-body').innerHTML=`<div class="question-meta"><span>原題 ${id} / ${ids.length} · ${mode==='wrong'?'錯題補強':'知識挑戰'}</span><span>${r.wrong?'錯題再挑戰':'答對就過關'} ✦</span></div><h2 class="question-text" id="game-title" tabindex="-1">${current.text}</h2>${current.image?'<img class="question-image" src="'+current.image+'" alt="原始題目中的連接埠外形圖，上寬下窄，兩側斜收，內有接點">':''}<div class="choices" role="group" aria-label="選擇一個答案">${order.map((original,index)=>`<button class="choice" data-original="${original}"><span class="letter">${'ABCD'[index]}</span><span>${current.options[original]}</span><span class="mark" aria-hidden="true"></span></button>`).join('')}</div><div id="feedback" aria-live="polite"></div><div class="game-actions"><button class="text-button" id="hint">💡 給我一個記憶提示</button><span class="small-muted" id="question-foot">選項已亂序 · 可按 1–4 選擇</span></div>`;
 document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>submit(Number(b.dataset.original)));
 $('hint').onclick=()=>{if(answered)return;assisted=true;$('feedback').innerHTML='<div class="memory"><b>💡 記憶補給</b><br>'+current.hint+'<br><small>看懂提示後選答案；答對就過關，進度也會前進。</small></div>';$('hint').disabled=true;};
 $('game-title').focus();
}
function submit(original){
 if(answered)return;answered=true;const ok=original===current.correct,earned=E.answer(state,current.id,ok,assisted);sessionCount++;if(ok)sessionRight++;save();render();
 document.querySelectorAll('.choice').forEach(b=>{b.disabled=true;const id=Number(b.dataset.original);if(id===current.correct){b.classList.add('correct');b.querySelector('.mark').textContent='✓';}else if(id===original){b.classList.add('incorrect');b.querySelector('.mark').textContent='×';}});
 const r=state.records[current.id],title=ok?'答對了！進度往前一步 ✦':'沒關係，看懂解析再試一次！';
 document.querySelector('.question-meta span:last-child').textContent=ok?'★ 本題已過關':'稍後再挑戰';
 const correctIndex=order.indexOf(current.correct);
 $('feedback').innerHTML=`<div class="feedback ${ok?'success':''}"><div class="feedback-title">${title}</div><b>正確答案：${'ABCD'[correctIndex]} · ${current.options[current.correct]}</b><p>${current.explain}</p><div class="memory"><b>🍬 記憶口訣</b><br>${current.hint}</div><p class="small-muted">${ok?'獲得 '+earned+' 學習糖分。 ':''}${r.streak===1?'本題已過關，不會再重複出現。':E.next(state,mode)===current.id?'目前僅剩這題，下一次繼續練習。':'這題已排入稍後重練，換題後還會再遇到。'}</p></div>`;
 $('hint').hidden=true;$('question-foot').textContent=`本輪第 ${sessionCount} 次作答 · 已答對 ${mastered()}/${ids.length}`;
 const next=document.createElement('button');next.id='next';next.className='primary';next.textContent=mastered()===ids.length?'查看完成成果 ✦':!E.next(state,mode)?'查看補強成果 ➜':'下一題 ➜';next.onclick=()=>{if(mastered()===ids.length||!E.next(state,mode))finish();else advance();};document.querySelector('#game .game-actions').append(next);next.focus();
 beep(ok);if(mastered()===ids.length)finish();
}
function advance(){const id=E.next(state,mode);if(id===null)finish();else showQuestion(id);}
function restartPractice(){
 celebrationTimers.forEach(clearTimeout);celebrationTimers=[];$('confetti').replaceChildren();
 state=E.fresh(ids);save();render();start('all');
}
function finish(){
 const all=mastered()===ids.length;$('game-category').textContent=all?'✦ 任務完成':'♡ 補強完成';
 $('game-body').innerHTML=`<div class="summary ${all?'victory':''}">${all?'<div class="victory-stars" aria-hidden="true">✦ ★ ✦</div><div class="score-label">學習完成分數</div><div class="perfect-score"><strong>100</strong><span>分</span></div><div class="victory-ribbon">滿 分 過 關</div>':'<div class="big-emoji">🌟</div>'}<h2 id="game-title" tabindex="-1">${all?'太棒了！全部答對！':'目前沒有待補強的錯題！'}</h2><p>${all?ids.length+' 題全部過關，錯題也都學會了！<br>這是你一步一步練出來的滿分。':'目前的錯題都已答對，或尚未出現錯題。<br>繼續複習其他題目，把進度推到 100% 吧。'}</p><div class="summary-grid"><div><strong>${mastered()}/${ids.length}</strong><small>已過關題目</small></div><div><strong>${state.total}</strong><small>累計作答次數</small></div><div><strong>${state.best}</strong><small>最高連對紀錄</small></div></div>${all?'<button class="primary" id="replay">再放一次彩帶 🎉</button><br>':''}<button class="text-button" id="finish-map">返回首頁</button></div>`;
 $('finish-map').onclick=()=>closeDialog(game);
 const restart=document.createElement('button');restart.id='restart-practice';restart.className='text-button';restart.textContent='重新練習';restart.onclick=restartPractice;
 $('finish-map').after(document.createTextNode(' · '),restart);$('game-title').focus();
 if(all){$('replay').onclick=()=>celebrate(true);celebrate(true);}
}
function celebrate(grand=false){
 celebrationTimers.forEach(clearTimeout);celebrationTimers=[];$('confetti').replaceChildren();
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const colors=['#f05b98','#ffce43','#74d6b2','#a384ec','#63bcea','#ff9271'];
 const burst=()=>{if(!game.open)return;for(let i=0;i<(grand?80:25);i++){const p=document.createElement('i');p.className='confetti-piece '+(i%4===0?'streamer':'');p.style.cssText=`left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*.25}s;--drift:${Math.random()*300-150}px;--spin:${Math.random()*1200-600}deg`;p.onanimationend=()=>p.remove();$('confetti').append(p);}};
 burst();if(grand)[450,1000,1700,2500].forEach(delay=>celebrationTimers.push(setTimeout(burst,delay)));
}
function beep(ok){if(!soundOn)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();[0,.12].forEach((delay,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='sine';o.frequency.value=ok?(i?784:587):(i?260:330);g.gain.setValueAtTime(.05,audio.currentTime+delay);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+delay+.18);o.start(audio.currentTime+delay);o.stop(audio.currentTime+delay+.2);});}catch{}}
function showInfo(html){$('info-body').innerHTML=html;openDialog(info);const h=$('info-title');if(h){h.tabIndex=-1;h.focus();}}
function help(){showInfo(`<h2 id="info-title">歡迎來到 GoGoBCC 🍬</h2><p>目前題庫：${bank.title}。${ids.length} 題各答對一次，把進度推到 100%。</p><ol><li><b>從首頁選擇題庫。</b>先試著自己選答案，選項每次都會重新排列。</li><li><b>答錯就看解析與口訣。</b>系統會在最多三道其他題目後重排這題；若只剩這題，就繼續練。不扣生命、沒有倒數。</li><li><b>每題答對一次就過關。</b>只有答錯的題目會再次出現；重練答對後進度就會前進，看提示後答對也算過關。</li><li><b>答對一題，進度前進一格。</b>每題答對得 10 糖分；${ids.length} 題全部過關，顯示學習完成分數 100 分與彩帶動畫。這個分數表示全部學會，不是首次作答正確率。</li></ol><div class="memory">進度存在這個瀏覽器。各單元的進度分開儲存；共用電腦可使用不同瀏覽器個人檔案。進度不會自動同步到其他裝置。</div><p class="small-muted">解析與口訣為本系統補充，答案依講義末頁。<br>設計參考：<a href="https://www.businessgo.hsbc.com/zh-Hant/article/game_ui_design_skills" target="_blank" rel="noopener">滙豐機滙：五個遊戲類 UI 設計技巧</a>。採原創糖果風格，無 Candy Crush 官方素材。</p>`);}
function notes(){showInfo('<h2 id="info-title">記憶小抄 ▤</h2><p class="small-muted">先讀懂觀念，再回首頁開始複習。小抄本身不增加進度。</p><div class="notes-tools"><input id="search-notes" aria-label="搜尋題目與口訣" placeholder="搜尋觀念，例如：USB、控制、輸出"></div><div id="notes-list"></div>');const draw=()=>{const term=$('search-notes').value.trim().toLowerCase();const filtered=bank.questions.filter(q=>(q.text+q.options.join('')+q.explain+q.hint).toLowerCase().includes(term));$('notes-list').innerHTML=filtered.length?filtered.map(q=>`<details><summary>第 ${q.id} 題 · ${q.text}<span class="tag">答案：${q.options[q.correct]}</span></summary><p>${q.explain}</p><div class="memory">🍬 ${q.hint}</div></details>`).join(''):'<p>找不到符合的觀念，試試其他關鍵字。</p>';};$('search-notes').oninput=draw;draw();}
$('wrong-nav').onclick=()=>start('wrong');$('notes-nav').onclick=notes;$('help').onclick=help;
$('sound').onclick=()=>{soundOn=!soundOn;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'關閉音效':'開啟音效');$('sound').textContent=soundOn?'♫':'♪';toast(soundOn?'音效已開啟':'音效已關閉');beep(true);};
$('restore').onclick=()=>$('restore-file').click();$('restore-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error();const imported=E.restore(await file.text(),ids);showInfo('<h2 id="info-title">匯入學習進度</h2><p>這份存檔已答對 '+ids.filter(id=>imported.records[id].streak===1).length+' / '+ids.length+' 題，將取代目前題庫的進度。請確認這是目前單元的存檔。</p><button class="primary" id="confirm-import">使用這份進度</button>');$('confirm-import').onclick=()=>{state=imported;save();render();closeDialog(info);toast('學習進度已匯入！');};}catch{toast('存檔格式不符，請選擇先前保存的相同單元 JSON 進度檔。');}e.target.value='';};
$('reset').onclick=()=>{showInfo('<h2 id="info-title">準備展開新的冒險？</h2><p>重新開始會清除目前題庫在這個瀏覽器的答題進度與糖分，無法還原。</p><button class="primary" id="confirm-reset">確認重新開始</button>');$('confirm-reset').onclick=()=>{state=E.fresh(ids);save();render();closeDialog(info);toast('新冒險開始，第一顆糖果等著你！');};};
document.addEventListener('keydown',e=>{if(!game.open||info.open||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;if(!answered&&/^[1-4]$/.test(e.key)){e.preventDefault();submit(order[Number(e.key)-1]);}else if(answered&&e.key==='Enter'&&document.activeElement.tagName!=='BUTTON'){$('next')?.click();}});
render();
