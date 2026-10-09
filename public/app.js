'use strict';
const DATA=globalThis.HR_EFFORT_DATA, W=globalThis.HR_WIZARD;
const LABOR=globalThis.HR_LABOR;
const PRODUCT_Q=globalThis.HR_PRODUCT_QUESTIONS;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=0)=>Number(v).toLocaleString('ja-JP',{minimumFractionDigits:d,maximumFractionDigits:d});
const state={profile:{company:'',size:'',industry:'',workstyle:'',days:'245',hours:'8',cost:'5000'}, domains:Object.fromEntries(W.domains.map(d=>[d.id,{products:[''],answers:{acquisition:'',workState:'',integration:'',exceptions:'',basis:''},tasks:{}}])), result:null};
let page='plans', paidReturn='plans';
const getProduct=id=>DATA.products.find(p=>p.id===id);
const chosen=id=>state.domains[id].products.filter(Boolean);
const otherDomains=()=>W.domains.filter(d=>d.id!=='integration'&&chosen(d.id).length);
const hubChosen=()=>chosen('integration').includes('pathos');
const hubEffective=()=>hubChosen()&&PRODUCT_Q.showIntegration(otherDomains().map(d=>d.id));
const activeDomains=()=>W.domains.filter(d=>chosen(d.id).length&&(d.id!=='integration'||hubEffective()));
const visibleIntegrationTypes=()=>PRODUCT_Q.eligibleTypes(otherDomains().map(d=>d.id));
const answer=(id,field)=>state.domains[id].answers[field];
const taskState=(id,task)=>state.domains[id].tasks[task] ||= {selected:false,strength:'',minutes:'',count:''};
const laborState=()=>state.domains.labor.labor ||= {}, laborProcess=id=>laborState()[id] ||= {selected:false,count:'',method:'',steps:{}};
const laborStep=(process,step)=>laborProcess(process).steps[step] ||= {before:''};
const flowState=id=>(state.domains.integration.flows ||= {})[id] ||= {selected:false,systems:'',manualCount:'0',runs:'0',exceptionCount:'0',steps:{}};
const flowStep=(type,step)=>flowState(type).steps[step] ||= {before:''};
const hubFlowCovered=type=>hubEffective()&&type&&flowState(type).selected;
const comboState=id=>(state.domains.payroll.combo ||= {})[id] ||= {selected:false,answer:'',minutes:'',count:''};
const comboQuestions=()=>PRODUCT_Q.comboQuestions.filter(q=>q.id!=='registration'||!hubFlowCovered('human'));
const laborTransferCovered=step=>hubFlowCovered(step.hubType)||(step.hubType==='human'&&chosen('payroll').includes('combosite')&&comboState('registration').selected&&!hubFlowCovered('human'));
const laborTransferOwner=step=>hubFlowCovered(step.hubType)?'共創PF': 'Combosite';
const laborStepApplicable=(productId,process,step)=>!laborTransferCovered(step)&&!(productId==='smarthrLabor'&&step.hubType);
const laborWorkflows=productId=>(LABOR.products[productId]||[]).filter(w=>!(productId==='smarthrLabor'&&w.label==='給与計算結果データの取込'&&hubFlowCovered('payroll')));
const laborUnits={
  '給与計算結果データの取込':['年間取込回数','回','分／回','1回のデータ取込・照合時間と年間取込回数を入力します。'],
  '給与明細の印刷・配布':['年間の紙明細枚数','枚','分／枚','紙明細1枚の印刷・封入と配布の時間を入力します。'],
  '源泉徴収票データの取込':['年間取込回数','回','分／回','現在データを取り込む場合、その1回の作業時間と年間取込回数を入力します。'],
  '源泉徴収票の印刷':['年間の紙の印刷枚数','枚','分／枚','現在、紙で印刷している枚数と1枚の印刷時間を入力します。'],
  '源泉徴収票の配布':['年間の紙の配布通数','通','分／通','現在、紙で配布している通数と1通の封入・配布時間を入力します。'],
  '住民税決定通知書の紙での受領':['年間の紙通知の受領回数','回','分／回','現在、自治体から紙を受け取り仕分ける1回の時間と年間回数を入力します。'],
  '住民税決定通知書の封入':['年間の封入通数','通','分／通','現在、紙の通知書を封入する1通の時間と年間通数を入力します。'],
  '住民税決定通知書の配布':['年間の紙の配布通数','通','分／通','現在、紙の通知書を配る1通の時間と年間通数を入力します。']
};
const isFixedLaborWorkflow=w=>Boolean(laborUnits[w.label]);
const laborBasis=(w,automated)=>({
  '給与計算結果データの取込':automated?'共創PFによる自動連携を仮定し、取込の人的作業0分':'SmartHRへのデータ取込・照合は導入後も残る仮定',
  '給与明細の印刷・配布':'紙明細を全件電子配付へ変更できた場合の理論値',
  '源泉徴収票データの取込':'SmartHRへのデータ取込・照合は導入後も残る仮定',
  '源泉徴収票の印刷':'紙の源泉徴収票を全件電子配付へ変更できた場合の理論値',
  '源泉徴収票の配布':'紙の源泉徴収票を全件電子配付へ変更できた場合の理論値',
  '住民税決定通知書の紙での受領':'紙の受領・仕分けは導入後も残る仮定',
  '住民税決定通知書の封入':'eLTAXで電子受領し全件電子配付できた場合の理論値',
  '住民税決定通知書の配布':'eLTAXで電子受領し全件電子配付できた場合の理論値'
})[w.label];
const healthInsurance=()=>state.domains.labor.healthInsurance||'';
const healthQuestionNeeded=()=>LABOR.products.smarthrLabor.some(w=>laborProcess(w.id).selected&&w.steps.some(s=>LABOR.isSocialStep(w,s)&&laborStepApplicable('smarthrLabor',laborProcess(w.id),s)));
const opts=(data,value,placeholder='選択してください')=>`<option value="">${esc(placeholder)}</option>`+Object.entries(data).map(([key,item])=>`<option value="${esc(key)}" ${key===value?'selected':''}>${esc(item.label??item)}</option>`).join('');
const basisOptions={actual:'実測・集計済み',estimate:'担当者による概算',temporary:'仮置きの数値'};
const evidenceIssue=d=>basisOptions[answer(d.id,'basis')]?'':'入力した工数・件数の根拠を選択してください。';
function renderEvidence(d){$('#domain-questions').innerHTML+=`<section class="numbered-group evidence-section"><h2>入力した工数・件数の根拠</h2><div class="question-grid">${question(d,'basis','根拠','入力した工数・件数の根拠は？',basisOptions,'概算の精度を確認するために利用します。削減率には反映しません。')}</div></section>`;}
const domainById=id=>W.domains.find(d=>d.id===id);
function profileIssue(){
  const p=state.profile;
  if(!p.size||!p.industry||!p.workstyle)return '従業員規模・業種・働き方を選択してください。';
  if(!p.days||!p.hours||p.cost==='')return '所定労働日数・時間・時間単価を入力してください。';
  try{W.calculate([],Number(p.days),Number(p.hours),Number(p.cost),DATA.coefficients);}catch(e){return '労働日数は1～366の整数、時間は0より大きく24以下、時間単価は0以上で入力してください。';}
  return '';
}
function domainIssue(d){
  const ids=chosen(d.id);if(!ids.length)return '';
  if(d.id==='integration'){
    for(const type of visibleIntegrationTypes()){const f=flowState(type.id);if(!f.selected)continue;
      if(!Number.isInteger(Number(f.systems))||Number(f.systems)<1||f.systems==='')return `「${type.label}」の連携するシステム数を入力してください。`;
      for(const [field,label] of [['manualCount','手入力の年間対応件数'],['runs','ファイル連携の年間連携回数'],['exceptionCount','年間例外対応件数']]){
        if(f[field]===''||!Number.isInteger(Number(f[field]))||Number(f[field])<0)return `「${type.label}」の${label}を0以上の整数で入力してください。`;
      }
      if(Number(f.manualCount)===0&&Number(f.runs)===0)return `「${type.label}」の手入力の対応件数かファイル連携回数を入力してください。`;
      for(const step of PRODUCT_Q.integrationSteps){const cases=step.kind==='case'?f.manualCount:step.kind==='exception'?f.exceptionCount:f.runs;if(Number(cases)===0)continue;const s=flowStep(type.id,step.id);if(s.before===''||!Number.isFinite(Number(s.before))||Number(s.before)<0)return `「${type.label}：${step.label}」の現在の所要時間を確認してください。`;}
    }
    return evidenceIssue(d);
  }
  if(d.id==='payroll'&&ids[0]==='combosite'){
    const selected=comboQuestions().filter(q=>comboState(q.id).selected);if(!selected.length)return '試算するCombositeの業務を1つ以上選んでください。';
    for(const q of selected){const v=comboState(q.id);if(!q.answers.some(a=>a.id===v.answer)||v.minutes===''||Number(v.minutes)<=0||!Number.isFinite(Number(v.minutes))||v.count===''||!Number.isInteger(Number(v.count))||Number(v.count)<0)return `「${q.label}」の現状・時間・年間件数を確認してください。`;}
    return evidenceIssue(d);
  }
  if(d.id==='labor'){
    const productId=ids[0],workflows=laborWorkflows(productId),selected=workflows.filter(w=>laborProcess(w.id).selected);
    if(!selected.length)return '試算する労務業務を1つ以上選んでください。';
    for(const w of selected){const p=laborProcess(w.id);
      if(w.mode!=='annualTotal'&&(!Number.isInteger(Number(p.count))||Number(p.count)<0||p.count===''))return `「${w.label}」の年間件数を入力してください。`;
      if(productId==='smarthrLabor'&&!isFixedLaborWorkflow(w)&&!LABOR.currentMethods[p.method])return `「${w.label}」の現行処理方法を選択してください。`;
      for(const step of w.steps){if(!laborStepApplicable(productId,p,step))continue;const s=laborStep(w.id,step.id);if(s.before===''||Number(s.before)<0||!Number.isFinite(Number(s.before)))return `「${w.label}：${step.label}」の現在時間を入力してください。`;}
    }
    if(productId==='smarthrLabor'&&healthQuestionNeeded()&&!LABOR.healthInsurances[healthInsurance()])return '加入している健康保険組合を選択してください。';
    return evidenceIssue(d);
  }
  const a=state.domains[d.id].answers;
  if(!a.acquisition||!a.workState||!a.integration||!a.exceptions||!a.basis)return '共通の質問（1～4、9）にすべて回答してください。';
  const selected=d.tasks.filter(t=>taskState(d.id,t.id).selected);
  if(!selected.length)return '質問5で試算する業務を1つ以上選んでください。';
  for(const t of selected){const r=taskState(d.id,t.id);
    if(!r.strength)return `「${t.label}」の得意領域の負荷を選択してください。`;
    if(r.minutes===''||!(Number(r.minutes)>0)||r.count===''||!Number.isInteger(Number(r.count))||Number(r.count)<0)return `「${t.label}」の1件当たり時間と年間件数を確認してください。`;
  }
  return '';
}
function showError(message){$('#page-error').textContent=message;if(message)$('#page-error').focus();}
function go(id){
  if(location.hash.slice(1)!==id)history.pushState(null,'',`#${id}`);
  render(id);
}
function render(id){
  if(!['plans','paid','profile','saas','result','consult','details','download-info','download-ready',...W.domains.map(d=>d.id)].includes(id))id='plans';
  if(!['plans','paid','profile'].includes(id)&&profileIssue())id='profile';
  if(id==='integration'&&!hubEffective())id=activeDomains()[0]?.id||'saas';
  if(domainById(id)&&!chosen(id).length)id='saas';
  if(['result','consult','details','download-info','download-ready'].includes(id)&&!state.result)id='profile';
  page=id; const currentSection=domainById(id)?'domain':id;
  ['plans','paid','profile','saas','domain','result','consult','details','download-info','download-ready'].forEach(key=>{$(`#${key}`).hidden=key!==currentSection;});
  $('#step-nav').hidden=['plans','paid'].includes(id);
  showError('');
  if(id==='profile')renderProfile();
  if(id==='saas')renderSaas();
  if(domainById(id))renderDomain(domainById(id));
  if(id==='result')renderResult();
  if(id==='consult')renderConsult();
  if(id==='download-info')renderDownloadInfo();
  if(id==='details')renderDetails();
  renderSteps();
  window.scrollTo(0,0);
  $(`#${currentSection} h1`)?.focus({preventScroll:true});
}
function renderSteps(){
  const steps=[['profile','会社情報'],['saas','導入SaaS'],...activeDomains().map(d=>[d.id,d.name]),['result','結果']];
  $('#steps').innerHTML=steps.map(([id,name],i)=>`<button type="button" data-go="${id}" class="step ${page===id?'current':''}" ${page===id?'aria-current="step"':''}><span>${i+1}</span>${esc(name)}</button>`).join('');
}
function renderSaas(){
  $('#saas-list').innerHTML=W.domains.map(d=>{const ds=state.domains[d.id],products=DATA.products.filter(p=>p.category===d.category);
    return `<section class="saas-choice"><div><h2>${esc(d.name)}</h2><p>${esc(d.description)}</p></div><div class="saas-choice-controls"><div class="saas-row"><label>導入するSaaS<select data-domain="${d.id}" data-saas-index="0">${opts(Object.fromEntries(products.map(p=>[p.id,p.name])),ds.products[0]||'','導入予定なし')}</select></label></div></div></section>`;
  }).join('');
}
function renderProfile(){
  $$('[data-profile]').forEach(e=>{e.value=state.profile[e.dataset.profile];});
  updateCapacity();
}
function updateCapacity(){const p=state.profile;$('#capacity').textContent=Number(p.days)>0&&Number(p.hours)>0?`${fmt(Number(p.days)*Number(p.hours),1)} 時間／年`:'—';}
function question(d,field,n,label,data,note){const value=answer(d.id,field);return `<label class="question"><span class="question-index">${n}</span><span class="question-label">${esc(label)}</span><select data-domain="${d.id}" data-answer="${field}">${opts(data,value)}</select><small>${esc(note)}</small></label>`;}
function renderDomain(d){
  const ids=chosen(d.id),active=activeDomains(),i=active.findIndex(x=>x.id===d.id);
  $('#domain-number').textContent=`${i+1} / ${active.length}`;
  $('#domain-title').textContent=d.name;$('#domain-description').textContent=d.description;
  $('#domain-guide').textContent=d.id==='labor'?'現行の情報取得方法と工程別の現在時間を入力します。導入後時間は資料に基づく試算仮定から自動計算し、連携工程は他領域と重複計上しません。':d.id==='integration'?'情報の種類ごとに、連携するシステム数、手入力の年間対応件数、ファイルの年間連携回数、現在の所要時間を入力します。':'現状の回答は領域内で共通、工数は業務ごとに入力します。';
  $('#domain-back').textContent=i===0?'← SaaS選択':`← ${active[i-1].name}`;
  $('#domain-next').textContent=i===active.length-1?'試算結果を見る →':`次へ：${active[i+1].name} →`;
  if(d.id==='integration'){renderIntegration();renderEvidence(d);return;}
  if(d.id==='payroll'&&ids[0]==='combosite'){renderCombosite();renderEvidence(d);return;}
  if(d.id==='labor'){renderLabor(ids[0]);renderEvidence(d);return;}
  const tasks=d.tasks.map(t=>({t,r:taskState(d.id,t.id)}));
  const selected=tasks.filter(({r})=>r.selected);
  $('#domain-questions').innerHTML=`<div class="question-grid">
    ${question(d,'acquisition','01','必要な情報を主に何で受け取りますか？',W.acquisition,'領域内で共通の受取方法')}
    ${question(d,'workState','02','現在の主な作業環境は？',DATA.coefficients.workState,'紙・Excel・システムの利用状況')}
    ${question(d,'integration','03','後続システムへどう渡しますか？',DATA.coefficients.integration,'手動連携または自動連携')}
    ${question(d,'exceptions','04','個別判断・例外の頻度は？',W.exceptions,'詳細分析の確認材料')}
  </div>
  <section class="numbered-group"><h2><span>05</span>試算する業務を選んでください</h2><div class="task-options">${tasks.map(({t,r})=>`<label class="task-option"><input type="checkbox" data-task="${t.id}" data-field="selected" ${r.selected?'checked':''}><span><strong>${esc(t.label)}</strong><small>${esc(t.description)}</small></span></label>`).join('')}</div></section>
  <div class="numbered-guide"><span>06</span>得意領域の負荷 <span>07</span>1件の時間 <span>08</span>年間件数</div>
  <div class="task-inputs">${selected.length?selected.map(({t,r})=>`<article class="task-entry"><h3>${esc(t.label)}</h3><p>${esc(t.unit)}を1件として数えます。他の業務と時間を重複させないでください。</p><div class="task-fields"><label><b>06</b> ${esc(t.burden)}の工数<select data-task="${t.id}" data-field="strength">${opts(DATA.coefficients.strength,r.strength)}</select></label><label><b>07</b> 1件の実作業時間<div class="unit-field"><input type="number" min="0.1" step="any" inputmode="decimal" placeholder="15" data-task="${t.id}" data-field="minutes" value="${esc(r.minutes)}"><span>分</span></div></label><label><b>08</b> 年間発生件数<div class="unit-field"><input type="number" min="0" step="1" inputmode="numeric" placeholder="120" data-task="${t.id}" data-field="count" value="${esc(r.count)}"><span>件</span></div></label></div></article>`).join(''):'<p class="empty-state">質問5で対象業務を選ぶと、工数の入力欄が表示されます。</p>'}</div>
  <div class="question-grid">${question(d,'basis','09','入力した工数・件数の根拠は？',basisOptions,'概算の精度を確認するために利用します。削減率には反映しません。')}</div>`;
}
function renderIntegration(){
  const types=visibleIntegrationTypes();
  const timeInput=(type,step,unit,help)=>{const v=flowStep(type.id,step.id);return `<div class="labor-step current-only"><strong>${esc(step.label)}<small class="step-help">${esc(step.description)}<br>${esc(help)}</small></strong><label>現在の所要時間<input type="number" min="0" step="any" value="${esc(v.before)}" data-flow="${type.id}" data-flow-step="${step.id}" data-flow-field="before" placeholder="0" aria-label="${esc(type.label)} ${esc(step.label)} 現在の所要時間（${unit}）"><small>${unit}</small></label></div>`;};
  const manual=PRODUCT_Q.integrationSteps.find(s=>s.kind==='case');
  const fileSteps=PRODUCT_Q.integrationSteps.filter(s=>s.kind==='run');
  const exception=PRODUCT_Q.integrationSteps.find(s=>s.kind==='exception');
  $('#domain-questions').innerHTML=`<div class="labor-intro"><strong>共創PFによる情報連携</strong><p>同じ入力・加工・取込・照合を他領域に重複して入力しないでください。対象のない作業は件数または回数を0にします。</p><div class="integration-formulas"><strong>現在の年間工数の計算方法</strong><p>手入力：1件の所要時間 × 年間対応件数 × 連携するシステム数 ÷ 60</p><p>ファイル連携：各工程の1回の所要時間 × 年間連携回数 × 連携するシステム数 ÷ 60</p><p>例外対応：1件の所要時間 × 年間例外対応件数 × 連携するシステム数 ÷ 60</p><p>手入力であれば、1件の情報を入力する時間を入力してください。<br>連携であれば、1回の連携を行うために必要な時間を入力してください。</p></div></div><section class="numbered-group"><h2>試算する情報連携を選択</h2><div class="task-options">${types.map(t=>`<label class="task-option"><input type="checkbox" data-flow="${t.id}" ${flowState(t.id).selected?'checked':''}><span><strong>${esc(t.label)}</strong><small>${esc(t.description)}</small></span></label>`).join('')}</div></section><div class="task-inputs">${types.filter(t=>flowState(t.id).selected).map(t=>{const f=flowState(t.id);return `<article class="task-entry labor-workflow"><h3>${esc(t.label)}</h3><label class="labor-count">連携するシステム数<span class="unit-field"><input type="number" min="1" step="1" value="${esc(f.systems)}" data-flow="${t.id}" data-flow-field="systems" placeholder="例：2"><span>システム</span></span></label><section class="integration-section"><h4>手入力による転記</h4><label class="labor-count">年間対応件数（1システム当たり）<span class="unit-field"><input type="number" min="0" step="1" value="${esc(f.manualCount)}" data-flow="${t.id}" data-flow-field="manualCount"><span>件</span></span></label>${timeInput(t,manual,'分／件','手入力であれば、1件の情報を入力する時間を入力してください。')}</section><section class="integration-section"><h4>ファイルによる連携</h4><label class="labor-count">年間連携回数（1システム当たり）<span class="unit-field"><input type="number" min="0" step="1" value="${esc(f.runs)}" data-flow="${t.id}" data-flow-field="runs"><span>回</span></span></label>${fileSteps.map(step=>timeInput(t,step,'分／回','連携であれば、1回の連携を行うために必要な時間を入力してください。')).join('')}</section><section class="integration-section"><h4>例外対応</h4><label class="labor-count">年間例外対応件数（1システム当たり）<span class="unit-field"><input type="number" min="0" step="1" value="${esc(f.exceptionCount)}" data-flow="${t.id}" data-flow-field="exceptionCount"><span>件</span></span></label>${timeInput(t,exception,'分／件','例外対応1件に必要な時間を入力してください。')}<p class="hint">エラー・対象外データの補正は導入後も同じ時間が残ると仮定します。</p></section></article>`;}).join('')||'<p class="empty-state">該当する情報連携を選んでください。対象がなければ、このページは入力せず次へ進めます。</p>'}</div>`;
}
function renderCombosite(){
  const questions=comboQuestions(),removed=hubFlowCovered('human');
  $('#domain-questions').innerHTML=`<div class="labor-intro"><strong>Combositeの業務別試算</strong><p>現行の業務方法と現在の作業時間を入力してください。連携ファイルの加工・取込・配信は業務間の二重計上を避けるため、給与業務の質問から除きます。</p></div>${removed?'<p class="hint">人事・給与の二重登録は、共創PFの人事情報連携と重複するため表示していません。</p>':''}<section class="numbered-group"><h2>試算する給与業務を選択</h2><div class="task-options">${questions.map(q=>`<label class="task-option"><input type="checkbox" data-combo="${q.id}" ${comboState(q.id).selected?'checked':''}><span><strong>${esc(q.label)}</strong><small>${esc(q.unit)}</small></span></label>`).join('')}</div></section><div class="task-inputs">${questions.filter(q=>comboState(q.id).selected).map(q=>{const v=comboState(q.id);return `<article class="task-entry"><h3>${esc(q.label)}</h3><p>${esc(q.question)}</p><div class="combo-answer"><label>現状に最も近い方法<select data-combo="${q.id}" data-combo-field="answer">${opts(Object.fromEntries(q.answers.map(a=>[a.id,a.label])),v.answer)}</select></label></div><div class="task-fields"><label>現在の実作業時間（${esc(q.unit)}）<span class="unit-field"><input type="number" min="0.1" step="any" value="${esc(v.minutes)}" data-combo="${q.id}" data-combo-field="minutes" placeholder="例：30"><span>分</span></span></label><label>年間発生件数<span class="unit-field"><input type="number" min="0" step="1" value="${esc(v.count)}" data-combo="${q.id}" data-combo-field="count" placeholder="例：12"><span>件</span></span></label></div></article>`;}).join('')||'<p class="empty-state">対象業務を選ぶと、現状と作業時間を入力できます。</p>'}</div>`;
}
function renderLabor(productId){
  const workflows=laborWorkflows(productId),office=productId==='officeStation';
  $('#domain-questions').innerHTML=`<div class="labor-intro"><strong>${esc(getProduct(productId).name)}の業務に合わせた入力</strong><p>${office?'添付の定量効果試算シートの工程と例示値を算定に使います。貴社の現在時間を入力してください。':'SmartHR内で完結する業務を想定します。社会保険・雇用保険の届出は入社・退職などから分離して計上します。健康保険の届出とその他の届出は件数・時間を分け、健保条件は健康保険にだけ適用します。'}</p></div><section class="numbered-group"><h2>対象となる業務を選択</h2><div class="task-options">${workflows.map(w=>`<label class="task-option"><input type="checkbox" data-labor-process="${w.id}" ${laborProcess(w.id).selected?'checked':''}><span><strong>${esc(w.label)}</strong><small>${esc(w.unit)}${w.mode==='annualTotal'?'・年間の作業全体で入力':''}</small></span></label>`).join('')}</div></section>${!office&&healthQuestionNeeded()?`<section class="numbered-group"><h2>社会保険手続きの条件</h2><label class="insurance-question">加入している健康保険組合はどこですか？<select data-health-insurance>${opts(LABOR.healthInsurances,healthInsurance())}</select></label><p class="hint">その他健保でマイナポータル申請ができない場合、対象書類の手作業による作成・提出・完了確認の削減を見込みません。申請可でもその他健保の帳票自動作成は見込まず、対象書類・送信先は個別に確認が必要です。</p></section>`:''}<div class="task-inputs">${workflows.filter(w=>laborProcess(w.id).selected).map(w=>{const p=laborProcess(w.id),steps=w.steps.filter(s=>laborStepApplicable(productId,p,s));return `<article class="task-entry labor-workflow"><h3>${esc(w.label)}</h3>${!office&&/届出/.test(w.label)?'<p class="hint">入社・退職・身上変更などに伴う届出も、この項目で計上してください。健康保険の届出とその他の届出は分け、他業務と同じ作業時間を重複させないでください。</p>':''}${!office&&isFixedLaborWorkflow(w)?`<p class="hint">${esc(laborUnits[w.label][3])}</p>`:''}${w.mode==='annualTotal'?'<p>年間作業全体の分数です。対象者数を掛けません。</p>':`<label class="labor-count">${laborUnits[w.label]?.[0]||'年間発生件数'} <span class="unit-field"><input type="number" min="0" step="1" data-labor-process="${w.id}" data-labor-field="count" value="${esc(p.count)}" placeholder="件数を入力"><span>${laborUnits[w.label]?.[1]||'件'}</span></span></label>`}${!office&&!isFixedLaborWorkflow(w)?`<div class="task-fields"><label>現行の情報取得・処理方法<select data-labor-process="${w.id}" data-labor-field="method">${opts(LABOR.currentMethods,p.method)}</select></label></div>`:''}<div class="labor-heading current-only"><span>工程</span><span>現在の実作業時間</span></div>${steps.map(step=>{const v=laborStep(w.id,step.id),unit=w.mode==='annualTotal'?'分／年':laborUnits[w.label]?.[2]||'分／件';return `<div class="labor-step current-only"><strong>${esc(step.label)}</strong><label>現在 <input type="number" min="0" step="any" data-labor-process="${w.id}" data-labor-step="${step.id}" data-labor-field="before" value="${esc(v.before)}" placeholder="${step.referenceBefore??'分'}" aria-label="${esc(w.label)} ${esc(step.label)} 現在の所要時間"><small>${unit}</small></label></div>`;}).join('')}${steps.length<w.steps.length?'<p class="hint">他領域で計上する連携工程、または対象外の後続連携は除外しています。</p>':''}</article>`;}).join('')||'<p class="empty-state">対象業務を選ぶと、現在の作業時間を入力できます。</p>'}</div>`;
}
function compute(destination='result'){
  if(profileIssue()){go('profile');showError(profileIssue());return;}
  const items=[];
  for(const d of activeDomains()){const issue=domainIssue(d);if(issue){go(d.id);showError(issue);return;}
    if(!chosen(d.id).length)continue;
    if(d.id==='integration'){
      for(const type of visibleIntegrationTypes()){const f=flowState(type.id);if(!f.selected)continue;
        for(const step of PRODUCT_Q.integrationSteps){
          const perSystemCount=Number(step.kind==='case'?f.manualCount:step.kind==='exception'?f.exceptionCount:f.runs);
          if(!perSystemCount)continue;
          const v=flowStep(type.id,step.id),systems=Number(f.systems);
          items.push({model:'measured',products:chosen(d.id),minutes:Number(v.before),afterMinutes:step.kind==='exception'?Number(v.before):0,count:perSystemCount*systems,systems,perSystemCount,countKind:step.kind,annualTotal:false,domain:d.id,domainName:d.name,task:`${type.id}-${step.id}`,label:`${type.label}：${step.label}`,unit:step.kind==='run'?'1システム・1連携':'1システム・1件',basis:step.kind==='exception'?'例外補正は同量残る仮定':'定例連携の人的作業0分',inputBasis:answer(d.id,'basis'),exceptions:'',acquisition:'',workState:'',integration:'',strength:''});
        }
      }
    }else if(d.id==='payroll'&&chosen(d.id)[0]==='combosite'){
      for(const q of comboQuestions()){const v=comboState(q.id);if(!v.selected)continue;const a=q.answers.find(a=>a.id===v.answer);
        items.push({model:'fixedRate',products:chosen(d.id),minutes:Number(v.minutes),count:Number(v.count),fixedRate:a.rate,rateRange:a.range,answer:a.label,domain:d.id,domainName:d.name,task:q.id,label:q.label,unit:q.unit,basis:'ユーザー提示の試算レンジ中点',inputBasis:answer(d.id,'basis'),exceptions:'',acquisition:'',workState:'',integration:'',strength:''});
      }
    }else if(d.id==='labor'){
      for(const w of laborWorkflows(chosen(d.id)[0])){const p=laborProcess(w.id);if(!p.selected)continue;const productId=chosen(d.id)[0];
        for(const s of w.steps){if(!laborStepApplicable(productId,p,s))continue;const v=laborStep(w.id,s.id),minutes=Number(v.before);items.push({model:'measured',products:chosen(d.id),minutes,afterMinutes:LABOR.estimateAfterMinutes(productId,s,minutes,p.method,healthInsurance(),w,hubChosen()),count:w.mode==='annualTotal'?1:Number(p.count),annualTotal:w.mode==='annualTotal',domain:d.id,domainName:d.name,task:w.id,label:`${w.label}：${s.label}`,unit:w.mode==='annualTotal'?'年間全体':laborUnits[w.label]?`1${laborUnits[w.label][1]}`:'1件',fixedLabor:productId==='smarthrLabor'&&isFixedLaborWorkflow(w),basis:productId==='officeStation'?'添付OfficeStation試算シートの工程別比率':laborBasis(w,hubChosen())||'独自仮定：工程基礎率×現行方法係数×健保条件係数',inputBasis:answer(d.id,'basis'),method:p.method,healthInsurance:LABOR.isSocialStep(w,s)?healthInsurance():'',healthFactor:LABOR.healthFactor(healthInsurance(),w,s),stepBaseRate:s.smartBaseRate,referenceBefore:s.referenceBefore,referenceAfter:s.referenceAfter,exceptions:'',acquisition:'',workState:'',integration:'',strength:''});}
      }
    }else for(const t of d.tasks){const r=taskState(d.id,t.id);if(r.selected)items.push({...state.domains[d.id].answers,...r,inputBasis:answer(d.id,'basis'),products:chosen(d.id),minutes:Number(r.minutes),count:Number(r.count),domain:d.id,domainName:d.name,task:t.id,label:t.label,unit:t.unit});}
  }
  if(!items.length){go('saas');showError('少なくとも1つのSaaSを選択してください。');return;}
  const p=state.profile;
  state.result={...W.calculate(items,Number(p.days),Number(p.hours),Number(p.cost),DATA.coefficients),profile:{...p},createdAt:new Date().toISOString()};
  go(destination);
}
function renderResult(){
  const r=state.result;
  $('#result-context').textContent=`${r.profile.company||'貴社'}・${new Set(r.items.map(i=>i.domain)).size}領域・${r.items.length}算定項目`;
  $('#saved-hours').innerHTML=`${fmt(r.saved,1)}<small>時間／年</small>`;
  $('#saved-fte').innerHTML=`${fmt(r.fte,3)}<small>FTE</small>`;
  $('#saved-money').innerHTML=`${fmt(r.amount)}<small>円／年</small>`;
  $('#result-note').textContent=`1FTE＝${fmt(r.capacity,1)}時間／年、時間単価＝${fmt(r.cost)}円。金額は時間の人件費換算でSaaS費用を控除する前の概算です。`;
  $('#review-points').innerHTML=reviewPoints(r).map(point=>`<li>${esc(point)}</li>`).join('');
  $('#result-totals').innerHTML=W.domains.filter(d=>r.items.some(i=>i.domain===d.id)).map(d=>{const rows=r.items.filter(i=>i.domain===d.id),sum=k=>rows.reduce((v,i)=>v+i[k],0);return `<tr><th scope="row">${esc(d.name)}</th><td>${fmt(sum('before'),1)}時間</td><td>${fmt(sum('after'),1)}時間</td><td>${fmt(sum('saved'),1)}時間</td><td>${fmt(sum('fte'),3)}</td><td>${fmt(sum('amount'))}円</td></tr>`;}).join('');
}
function reviewPoints(r){
  const points=[];
  if(r.items.some(i=>i.inputBasis==='temporary'))points.push('仮置きの工数・件数が含まれます。実測値への置き換えが必要です。');
  else if(r.items.some(i=>i.inputBasis==='estimate'))points.push('担当者による概算が含まれます。実測値との照合が必要です。');
  if(r.items.some(i=>i.exceptions==='frequent'))points.push('例外や個別判断が多い業務は、自動化できる範囲を確認してください。');
  if(new Set(r.items.flatMap(i=>i.products)).size>1)points.push('複数SaaS間の連携方式と対象データを確認してください。');
  if(r.items.some(i=>!i.model))points.push('共通係数による領域は作業状態と連携方法を各業務に適用しています。業務ごとに異なる場合は再試算が必要です。');
  if(r.items.some(i=>i.model==='fixedRate'))points.push('Combositeの削減率は提示された幅の中点を仮定した値であり、実測値や製品保証値ではありません。');
  if(r.items.some(i=>i.products.includes('smarthrLabor')&&i.label.startsWith('住民税決定通知書の封入')))points.push('住民税決定通知書は、eLTAXから電子データを受領して電子配付できる前提です。紙での受領が続く場合、封入・配布の削減は成立しません。');
  if(r.items.some(i=>i.products.includes('smarthrLabor')&&i.label.startsWith('源泉徴収票の印刷')))points.push('源泉徴収票を全件電子配付へ切り替えられる前提です。紙対応が残る場合は削減時間を見直してください。');
  if(r.items.some(i=>i.products.includes('smarthrLabor')&&i.label.startsWith('給与明細の印刷・配布')))points.push('紙明細をすべて電子配付へ切り替えられる前提です。電子交付の同意と紙対応が残る従業員を確認してください。');
  if(r.items.some(i=>i.healthInsurance==='otherPaper'))points.push('その他健保（マイナポータル申請不可）の社保書類作成・提出・完了確認は削減を見込んでいません。対象書類と提出方法を確認してください。');
  if(r.items.some(i=>i.healthInsurance==='otherMyna'))points.push('その他健保（マイナポータル申請可）の帳票自動作成には削減を見込んでいません。電子申請できる書類・送信先を個別に確認してください。');
  if(r.items.some(i=>i.products.includes('smarthrLabor')&&i.domain==='labor'))points.push('入社・退職などに伴う社会保険届出は独立した届出項目で計上します。健康保険とその他の届出を分け、情報回収の時間も重複していないか確認してください。');
  if(r.items.some(i=>i.domain==='integration'))points.push('共創PFの連携先システム数・手入力件数・ファイル連携回数・例外件数と、労務・給与領域の業務に同じ時間が重複していないか確認してください。');
  points.push('製品の契約範囲、導入・運用費用、残る確認作業を確認してください。');
  return points;
}
function renderConsult(){
  const r=state.result;
  $('#consult-summary').innerHTML=`<strong>相談に添付する概算</strong><p>${esc(r.profile.company||'会社名未入力')}／${fmt(r.saved,1)}時間／年・${fmt(r.fte,3)} FTE・${fmt(r.amount)}円／年</p><p>対象：${[...new Set(r.items.map(i=>i.domainName))].map(esc).join('、')}</p>`;
  const form=$('#consult-form');form.elements.company.value=r.profile.company||'';
  $('#consult-status').textContent='';
}
function renderDownloadInfo(){
  const form=$('#download-info-form'),p=state.result.profile;
  for(const name of ['company','size','industry','workstyle'])form.elements[name].value=p[name]||'';
}
async function submitConsult(e){
  e.preventDefault();const form=e.currentTarget,button=form.querySelector('[type="submit"]');
  if(!form.reportValidity())return;
  const data=new FormData(form),r=state.result;
  const result={saved:r.saved,fte:r.fte,amount:r.amount,profile:{industry:r.profile.industry},selectedProducts:[...new Set(r.items.flatMap(i=>i.products))].map(id=>getProduct(id).name).join('、'),items:r.items.map(i=>({domainName:i.domainName,productName:i.products.map(id=>getProduct(id).name).join('、'),label:i.label,count:i.count,minutes:i.minutes,rate:i.rate,saved:i.saved,basis:i.basis,inputBasis:i.inputBasis,exceptions:i.exceptions}))};
  button.disabled=true;$('#consult-status').textContent='送信中です…';
  try{
    const response=await fetch('/api/consultations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({company:data.get('company'),contactName:data.get('contactName'),email:data.get('email'),note:data.get('note'),website:data.get('website'),consent:data.get('consent')==='on',result})});
    const body=await response.json();
    if(!response.ok)throw new Error(body.message||'送信できませんでした。');
    $('#consult-status').textContent='相談申込を受け付けました。入力されたメールアドレスに担当者から連絡します。';
    form.querySelectorAll('input,textarea,button[type="submit"]').forEach(el=>el.disabled=true);
  }catch(error){$('#consult-status').textContent=error.message||'送信できませんでした。入力内容を保ったまま再送できます。';button.disabled=false;}
}
function renderDetails(){
  const r=state.result;
  $('#process-plans').innerHTML=[...new Set(r.items.flatMap(i=>i.products))].map(id=>{const p=getProduct(id),labor=LABOR.products[id],selected=laborWorkflows(id).filter(w=>laborProcess(w.id).selected);return `<article class="process-card"><div class="process-head"><p class="eyebrow">${esc(p.category)}</p><h2>${esc(p.name)}</h2><p>試算業務：${labor?selected.map(w=>esc(w.label)).join('、'):r.items.filter(i=>i.products.includes(id)).map(i=>esc(i.label)).join('、')}</p></div><h3>${labor?'資料に沿った対象業務の工程':'標準機能を利用した業務プロセス案'}</h3>${labor?selected.map(w=>`<div class="labor-process"><h3>${esc(w.label)}</h3><ol>${w.steps.map(s=>`<li>${esc(s.label)}</li>`).join('')}</ol></div>`).join(''):`<ol>${p.process.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>`}<div class="process-notes"><div><h3>人が判断すること</h3><p>${esc(p.humanDecision)}</p></div><div><h3>導入前に確認すること</h3><p>${esc(DATA.productDetails[id].conditions)}</p></div></div><a href="${esc(p.officialUrl)}" rel="noopener noreferrer" target="_blank">公式製品情報を確認 ↗</a></article>`;}).join('');
  $('#logic-rows').innerHTML=r.items.map(i=>`<tr><th scope="row">${esc(i.label)}<small>${esc(i.domainName)}${i.rateRange?'・提示範囲 '+esc(i.rateRange):''}・入力根拠：${esc(basisOptions[i.inputBasis]||'未確認')}</small></th><td>${i.model==='measured'?`${fmt(i.before,2)}時間`:`${fmt(i.base*100)}%`}</td><td>${i.model==='measured'?`${fmt(i.after,2)}時間`:(i.model==='fixedRate'?'該当なし':`×${fmt(i.integrationFactor,2)}`)}</td><td>${i.model==='measured'?esc(i.basis)+(i.model==='measured'&&i.products.includes('smarthrLabor')?i.fixedLabor?`<small>現在の所要時間 ${fmt(i.minutes,2)}分／${esc(i.unit.slice(1))} × 年間${fmt(i.count)}${esc(i.unit.slice(1))} ÷ 60</small>`:`<small>基礎率 ${fmt((i.stepBaseRate||0)*100)}% × 現行方法 ${fmt(LABOR.currentMethods[i.method]?.factor??1,2)} × 健保条件 ${fmt(i.healthFactor??1,2)}${i.healthInsurance?`<br>健保：${esc(LABOR.healthInsurances[i.healthInsurance])}`:''}</small>`:i.model==='measured'&&i.products.includes('officeStation')?`<small>参考 ${fmt(i.referenceBefore)}分 → ${fmt(i.referenceAfter)}分／件</small>`:i.model==='measured'&&i.domain==='integration'?`<small>現在の所要時間 ${fmt(i.minutes,2)}分／${i.countKind==='run'?'回':'件'} × 年間${i.countKind==='run'?'連携回数':'対応件数'} ${fmt(i.perSystemCount)}${i.countKind==='run'?'回':'件'}／システム × ${fmt(i.systems)}システム ÷ 60${i.countKind==='exception'?'<br>導入後も同じ時間を計上':''}</small>`:''):(i.model==='fixedRate'?'提示範囲の中点':`×${fmt(i.strengthFactor,2)}`)}</td><td>${fmt(i.rate*100,1)}%</td><td>${fmt(i.saved,1)}時間</td></tr>`).join('');
  const exceptions=r.items.filter(i=>i.exceptions==='frequent');
  $('#exception-note').hidden=!exceptions.length;
  $('#exception-note').textContent=exceptions.length?`例外が多い業務：${exceptions.map(i=>i.label).join('、')}。個別判断の工数は追加ヒアリングで精査が必要です。`:'';
}
function download(){
  const r=state.result;if(!r)return;
  const h=v=>({v,s:2}),n=v=>({v,s:3}),f=v=>({v,s:4}),pct=v=>({v,s:5});
  const p=r.profile;
  const summary=[['HR SaaS 工数削減試算'],['試算上の位置づけ','対象業務を入力したSaaS標準業務にすべて変更できた場合の年間理論値。結果を保証しません。'],['会社名',p.company],['従業員規模',p.size],['業種',p.industry],['働き方',p.workstyle],[],[h('効果'),h('年間値')],['現行時間',n(r.before)],['標準時間（概算）',n(r.after)],['削減時間',n(r.saved)],['削減FTE',f(r.fte)],['削減金額（円）',Math.round(r.amount)],[],['年間労働日数',r.days],['1日労働時間',r.hours],['時間単価（円）',r.cost],[],[h('領域'),h('導入SaaS'),h('業務'),h('数え方'),h('現在の所要時間（分／単位）'),h('年間計上件数・回数'),h('年間現行時間'),h('削減率'),h('年間削減時間'),h('年間標準時間（概算）'),h('削減FTE'),h('年間削減金額（円）')],...r.items.map(i=>[i.domainName,i.products.map(id=>getProduct(id).name).join('、'),i.label,i.unit,n(i.minutes),i.count,n(i.before),pct(i.rate),n(i.saved),n(i.after),f(i.fte),Math.round(i.amount)])];
  const hearing=[['回答と算定根拠'],['SmartHR源泉徴収票・住民税通知','源泉徴収票は印刷枚数・配布通数を別々に入力。住民税決定通知書は紙の受領回数・封入通数・配布通数を別々に入力。紙の受領時間とデータ取込時間は残ると仮定。封入・配布の削減はeLTAX電子受領への切替・電子配付できる場合の理論値。'],['SmartHR給与明細','給与計算結果データの取込は1回の所要時間×年間取込回数、印刷・封入と手渡し・郵送は1枚の所要時間×年間の紙明細枚数で別々に計上。共創PFがあれば給与取込の人的作業は0分、なければSmartHRでも取込が残ると仮定。紙の印刷・配布は電子配付に全面移行できた場合の理論値。共創PFの給与情報連携で同じ作業を計上するときはSmartHR側の取込を表示しない。'],['SmartHR社保の重複防止','入社・退職・身上変更などの届出は独立した「健康保険の届出」「その他の社会保険・雇用保険の届出」に分けて一度だけ計上。健保条件は健康保険にのみ適用。その他健保の帳票自動作成は削減を見込まず、マイナポータル申請不可なら提出・完了確認も見込まない。'],['労務領域','年間件数 ×（入力した現在の所要時間－アプリが算出した導入後時間）÷60。年間一括作業は件数を掛けません。'],['共創PF','手入力・例外対応：各工程の所要時間（分／件）×年間件数／システム×システム数÷60。ファイル連携：各工程の所要時間（分／回）×年間連携回数／システム×システム数÷60。定例連携の導入後人的作業時間は0分、例外補正は同じ時間が残ると仮定。'],['その他の領域',DATA.methodology],[],[h('領域'),h('業務'),h('導入SaaS'),h('情報の取得'),h('作業状態'),h('連携方法'),h('得意領域負荷'),h('例外頻度'),h('入力根拠'),h('算定前提'),h('基礎率'),h('連携係数'),h('導入後の所要時間'),h('削減率'),h('現行方法'),h('健康保険組合'),h('健保条件係数'),h('工程基礎率'),h('参照現在分数'),h('参照導入後分数')],...r.items.map(i=>[i.domainName,i.label,i.products.map(id=>getProduct(id).name).join('、'),W.acquisition[i.acquisition]||'',DATA.coefficients.workState[i.workState]?.label||'',DATA.coefficients.integration[i.integration]?.label||'',DATA.coefficients.strength[i.strength]?.label||'',W.exceptions[i.exceptions]||'',basisOptions[i.inputBasis]||'',i.model?i.basis:'',i.base==null?'':pct(i.base),i.integrationFactor??'',i.afterMinutes??'',pct(i.rate),LABOR.currentMethods[i.method]?.label??'',LABOR.healthInsurances[i.healthInsurance]??'',i.healthFactor??'',i.stepBaseRate==null?'':pct(i.stepBaseRate),i.referenceBefore??'',i.referenceAfter??''])];
  const processes=[[h('SaaS'),h('順番'),h('標準業務プロセス案'),h('人の判断'),h('導入条件'),h('公式情報')]];
  const specific=[[h('対象業務'),h('連携するシステム数'),h('計上単位'),h('年間件数・回数／システム'),h('現在の所要時間（分／件・回）'),h('導入後の所要時間（分／件・回）'),h('回答・前提'),h('削減率の提示範囲'),h('計算に使用した率')],...r.items.filter(i=>i.model).map(i=>[i.label,i.systems??'',i.countKind==='run'?'ファイル連携：回':i.countKind==='case'?'手入力：件':i.countKind==='exception'?'例外対応：件':'',i.perSystemCount??'',i.minutes,i.afterMinutes??'',i.answer??i.basis,i.rateRange??'',i.rate])];
  [...new Set(r.items.flatMap(i=>i.products))].forEach(id=>{const product=getProduct(id);product.process.forEach((s,k)=>processes.push([product.name,k+1,s,k===0?product.humanDecision:'',k===0?DATA.productDetails[id].conditions:'',product.officialUrl]));});
  HrXlsx.downloadWorkbook(`HR_SaaS_領域別工数削減_${new Date().toISOString().slice(0,10)}.xlsx`,[{name:'試算結果',rows:summary,widths:[26,32,38,26,16,16,20,16,20,23,18,23]},{name:'回答と算定根拠',rows:hearing,widths:[26,38,32,30,34,34,20,22,22,46,14,14,18,14,30,40,30,16,20,20]},{name:'個別算定の入力',rows:specific,widths:[45,20,23,26,30,30,45,22,20]},{name:'標準業務プラン',rows:processes,widths:[32,10,65,65,65,50]}]);
}
function renderMethod(){
  const section=(title,body)=>`<section class="method-section"><h3>${esc(title)}</h3>${body}</section>`;
  const equation=(label,expression)=>`<div class="method-equation"><span>${esc(label)}</span><strong>${esc(expression)}</strong></div>`;
  const selected=W.domains.filter(d=>chosen(d.id).length);
  const general=section('計算方法',`${equation('現在の年間工数','現在の所要時間（分／件・回） × 年間件数・回数 ÷ 60')}${equation('年間削減時間','現在の年間工数 － 導入後の年間工数')}${equation('削減FTE','年間削減時間 ÷（年間所定労働日数 × 1日の所定労働時間）')}${equation('年間削減金額','年間削減時間 × 1時間当たりの人件費単価')}<p>年間全体の工数で入力する工程には、件数を掛けません。導入後の時間は選択したSaaSと現行業務の回答から試算します。</p>`);
  let integration='';
  if(hubChosen())integration=section('システム間連携',`<h4>共創PF</h4>${hubEffective()?`${equation('手入力','1件の転記時間 × 年間対応件数 × 連携するシステム数 ÷ 60')}${equation('ファイル連携','各工程の1回の時間 × 年間連携回数 × 連携するシステム数 ÷ 60')}${equation('例外対応','1件の補正時間 × 年間例外件数 × 連携するシステム数 ÷ 60')}<p>定例の手入力・ファイル連携は導入後の人的作業を0分、エラー・対象外データの補正は同じ時間が残ると仮定します。他の領域と重なる作業は一度だけ計上します。</p>`:'<p>他領域のSaaSが2領域以上選ばれていないため、共創PFの質問と連携工数は試算に含めません。</p>'}`);
  let payroll='';
  if(chosen('payroll').includes('combosite')){
    const answered=comboQuestions().filter(q=>comboState(q.id).selected).map(q=>{const a=q.answers.find(a=>a.id===comboState(q.id).answer);return a?`<li><strong>${esc(q.label)}</strong>：${esc(a.label)} → 試算率 ${fmt(a.rate*100,1)}%（提示範囲 ${esc(a.range)}）</li>`:'';}).filter(Boolean);
    payroll=section('給与計算',`<h4>Combosite人事給与</h4>${equation('業務ごとの年間削減時間','現在の所要時間 × 年間発生件数 ÷ 60 × 回答別の削減率')}<p>二重登録、計算結果の確認、計算前データ、制度変更を業務ごとに評価します。回答ごとに提示された削減率の範囲の中点を試算値として使います。共創PFで人事情報連携を計上するときは、同じ登録作業を重ねません。</p>${answered.length?`<div class="method-assumptions"><strong>今回の回答で使う率</strong><ul>${answered.join('')}</ul></div>`:''}`);
  }
  const others=W.domains.filter(d=>!['integration','payroll'].includes(d.id)&&chosen(d.id).length);
  const methodDomainNames={labor:'労務領域',attendance:'勤怠領域',talent:'タレントマネジメント領域',commute:'通勤費管理領域',retirement:'退職金管理領域'};
  const otherSections=others.map(d=>{const id=chosen(d.id)[0],p=getProduct(id);if(!p)return '';
    const method=d.id==='labor'&&id==='smarthrLabor'?`${equation('通常工程の削減率','工程基礎率 × 現行処理方法の係数 × 健保条件の係数')}${equation('導入後の時間','現在の所要時間 ×（1 － 削減率）')}<p>健康保険の届出だけ健保条件を適用します。その他健保では帳票の自動作成を見込まず、マイナポータル申請不可なら提出・完了確認も削減しません。給与計算結果の取込は共創PFが選択されている場合だけ導入後の人的作業を0分とします。紙の給与明細・源泉徴収票の印刷と配布は、電子配付へ全件移行できる場合の理論値です。住民税通知の封入・配布の削減にはeLTAX電子データ受領が必要です。</p>`:
      d.id==='labor'?`${equation('導入後の工程時間','入力した現在時間 ×（提供された試算シートの工程別導入後時間 ÷ 同シートの現在時間）')}<p>オフィスステーションの定量効果試算シートの例示比率を使います。年間全体で入力する工程に対象人数を掛けません。</p>`:
      `${equation('業務ごとの削減率','min（75%、現行作業状態の基礎率 × 連携方法係数 × 得意領域係数）')}${equation('業務ごとの削減時間','1件の現在の所要時間 × 年間件数 ÷ 60 × 削減率')}<p>${esc(p.evidence)} 製品名で率を直接決めるのではなく、選択した業務への回答に共通係数を適用した概算です。</p>`;
    return section(methodDomainNames[d.id]||`${d.name}領域`,`<article class="method-product"><h4>${esc(p.name)}</h4>${method}</article>`);
  }).join('');
  $('#method-sections').innerHTML=general+integration+payroll+otherSections+(!selected.length?'<p class="method-empty">導入するSaaSを選択すると、領域別の算定方法がここに表示されます。</p>':'');
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-go]');if(nav){if(nav.dataset.go==='result'&&!state.result)compute();else go(nav.dataset.go);return;}
});
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.profile){state.profile[el.dataset.profile]=el.value;state.result=null;updateCapacity();}
  if(el.dataset.task&&el.type==='number'){taskState(page,el.dataset.task)[el.dataset.field]=el.value;state.result=null;}
  if(el.dataset.flowField){const type=el.dataset.flow,step=el.dataset.flowStep;if(step)flowStep(type,step)[el.dataset.flowField]=el.value;else flowState(type)[el.dataset.flowField]=el.value;state.result=null;}
  if(el.dataset.comboField&&el.type==='number'){comboState(el.dataset.combo)[el.dataset.comboField]=el.value;state.result=null;}
  if(el.dataset.laborField){const p=el.dataset.laborProcess,s=el.dataset.laborStep;if(s)laborStep(p,s)[el.dataset.laborField]=el.value;else laborProcess(p)[el.dataset.laborField]=el.value;state.result=null;}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.saasIndex!==undefined){state.domains[el.dataset.domain].products=[el.value];state.result=null;renderSaas();}
  if(el.dataset.answer){state.domains[el.dataset.domain].answers[el.dataset.answer]=el.value;state.result=null;}
  if(el.dataset.task&&el.type!=='number'){taskState(page,el.dataset.task)[el.dataset.field]=el.type==='checkbox'?el.checked:el.value;state.result=null;if(el.type==='checkbox'){const key=el.dataset.task;renderDomain(domainById(page));$(`[data-task="${key}"][data-field="selected"]`).focus({preventScroll:true});}}
  if(el.dataset.flow&&el.type==='checkbox'){flowState(el.dataset.flow).selected=el.checked;state.result=null;const key=el.dataset.flow;renderDomain(domainById('integration'));$(`[data-flow="${key}"][type="checkbox"]`).focus({preventScroll:true});}
  if(el.dataset.combo&&el.type==='checkbox'){comboState(el.dataset.combo).selected=el.checked;state.result=null;const key=el.dataset.combo;renderDomain(domainById('payroll'));$(`[data-combo="${key}"][type="checkbox"]`).focus({preventScroll:true});}
  if(el.dataset.comboField==='answer'){comboState(el.dataset.combo).answer=el.value;state.result=null;renderDomain(domainById('payroll'));$(`[data-combo="${el.dataset.combo}"][data-combo-field="answer"]`).focus({preventScroll:true});}
  if(el.dataset.healthInsurance!==undefined){state.domains.labor.healthInsurance=el.value;state.result=null;}
  if(el.dataset.laborField&&el.tagName==='SELECT'){laborProcess(el.dataset.laborProcess)[el.dataset.laborField]=el.value;state.result=null;}
  if(el.dataset.laborProcess&&el.type==='checkbox'){laborProcess(el.dataset.laborProcess).selected=el.checked;state.result=null;const key=el.dataset.laborProcess;renderDomain(domainById('labor'));$(`[data-labor-process="${key}"][type="checkbox"]`).focus({preventScroll:true});}
  if(el.dataset.profile){state.profile[el.dataset.profile]=el.value;state.result=null;updateCapacity();}
});
$('#profile-next').onclick=()=>{const issue=profileIssue();if(issue)showError(issue);else go('saas');};
$('#saas-next').onclick=()=>{const active=activeDomains();if(!active.length)showError('少なくとも1つの領域で導入するSaaSを選択してください。');else go(active[0].id);};
$('#domain-back').onclick=()=>{const active=activeDomains(),i=active.findIndex(d=>d.id===page);go(i===0?'saas':active[i-1].id);};
$('#domain-next').onclick=()=>{const active=activeDomains(),i=active.findIndex(d=>d.id===page),issue=domainIssue(active[i]);if(issue)showError(issue);else if(i===active.length-1)compute();else go(active[i+1].id);};
$('#result-back').onclick=()=>go(activeDomains().at(-1)?.id||'saas');
$('#consult-form').addEventListener('submit',submitConsult);
$('#download-info-form').addEventListener('submit',e=>{e.preventDefault();if(e.currentTarget.reportValidity())go('download-ready');});
$('#download-excel').onclick=download;
$('#print').onclick=()=>window.print();
$('#method-open').onclick=()=>{renderMethod();$('#method-dialog').showModal();};
$('#view-paid').onclick=()=>{paidReturn='plans';go('paid');};
$('#result-paid').onclick=()=>{paidReturn='result';go('paid');};
$('#paid-back').onclick=()=>go(paidReturn);
$('#restart').onclick=()=>{if(!window.confirm('入力内容を消去して、最初からやり直しますか？'))return;state.profile={company:'',size:'',industry:'',workstyle:'',days:'245',hours:'8',cost:'5000'};W.domains.forEach(d=>{state.domains[d.id]={products:[''],answers:{acquisition:'',workState:'',integration:'',exceptions:'',basis:''},tasks:{}};});state.result=null;go('plans');};
window.addEventListener('hashchange',()=>render(location.hash.slice(1)||'plans'));
render(location.hash.slice(1)||'plans');
