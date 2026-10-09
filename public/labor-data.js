(function(root){
  'use strict';
  // 添付の業務フローおよびOfficeStation定量効果試算シートを工程へ対応付けたもの。
  // referenceAfter は添付シートの例示値で、製品の保証値ではない。
  const office=[
    ['入社手続き','入社1件', [['書類作成・発送',20,7],['提出内容の確認・不備対応',45,10],['給与システムへの入力',20,5],['書類の保管',5,0],['雇用保険・社会保険手続き',30,15]]],
    ['雇用契約更新','契約更新1件', [['契約書の作成・配付',15,7],['合意確認・不備対応',30,5],['給与システムへの入力',10,0],['書類の保管',3,0]]],
    ['退職手続き','退職1件', [['書類作成・発送',15,7],['提出内容の確認・不備対応',10,5],['給与システムへの入力',5,0],['書類の保管',3,0],['雇用保険・社会保険手続き',30,15]]],
    ['身上変更','変更申請1件', [['提出内容の確認・不備対応',10,5],['給与システムへの入力',5,3],['書類の保管',3,3]]],
    ['社内申請','申請1件', [['提出内容の確認・不備対応',20,5],['給与システムへの入力',5,5],['書類の保管',3,0]]],
    ['お知らせ配付','配付1回', [['お知らせの作成・配付',20,10]]],
    ['住民税決定通知書の配付','年間作業全体', [['通知書の仕分け・配付',4500,45]], 'annualTotal'],
    ['マイナンバー収集','収集1件', [['依頼・配付',15,3],['提出内容の確認・不備対応',10,3],['システムへの入力',5,0],['書類の保管',3,0]]]
  ];
  // SmartHRの率は工程ごとの試算仮定であり、メーカー公表の効果保証値ではない。
  // 入社・契約の例示効果（SmartHR公式）と提供されたTo-Beフローを参考に保守的に設定。
  const smart=[
    ['入社手続き・雇用契約','入社1件', [['招待・契約書作成と配付',.85],['本人情報・証憑・マイナンバーの回収',.85],['提出内容の確認・差戻し',.40],['基幹システムへのデータ受渡し',0]]],
    ['契約更新','契約更新1件', [['対象者抽出・条件更新',.70],['契約書の作成・配付',.85],['合意状況の確認・差戻し',.35],['後続システムへのデータ受渡し',0]]],
    ['退職手続き','退職1件', [['退職情報の申請・確認',.50],['退職書類の作成・配付',.55],['後続システムへのデータ受渡し',0]]],
    ['身上変更','変更申請1件', [['申請の回収・不備差戻し',.55],['承認・従業員情報更新',.30],['後続システムへのデータ受渡し',0]]],
    ['健康保険の届出','届出1件', [['不足情報の回収',.50],['帳票作成・確認',.40],['電子申請または対象外の提出',.30],['返戻・完了確認',.20]]],
    ['その他の社会保険・雇用保険の届出','届出1件', [['不足情報の回収',.50],['帳票作成・確認',.40],['電子申請または対象外の提出',.30],['返戻・完了確認',.20]]],
    ['給与計算結果データの取込','取込1回', [['給与計算結果データの取込・照合',0]]],
    ['給与明細の印刷・配布','明細1枚', [['給与明細の印刷・封入',1],['給与明細の手渡し・郵送',1]]],
    ['年末調整','従業員1名・1回', [['案内・申告の回収',.60],['不備確認・差戻し',.40],['給与システムへのデータ受渡し',0]]],
    ['源泉徴収票データの取込','取込1回', [['源泉徴収票データの取込・照合',0]]],
    ['源泉徴収票の印刷','印刷1枚', [['源泉徴収票の印刷',1]]],
    ['源泉徴収票の配布','配布1通', [['源泉徴収票の封入・手渡し・郵送',1]]],
    ['住民税決定通知書の紙での受領','受領1回', [['自治体からの紙通知書の受領・仕分け',0]]],
    ['住民税決定通知書の封入','封入1通', [['住民税決定通知書の封入',1]]],
    ['住民税決定通知書の配布','配布1通', [['住民税決定通知書の手渡し・郵送',1]]]
  ];
  const transferType={'給与システムへの入力':'human','基幹システムへのデータ受渡し':'human','後続システムへのデータ受渡し':'human','給与計算結果データの取込・照合':'payroll','給与システムへのデータ受渡し':'payroll'};
  const currentMethods={paper:{label:'紙・メール中心',factor:1},processedCsv:{label:'Excel・CSVを加工して手動処理',factor:.8},rawCsv:{label:'CSVを無加工で手動取込',factor:.65},system:{label:'既存システム内で処理・自動連携',factor:.25}};
  const downstreamMethods={none:'後続システムなし・対象外',manual:'画面への手入力・転記',processedCsv:'CSVを加工して手動連携',rawCsv:'CSVを無加工で手動連携',auto:'自動連携'};
  const targetScopes={complete:{label:'主な手続きをSmartHR内で完結できる',factor:1},api:{label:'SmartHRと他システムを自動連携する',factor:.9},rawCsv:{label:'SmartHRと他システムをCSVで併用する',factor:.7},partial:{label:'一部の手続きは紙・他システムに残る',factor:.45}};
  const healthInsurances={kyokai:'全国健康保険協会（協会けんぽ）',kantoIts:'関東ITソフトウェア健康保険組合（関東ITS）',tjk:'東京都情報サービス産業健康保険組合（TJK）',otherMyna:'その他（マイナポータル申請可）',otherPaper:'その他（マイナポータル申請不可）'};
  const isSocialStep=(workflow)=>workflow.label==='健康保険の届出';
  const healthFactor=(insurance,workflow,step)=>{
    if(!isSocialStep(workflow,step))return 1;
    // 汎用の「その他健保」では個別の帳票対応が未確認。自動作成の削減は見込まない。
    if(insurance==='otherMyna')return step.label==='帳票作成・確認'?0:1;
    if(insurance==='otherPaper'){
      return step.label==='不足情報の回収'?1:0; // 紙の帳票作成・提出・完了確認は削減を見込まない
    }
    return 1;
  };
  const convert=(groups,vendor)=>groups.map(([label,unit,steps,mode],i)=>({id:`${vendor}-${i}`,label,unit,mode:mode||'perCase',steps:steps.map(([label,first,referenceAfter],j)=>({id:`s${j}`,label,referenceBefore:vendor==='office'?first:undefined,referenceAfter:vendor==='office'?referenceAfter:undefined,smartBaseRate:vendor==='smart'?first:undefined,hubType:transferType[label]||null}))}));
  const products={officeStation:convert(office,'office'),smarthrLabor:convert(smart,'smart')};
  const estimateAfterMinutes=(productId,step,current,method,insurance,workflow,hubAutomated=false)=>{
    if(productId==='officeStation')return current*(step.referenceBefore>0?step.referenceAfter/step.referenceBefore:1);
    if(productId==='smarthrLabor'){
      // 給与データは共創PFが稼働すれば自動連携、そうでなければ取込作業が残る。
      if(workflow.label==='給与計算結果データの取込')return hubAutomated?0:current;
      if(workflow.label==='給与明細の印刷・配布')return 0;
      if(workflow.label==='源泉徴収票データの取込')return current;
      if(workflow.label==='源泉徴収票の印刷'||workflow.label==='源泉徴収票の配布')return 0;
      if(workflow.label==='住民税決定通知書の紙での受領')return current;
      if(workflow.label==='住民税決定通知書の封入'||workflow.label==='住民税決定通知書の配布')return 0;
      return current*(1-(step.smartBaseRate||0)*(currentMethods[method]?.factor??1)*healthFactor(insurance,workflow,step));
    }
    throw new Error('労務SaaSの選択を確認してください。');
  };
  root.HR_LABOR={products,currentMethods,downstreamMethods,targetScopes,healthInsurances,isSocialStep,healthFactor,estimateAfterMinutes};
  if(typeof module!=='undefined')module.exports=root.HR_LABOR;
})(globalThis);
