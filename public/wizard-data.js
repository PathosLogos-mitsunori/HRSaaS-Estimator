(function (root) {
  'use strict';
  const definitions = [
    ['integration', 'データ連携・共創PF', 'データ連携Hub', '人事・組織・勤怠・給与の情報連携を、対象システム数と工程別の人的作業時間から試算します。', [
      ['master', '人事情報の手入力・転記（CSV連携以外）', '入社・異動・昇格などの確定情報を、CSV等のファイル連携を介さず別システムへ手入力・転記する作業。連携ファイルの加工・取込・照合の時間は含めません。', 'ファイル連携を介さない人事情報の手入力・転記', '人事イベント1件'],
      ['convert', '連携ファイルの加工', 'CSV等の列の並替え、形式変更、社員番号・組織コードの変換。手入力・取込操作・結果照合の時間は含めません。', 'CSVの列加工やコード変換', 'ファイル1回'],
      ['upstream', '上流（給与計算システム）からの取込', '給与計算システム等からの出力、取込・受渡し操作。ファイル加工、下流配信、結果照合を含めません。', '上流からのデータ取得・取込操作', '取込1回'],
      ['downstream', '下流システムへの配信', '後続システムへのファイル受渡し、取込・配信操作。上流からの取得、加工、結果照合を含めません。', '下流への配信・取込操作', '配信1回'],
      ['reconcile', '定例の連携結果の照合', '通常の連携前後の件数・値の照合。エラーの調査・補正時間は含めません。', '定例の連携結果の照合', '照合1回'],
      ['exceptions', '連携エラー・対象外データの補正', '自動連携でも人が原因を調べ、修正する例外処理。連携そのものの待ち時間は含めません。', '例外データの調査・補正', '例外1件']
    ]],
    ['payroll', '給与計算', '給与計算SaaS', '月例給与の準備から確認まで、作業を分けて入力します。', [
      ['prepare', '変動データの収集・加工', '勤怠・手当・控除などの収集と給与取込用の加工', '給与データの取りまとめ・加工', '月次処理1回'],
      ['calculate', '給与計算の実行・再計算', '計算処理の操作、エラー確認、必要な再実行', '計算処理の操作・進捗確認', '月次処理1回'],
      ['check', '前月差異・計算結果の確認', '増減対象の抽出、差異理由の確認、チェック資料作成', '前月差異の抽出・確認資料作成', '月次確認1回'],
      ['output', '確定結果の出力・受渡し', '振込・会計など後続処理へのデータ出力と受渡し', '確定データの出力・転記', '受渡し1回']
    ]],
    ['labor', '人事・労務管理', '人事労務SaaS', '情報回収、雇用契約、届出を分けて確認します。', [
      ['collect', '従業員情報・証憑の回収', '入社・扶養変更等の入力依頼、催促、証憑回収', '入力依頼・催促・情報回収', '申請1件'],
      ['review', '申請内容の確認・差戻し', '必須項目・証憑との突合、不備連絡、再提出確認', '未入力・不備の確認と差戻し', '申請1件'],
      ['contract', '雇用契約書の作成・締結', '必要情報の転記、書類作成、配付、締結状況の確認', '契約書への転記・配付・進捗管理', '契約1件'],
      ['forms', '社会保険・雇用保険の書類作成', '入退社・扶養変更等に伴う帳票への転記と確認', '労務帳票への情報転記', '届出1件'],
      ['submit', '届出・完了状況の管理', '提出操作、処理状況の確認、結果の記録', '提出状況の確認・記録', '届出1件'],
      ['update', '従業員情報の更新・後続連携', '確定した住所・家族等のマスタ更新と給与等への連携', '確定情報の再入力・連携', '更新1件']
    ]],
    ['attendance', '勤怠管理', '勤怠管理システム', '打刻・申請漏れの確認と月次締めの工数を入力します。', [
      ['missing', '打刻・申請漏れの確認', '未打刻・未申請者の抽出、本人・承認者への催促', '漏れの抽出と未処理者への催促', '従業員1名・1か月'],
      ['close', '承認・月次締め', '未承認の確認、組織別進捗管理、締め操作', '未承認・締め進捗の確認', '組織1つ・1か月']
    ]],
    ['talent', 'タレントマネジメント', 'タレントマネジメント', '評価運用と人材情報の整理・活用に分けて確認します。', [
      ['evaluation', '評価シートの配付・回収', '対象者・評価者設定、配付、未提出者への催促', '評価配付・回収・進捗管理', '評価対象者1名・1回'],
      ['aggregate', '評価結果の集計', '結果集計、転記、評価調整会議用の資料作成', '評価結果の集計・転記', '評価サイクル1回'],
      ['skills', '人材・スキル情報の更新', '経歴・スキル情報の収集、更新、データ統合', '人材情報の再収集・更新', '従業員1名・1回'],
      ['placement', '配置・育成検討の資料作成', '候補者検索、条件比較、配置・育成資料の作成', '候補者抽出・比較資料作成', '検討資料1回']
    ]],
    ['commute', '通勤費管理', '通勤費管理', '申請、経路確認、金額変更、給与反映を分けて確認します。', [
      ['request', '通勤経路の申請・回収', '入社・転居・勤務地変更時の申請回収と不備連絡', '申請の回収・不備連絡', '申請1件'],
      ['route', '経路・金額の確認', '候補経路の比較、定期代・規程との照合', '経路・運賃の検索と照合', '申請1件'],
      ['refund', '払戻し・運賃改定の計算', '変更対象の抽出、払戻額・新運賃・差額の計算', '払戻し・運賃改定の再計算', '変更1件'],
      ['payroll', '通勤費の給与反映', '確定額の給与用データ作成、取込、照合', '給与データへの転記・連携', '月次処理1回']
    ]],
    ['retirement', '退職金管理', '退職金管理', '履歴管理から退職給付計算までの工数を確認します。', [
      ['history', '制度・加入・勤続履歴の更新', '制度加入情報、勤続期間、等級など計算基礎情報の更新', '制度横断の履歴更新・照合', '更新1件'],
      ['base', '退職時計算データの準備', '対象制度・履歴の確認、基礎データの収集', '複数制度の基礎データ収集', '退職者1名'],
      ['calculate', '給付額の計算・照合', '制度別計算、試算、計算結果の突合', '制度別計算・結果照合', '退職者1名'],
      ['delivery', '委託先への受渡し・結果記録', '給付関連データの受渡し、結果取込、履歴保存', '委託先とのデータ受渡し', '連携1回']
    ]]
  ];
  const domains = definitions.map(([id, name, category, description, tasks]) => ({
    id, name, category, description,
    tasks: tasks.map(([id, label, description, burden, unit]) => ({id, label, description, burden, unit}))
  }));
  const acquisition = {paper:'紙・郵送', email:'メール本文・添付ファイル', file:'CSV・Excelデータ', form:'システムの申請・入力フォーム', auto:'自動連携されたデータ'};
  const exceptions = {rare:'ほとんどない', some:'一部の案件で発生', frequent:'多くの案件で発生'};
  const api = {
    domains, acquisition, exceptions,
    calculate(items, days, hours, cost, coefficients) {
      if (![days,hours,cost].every(Number.isFinite) || !Number.isInteger(days) || days<1 || days>366 || hours<=0 || hours>24 || cost<0) throw new Error('換算前提を確認してください。');
      const capacity=days*hours;
      const calculated=items.map(row=>{
        if(row.model==='fixedRate'){
          if(![row.minutes,row.count,row.fixedRate].every(Number.isFinite)||row.minutes<0||!Number.isInteger(row.count)||row.count<0||row.fixedRate<0||row.fixedRate>1)throw new Error('Combositeの時間・件数・回答を確認してください。');
          const before=row.minutes*row.count/60,saved=before*row.fixedRate;
          return {...row,base:row.fixedRate,integrationFactor:null,strengthFactor:null,rate:row.fixedRate,before,saved,after:before-saved,fte:saved/capacity,amount:saved*cost};
        }
        if(row.model==='measured'){
          if(![row.minutes,row.afterMinutes,row.count].every(Number.isFinite)||row.minutes<0||row.afterMinutes<0||!Number.isInteger(row.count)||row.count<0)throw new Error('工程別の時間・件数を確認してください。');
          const multiplier=row.annualTotal?1:row.count;
          const before=row.minutes*multiplier/60,after=row.afterMinutes*multiplier/60,saved=before-after;
          return {...row,base:null,integrationFactor:null,strengthFactor:null,rate:before?1-after/before:0,before,after,saved,fte:saved/capacity,amount:saved*cost};
        }
        const base=coefficients.workState[row.workState]?.rate;
        const integration=coefficients.integration[row.integration]?.factor;
        const strength=coefficients.strength[row.strength]?.factor;
        if (![base,integration,strength,row.minutes,row.count].every(Number.isFinite) || row.minutes<=0 || row.count<0 || !Number.isInteger(row.count)) throw new Error('業務の回答・時間・件数を確認してください。');
        const rate=row.domain==='integration'&&row.products.includes('pathos')?(row.task==='exceptions'?0:1):Math.min(coefficients.maxRate,base*integration*strength);
        const before=row.minutes*row.count/60, saved=before*rate;
        return {...row,base,integrationFactor:integration,strengthFactor:strength,rate,before,saved,after:before-saved,fte:saved/capacity,amount:saved*cost};
      });
      const sum=k=>calculated.reduce((v,r)=>v+r[k],0);
      return {items:calculated,days,hours,cost,capacity,before:sum('before'),saved:sum('saved'),after:sum('after'),fte:sum('saved')/capacity,amount:sum('saved')*cost};
    }
  };
  root.HR_WIZARD=api;
  if(typeof module!=='undefined') module.exports=api;
})(globalThis);
