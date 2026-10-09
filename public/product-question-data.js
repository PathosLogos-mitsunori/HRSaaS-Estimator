(function(root){
  'use strict';
  const integrationTypes=[
    {id:'human',label:'人事情報連携',description:'入社・異動・退職等の従業員情報',requires:'labor'},
    {id:'organization',label:'組織情報連携',description:'部門・所属・役職などの組織マスタ',requires:'labor'},
    {id:'attendance',label:'勤怠情報連携',description:'確定した勤怠・休暇・時間情報',requires:'attendance'},
    {id:'payroll',label:'給与情報連携',description:'給与基本・変動・計算結果などの情報',requires:'payroll'}
  ];
  const integrationSteps=[
    {id:'manual',kind:'case',label:'手入力・転記',description:'連携先システムの画面への入力'},
    {id:'convert',kind:'run',label:'連携ファイルの加工',description:'列・コード・形式の変換'},
    {id:'load',kind:'run',label:'連携ファイルの取込',description:'アップロード・取込実行'},
    {id:'reconcile',kind:'run',label:'連携結果の照合',description:'通常時の件数・内容の照合'},
    {id:'exceptions',kind:'exception',label:'連携エラー・対象外データの補正',description:'自動化後も残る人の例外対応'}
  ];
  // 率の範囲はユーザー提示の試算仮定。表示する試算率はレンジの中点。
  const comboQuestions=[
    {id:'registration',label:'人事・給与データの登録',question:'入社・異動・退職時、人事データと給与データをどう登録していますか？',unit:'処理1件',answers:[
      {id:'A',label:'人事・給与の双方へ手入力で二重登録',range:'80～90%',rate:.85},
      {id:'B',label:'人事システムからCSVを出力し、給与へ手動取込',range:'50～70%',rate:.60},
      {id:'C',label:'既に統合型システム内で自動反映',range:'10～20%',rate:.15}
    ]},
    {id:'comparison',label:'給与計算結果の前月比較・異常値確認',question:'計算結果の妥当性を毎月どのように確認していますか？',unit:'月次確認1回',answers:[
      {id:'A',label:'Excel・CSVで前月比較や異常値を手作業で確認',range:'80～90%',rate:.85},
      {id:'B',label:'現行システムの比較機能を使うが全件目視も行う',range:'50～60%',rate:.55},
      {id:'C',label:'RPA・監査ツールで比較を自動化',range:'20～30%',rate:.25}
    ]},
    {id:'collection',label:'計算前データの内容確認・未入力対応',question:'勤怠・変動手当・通勤費等の内容確認や未入力・エラー対応をどう行っていますか？（ファイルの加工・取込・配信は除く）',unit:'月次確認1回',answers:[
      {id:'A',label:'Excel等で収集し、未入力・内容エラーを手作業で確認',range:'70～80%',rate:.75},
      {id:'B',label:'自動取込済みだが、各画面でエラーを探して修正',range:'40～50%',rate:.45}
    ]},
    {id:'simulation',label:'制度変更・給与改定のシミュレーション',question:'制度変更時の影響額試算や検証をどのように行っていますか？',unit:'改定1回',answers:[
      {id:'A',label:'Excelで手計算、または十分な事前試算が難しい',range:'80～90%',rate:.85},
      {id:'B',label:'ベンダーにテスト環境を依頼して検証',range:'60～80%',rate:.70}
    ]}
  ];
  const showIntegration=domains=>new Set(domains).size>=2;
  const eligibleTypes=domains=>{const selected=new Set(domains);return integrationTypes.filter(t=>selected.has(t.requires));};
  root.HR_PRODUCT_QUESTIONS={integrationTypes,integrationSteps,comboQuestions,showIntegration,eligibleTypes};
  if(typeof module!=='undefined')module.exports=root.HR_PRODUCT_QUESTIONS;
})(globalThis);
