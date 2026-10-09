(function attachEffortData(root) {
  "use strict";

  const productDetails = {
    pathos: {
      processChange: "人事イベントを一度確定し、従業員マスタと予定・確定情報を接続先へ配信する流れに変えます。CSV加工や同じ情報の再入力を減らします。",
      humanWork: "連携エラーの原因確認、例外データの補正、正本システムと更新責任の判断は残ります。",
      conditions: "接続対象、連携項目、更新方向、社員番号などの共通キー、エラー時の再処理方法を確認する必要があります。"
    },
    combosite: {
      processChange: "人事発令・給与条件・勤怠実績を受け取り、計算、差分確認、承認までを同じ処理単位で管理する流れに変えます。",
      humanWork: "例外計算の判断、前月差異の説明、最終承認、制度変更時の妥当性確認は残ります。",
      conditions: "給与体系、遡及、出向、現物給与、仕訳、周辺システムとの受渡しを個別に確認する必要があります。"
    },
    smarthrLabor: {
      processChange: "従業員本人が情報と証憑を入力し、人事が確認・差戻し・承認した後に後続システムへ渡す流れに変えます。",
      humanWork: "本人確認、証憑の妥当性、不備差戻し、例外的な労務判断は残ります。",
      conditions: "社員番号の採番元、会社管理項目、マイナンバー権限、共創PF・給与への連携範囲を確認する必要があります。"
    },
    officeStation: {
      processChange: "従業員情報から労務帳票を作成し、社内承認を経て電子申請へつなぐ流れに変えます。",
      humanWork: "届出要否の判断、記載内容の最終確認、行政からの返戻対応は残ります。",
      conditions: "対象帳票、電子申請の対応範囲、既存従業員マスタとの同期方法、承認権限を確認する必要があります。"
    },
    teamSpirit: {
      processChange: "打刻・申請・承認・工数・経費を同じ基盤で処理し、確定実績を給与や原価管理へ渡す流れに変えます。",
      humanWork: "打刻漏れや例外勤務の確認、上長承認、月次締めの最終判断は残ります。",
      conditions: "就業規則、36協定、工数粒度、経費・稟議の利用範囲、給与連携仕様を確認する必要があります。"
    },
    teamSpiritEx: {
      processChange: "法人・組織・勤務体系ごとのルールを共通基盤で管理し、グループ横断で締めと実績連携を統制します。",
      humanWork: "法人固有ルールの判断、例外承認、全社締め後の差異確認は残ります。",
      conditions: "対象法人、勤務体系、権限分離、データ量、グループ共通化できない運用を確認する必要があります。"
    },
    kinjiro: {
      processChange: "交替勤務や雇用区分別の勤務ルールを設定し、打刻から集計・給与連携までを標準化します。",
      humanWork: "特殊勤務、手当判定、現場での打刻訂正と承認は残ります。",
      conditions: "シフト、変形労働、雇用区分、賃金・手当ルール、打刻機器を確認する必要があります。"
    },
    kintaiMirai: {
      processChange: "拠点固有のシフト・手当・承認を整理し、多拠点の勤怠を一つの運用基盤で締める流れに変えます。",
      humanWork: "個別ルールの判断、現場例外、カスタマイズ部分の保守判断は残ります。",
      conditions: "標準機能と個別対応の境界、拠点差、保守範囲、給与連携を確認する必要があります。"
    },
    talentPalette: {
      processChange: "評価・スキル・配置・育成データを統合し、検索・比較・分析結果を配置や育成の検討へつなげます。",
      humanWork: "評価の妥当性、配置判断、育成方針、分析結果の解釈は人が行います。",
      conditions: "利用する人材項目、評価制度、スキル定義、データ更新責任、分析目的を確認する必要があります。"
    },
    kaonavi: {
      processChange: "人材情報を一元化し、評価シート、スキル、配置検討を段階的に同じデータで運用します。",
      humanWork: "評価調整、配置決定、スキル定義とデータ品質管理は残ります。",
      conditions: "最初に導入する機能、評価シート再現範囲、既存労務データとの同期方法を確認する必要があります。"
    },
    smarthrTalent: {
      processChange: "労務で蓄積した従業員情報を再利用し、評価・配置・スキル・サーベイへ広げる流れに変えます。",
      humanWork: "評価調整、配置や育成の意思決定、項目定義は残ります。",
      conditions: "労務機能の利用状況、評価制度、必要な人材項目、他システムからのデータ取込を確認する必要があります。"
    },
    commute: {
      processChange: "従業員が経路を申請し、経路・金額を確認して承認し、払戻し・運賃改定・給与連携まで管理する流れに変えます。",
      humanWork: "合理的経路の例外判断、特殊な交通手段、最終承認は残ります。",
      conditions: "通勤規程、最安・最短等の判定基準、払戻しルール、給与連携方式を確認する必要があります。"
    },
    lfab: {
      processChange: "退職一時金・DB・DC等の制度情報と履歴を統合し、退職時の計算・確認・案内を一つの流れで管理します。",
      humanWork: "制度適用の例外判断、最終給付額の確認、委託先との調整は残ります。",
      conditions: "制度規程、過去履歴、勤続期間の扱い、外部委託先との受渡し、給与・人事マスタ連携を確認する必要があります。"
    }
  };

  const standardProcesses = {
    join: {
      scId: "SC-01", sourceProcess: "入社", actors: "内定者／人事", automationCeiling: 0.60,
      steps: ["内定者登録・社員番号発番", "本人情報・扶養・口座・通勤・証憑の回収", "雇用契約・労働条件通知の締結", "入社承認・雇用発令", "社保・税・給与・所属・権限への反映"],
      humanDecision: "本人認証、社員番号の採番時点、雇用条件、証憑不備、情報公開範囲を人事が確認します。",
      principle: "雇用契約、社会保険、給与・権限準備を同じ入社イベントで管理します。"
    },
    transfer: {
      scId: "SC-12", sourceProcess: "異動・昇降格", actors: "上司／HRBP／人事", automationCeiling: 0.45,
      steps: ["異動候補・発令日の起案", "ポスト・定員・勤務地・上司・給与影響の確認", "部門・人事による審議と決裁", "必要な本人説明・例外確認", "将来日付の発令登録と予定情報連携", "発令日の切替と反映照合"],
      humanDecision: "異動の妥当性、定員・予算、本人説明、例外条件は人事・部門が判断します。",
      principle: "定期異動は一括処理し、例外案件は個別ワークフローで管理します。"
    },
    promotion: {
      scId: "SC-12", sourceProcess: "異動・昇降格", actors: "上司／HRBP／人事", automationCeiling: 0.40,
      steps: ["昇格・降格候補と発令日の起案", "等級・役職・報酬・予算影響の確認", "人事委員会等による審議と決裁", "本人説明・賃金変更等の個別確認", "発令登録と給与条件の予定連携", "発令日の切替と結果照合"],
      humanDecision: "昇降格の妥当性、評価との整合、降格・賃金減額の個別審査は人が行います。",
      principle: "役職、等級、報酬、所属を別属性で管理し、発令日で一斉に切り替えます。"
    },
    secondment: {
      scId: "SC-13", sourceProcess: "出向・兼務", actors: "上司／HRBP／人事／経理", automationCeiling: 0.35,
      steps: ["目的・期間・所属・費用負担等の条件設計", "会社間契約・本人説明と同意", "社内承認・出向／兼務発令", "給与・社保・勤怠・評価・権限の設定", "会社間精算・延長／解除／復帰管理"],
      humanDecision: "指揮命令、評価者、給与・社保、費用負担、情報アクセスを関係者が決定します。",
      principle: "出向、受入出向、兼務を区分し、期間と終了処理まで一体で管理します。"
    },
    relocation: {
      scId: "SC-14", sourceProcess: "グループ内転籍", actors: "人事／転籍元・転籍先責任者", automationCeiling: 0.38,
      steps: ["転籍日・雇用条件・承継項目の決定", "本人同意・会社間契約", "転籍元の退職と転籍先の入社発令", "社保・税・年金・給与・勤怠の切替", "会社・所属・権限変更と移行照合"],
      humanDecision: "転籍同意、勤続・有休・退職給付の承継、雇用契約条件は人事が確定します。",
      principle: "法人をまたぐため、通常の異動ではなく退職・入社イベントとして管理します。"
    },
    leave: {
      scId: "SC-11", sourceProcess: "休職・復職", actors: "従業員／上司／人事／産業医", automationCeiling: 0.38,
      steps: ["休職申請・診断書等の回収", "休職可否・期間・条件の確認", "承認・休職発令", "給与・社保・給付・勤怠の変更", "アクセス権変更と期間管理"],
      humanDecision: "休職可否、必要書類、給与・社保の扱い、アクセス停止範囲は人事等が判断します。",
      principle: "傷病、育児、介護等の事由別に必要書類と処理を分岐します。"
    },
    return: {
      scId: "SC-11", sourceProcess: "休職・復職", actors: "従業員／上司／人事／産業医", automationCeiling: 0.35,
      steps: ["復職申請・診断書等の回収", "復職可否・就業条件の確認", "承認・復職発令", "給与・社保・勤怠・権限の再開", "勤務配慮と復職後フォロー"],
      humanDecision: "復職可否、就業上の配慮、段階復帰の条件は産業医・人事・上司が判断します。",
      principle: "復職日だけでなく、勤務条件とフォローアップを同じ履歴で管理します。"
    },
    exit: {
      scId: "SC-05", sourceProcess: "退職", actors: "従業員／上司／人事", automationCeiling: 0.50,
      steps: ["退職申請・退職日等の承認", "退職発令・最終給与・貸与品等の精算", "社保・雇用保険・住民税の手続", "源泉徴収票・離職票・退職給付の案内", "利用停止・権限削除・完了照合"],
      humanDecision: "退職日、最終給与、未消化休暇、貸与品、退職給付、アクセス停止期限を確認します。",
      principle: "退職理由別に必要書類を分岐し、発令日とアクセス停止を同期します。"
    }
  };

  const methodPotential = {
    noSystem: { low: 0.30, base: 0.45, high: 0.60 },
    manual: { low: 0.25, base: 0.40, high: 0.55 },
    csvProcessed: { low: 0.18, base: 0.30, high: 0.45 },
    csvRaw: { low: 0.10, base: 0.22, high: 0.35 },
    auto: { low: 0.00, base: 0.05, high: 0.12 }
  };

  const coefficients = {
    workState: {
      paper: { label: "紙・メール中心", rate: 0.55, note: "回収、転記、保管、検索を人が行う" },
      outside: { label: "Excel・システム外作業中心", rate: 0.45, note: "表計算や個別ファイルで加工・照合する" },
      hybrid: { label: "システム利用＋周辺作業が多い", rate: 0.35, note: "システムはあるが表計算や再入力が残る" },
      system: { label: "システム内で概ね完結", rate: 0.20, note: "例外確認以外はシステム内で処理する" }
    },
    integration: {
      manual: { label: "手入力・転記", factor: 1.15, note: "別システムへ画面入力する" },
      csvProcessed: { label: "CSVを加工して手動連携", factor: 1.05, note: "列変換やコード変換をして取り込む" },
      csvRaw: { label: "CSVを無加工で手動連携", factor: 0.95, note: "出力ファイルをそのまま取り込む" },
      auto: { label: "自動連携", factor: 0.75, note: "API等で定期・随時に連携する" },
      none: { label: "連携不要・単一システムで完結", factor: 0.75, note: "前後システムとの受け渡しがない" }
    },
    strength: {
      high: { label: "高い", factor: 1.20, note: "得意領域に大きな工数が集中している" },
      standard: { label: "標準的", factor: 1.00, note: "一定の工数はある" },
      low: { label: "低い・ほぼない", factor: 1.00, note: "高負荷ではないため標準係数を使う" }
    },
    maxRate: 0.75
  };

  const products = [
    {
      id: "pathos", name: "PathosLogos", category: "データ連携Hub", icon: "⇄", officialUrl: "https://www.pathoslogos.jp/erp/",
      evidence: "HR SaaS間の自動連携、人事データ統合、重複入力・CSV加工の削減を主な対象とします。",
      strengthQuestion: "複数システムへの重複入力、CSV加工、マスタ照合にかかる工数は高いですか？",
      strengthDetail: "入社・異動・昇格などの人事イベントを複数SaaSへ反映する作業を含みます。",
      tasks: [["master-sync", "従業員マスタの複数システム反映", "入社・異動・昇格等の情報を各システムへ登録・照合"], ["csv-link", "人事データのCSV加工・連携", "抽出、列加工、コード変換、取込、エラー確認"]],
      process: ["人事イベントと有効日を正本システムで確定", "共通キーと連携対象項目を検証", "接続先SaaSへ自動配信", "エラー・例外だけを担当者が補正"],
      humanDecision: "正本システム、更新責任、例外データの扱いは人が決定します。"
    },
    {
      id: "combosite", name: "Combosite人事給与", category: "給与計算SaaS", icon: "¥", officialUrl: "https://www.pathoslogos.jp/combosite/",
      evidence: "大企業の複雑な給与計算、進捗管理、前月比較、制度変更シミュレーション、自動連携を主な対象とします。",
      strengthQuestion: "給与データの準備、例外計算、前月差異確認、制度変更試算の工数は高いですか？",
      strengthDetail: "月例給与の前処理から計算後チェック、設定変更までを含みます。",
      tasks: [["payroll-input", "給与計算用データの準備・取込", "人事・勤怠・手当データの収集、加工、取込"], ["payroll-check", "給与計算・前月差異・例外チェック", "計算実行、差分原因確認、個別例外の補正"]],
      process: ["人事・勤怠・変動情報を自動収集", "月例処理をガイドに沿って実行", "前月差異と原因候補を確認", "例外補正後に承認し結果を連携"],
      humanDecision: "例外計算の妥当性、差異理由、最終承認は人が判断します。"
    },
    {
      id: "smarthrLabor", name: "SmartHR（労務管理）", category: "人事労務SaaS", icon: "労", officialUrl: "https://smarthr.jp/labor-management/function/agreement/",
      evidence: "従業員情報収集、雇用契約、入社書類、行政手続き書類作成・電子申請を主な対象とします。",
      strengthQuestion: "入社情報・証憑の回収、雇用契約、労務手続きの作成・提出工数は高いですか？",
      strengthDetail: "従業員への依頼、催促、不備差戻し、転記、書類作成を含みます。",
      tasks: [["onboarding", "入社情報・証憑回収と雇用契約", "本人への依頼、回収、確認、差戻し、契約締結"], ["labor-procedure", "社会保険・雇用保険等の手続き", "届出要否確認、書類作成、申請、返戻対応"]],
      process: ["従業員へ入力フォームと必要書類を依頼", "本人入力データと証憑を確認・差戻し", "契約書・届出書類へデータを反映", "電子締結・電子申請後に人事データを更新"],
      humanDecision: "証憑の妥当性、手続き要否、例外的な労務判断は人が行います。"
    },
    {
      id: "officeStation", name: "オフィスステーション 労務", category: "人事労務SaaS", icon: "申", officialUrl: "https://www.officestation.jp/roumu/",
      evidence: "労務手続き、帳票作成、申請・承認、従業員情報管理を主な対象とします。",
      strengthQuestion: "社会保険・労働保険の帳票作成、申請、進捗管理の工数は高いですか？",
      strengthDetail: "入退社・扶養変更等の届出、帳票転記、提出状況確認を含みます。",
      tasks: [["social-insurance", "社会保険・労働保険の届出", "対象者確認、帳票作成、申請、返戻・完了確認"], ["labor-forms", "労務帳票の作成・配付・回収", "従業員情報からの帳票作成と進捗管理"]],
      process: ["従業員マスタから対象者・手続きを特定", "必要帳票へ登録情報を反映", "社内確認・承認後に申請", "返戻・完了情報を記録し関係者へ通知"],
      humanDecision: "届出要否、記載内容、行政からの返戻対応は人が判断します。"
    },
    {
      id: "teamSpirit", name: "TeamSpirit", category: "勤怠管理システム", icon: "時", officialUrl: "https://www.teamspirit.com/",
      evidence: "勤怠、工数、経費、稟議を同一基盤で扱い、勤怠と工数の一致や原価把握を主な対象とします。",
      strengthQuestion: "勤怠の修正・承認と、工数・経費・プロジェクト原価の突合工数は高いですか？",
      strengthDetail: "打刻漏れ、申請、36協定確認、勤怠と工数の不一致確認を含みます。",
      tasks: [["attendance-close", "勤怠申請・承認・月次締め", "打刻確認、未申請催促、例外訂正、締め処理"], ["project-hours", "勤怠と工数・経費の照合", "案件別工数、勤怠時間、経費・原価の突合"]],
      process: ["打刻・申請と案件別工数を同じ画面で登録", "上長が例外・法令アラートを確認", "勤怠と工数の不一致を解消", "確定実績を給与・原価管理へ連携"],
      humanDecision: "例外勤務、訂正理由、上長承認、月次締めは人が確認します。"
    },
    {
      id: "teamSpiritEx", name: "TeamSpirit Enterprise", category: "勤怠管理システム", icon: "企", officialUrl: "https://www.teamspirit.com/",
      evidence: "大企業・グループ企業の複雑な勤務体系や組織を横断した勤怠管理を主な対象とします。",
      strengthQuestion: "複数法人・大規模組織の勤務体系差、締め日差、横断集計の工数は高いですか？",
      strengthDetail: "法人別ルール、権限分離、グループ横断の締め・照合を含みます。",
      tasks: [["group-attendance", "複数法人・組織の勤怠締め", "法人・勤務体系別の締め進捗と例外確認"], ["group-report", "グループ横断の勤怠集計・報告", "共通指標への変換、集計、差異照合"]],
      process: ["法人・組織・勤務体系別ルールを共通基盤へ設定", "各組織で申請・承認と例外確認", "法人別締めを統合して全社確定", "給与・分析基盤へ確定実績を配信"],
      humanDecision: "法人固有ルール、権限、全社締め後の差異は人が判断します。"
    },
    {
      id: "kinjiro", name: "Universal 勤次郎", category: "勤怠管理システム", icon: "勤", officialUrl: "https://www.kinjiro-e.com/",
      evidence: "多様な雇用・勤務形態、交替勤務、複雑な就業ルールの管理を主な対象とします。",
      strengthQuestion: "交替勤務、変形労働、雇用区分別ルール、手当判定の工数は高いですか？",
      strengthDetail: "シフト実績集計、特殊勤務、雇用区分別の締め・給与連携を含みます。",
      tasks: [["shift-rule", "交替勤務・変形労働の集計", "シフト、夜勤、変形期間、例外勤務の判定"], ["allowance-rule", "勤務実績から手当・給与項目を判定", "雇用区分・勤務条件別の集計と給与連携"]],
      process: ["雇用区分・勤務体系別ルールを設定", "打刻とシフト予定を自動照合", "例外・特殊勤務だけを承認", "確定実績と手当情報を給与へ連携"],
      humanDecision: "特殊勤務、手当条件、打刻訂正の承認は人が行います。"
    },
    {
      id: "kintaiMirai", name: "キンタイミライ", category: "勤怠管理システム", icon: "拠", officialUrl: "https://kintaimirai.jp/",
      evidence: "大規模・多拠点の固有ルール、高いカスタマイズ性、導入支援を主な対象とします。",
      strengthQuestion: "多拠点の固有シフト・手当・承認ルールを集計・統制する工数は高いですか？",
      strengthDetail: "店舗・物流・宿泊等の拠点差、個別ルール、全社締めを含みます。",
      tasks: [["multi-site", "多拠点の勤怠回収・締め統制", "拠点別進捗、未処理、差異の確認と全社締め"], ["custom-rule", "拠点固有ルール・手当の判定", "シフト・手当・承認経路の個別条件処理"]],
      process: ["拠点別の固有ルールと承認経路を設定", "各拠点で打刻・申請・一次承認", "本部が例外と締め進捗を横断確認", "確定データを給与・基幹へ連携"],
      humanDecision: "標準機能と個別対応の境界、拠点例外は人が判断します。"
    },
    {
      id: "talentPalette", name: "タレントパレット", category: "タレントマネジメント", icon: "才", officialUrl: "https://www.pa-consul.co.jp/talentpalette/",
      evidence: "人材データ分析、評価、最適配置、育成、スキル、エンゲージメントを幅広く扱います。",
      strengthQuestion: "評価・スキル・配置・育成データの収集、集計、分析にかかる工数は高いですか？",
      strengthDetail: "評価進捗、スキル棚卸し、配置案比較、人的資本分析を含みます。",
      tasks: [["talent-evaluation", "人事評価の回収・進捗・集計", "評価シート配付、催促、集計、調整資料作成"], ["talent-analysis", "スキル・配置・育成の分析", "人材データ統合、候補抽出、比較、レポート作成"]],
      process: ["評価・経歴・スキル等の人材データを統合", "対象者・評価者へワークフローを配信", "進捗とデータ品質を確認", "分析結果を配置・育成の検討へ利用"],
      humanDecision: "評価の妥当性、配置・育成方針、分析結果の解釈は人が行います。"
    },
    {
      id: "kaonavi", name: "カオナビ", category: "タレントマネジメント", icon: "顔", officialUrl: "https://www.kaonavi.jp/",
      evidence: "人材情報一元化、評価シート再現、スキル管理・育成、最適配置を主な対象とします。",
      strengthQuestion: "人材情報の更新、評価シート運用、スキル・配置検討の工数は高いですか？",
      strengthDetail: "Excel評価の配付・回収、顔と人材情報の検索、配置案作成を含みます。",
      tasks: [["kaonavi-evaluation", "評価シートの配付・回収・集計", "現行評価様式の運用、進捗確認、集計"], ["people-database", "人材データ・スキル・配置情報の更新", "社員情報の一元化、検索、配置検討"]],
      process: ["既存の人材項目と評価様式をシステム化", "社員・評価者がデータを入力・更新", "進捗と未入力を自動把握", "集約データを検索・配置・育成へ再利用"],
      humanDecision: "評価調整、配置決定、スキル定義は人が行います。"
    },
    {
      id: "smarthrTalent", name: "SmartHR（タレントマネジメント）", category: "タレントマネジメント", icon: "人", officialUrl: "https://smarthr.jp/talent-management/",
      evidence: "労務で蓄積した従業員データを人事評価、配置、スキル、サーベイ等へ活用します。",
      strengthQuestion: "労務データを評価・配置・スキル・サーベイへ転記・再集計する工数は高いですか？",
      strengthDetail: "従業員データの再収集、評価進捗、配置資料、スキル情報更新を含みます。",
      tasks: [["smarthr-talent-flow", "労務データを使った評価・サーベイ運用", "対象者設定、配付、進捗、結果集計"], ["smarthr-talent-use", "配置・スキル・人材データ活用", "人材情報の再収集、可視化、配置検討"]],
      process: ["労務で蓄積した最新の従業員情報を利用", "評価・サーベイ・スキル収集を配信", "回答・進捗・データを自動集約", "配置・育成・組織分析へ活用"],
      humanDecision: "評価調整、配置・育成の意思決定、項目定義は人が行います。"
    },
    {
      id: "commute", name: "駅すぱあと 通勤費Web", category: "通勤費管理", icon: "交", officialUrl: "https://teiki-web.ekispert.com/",
      evidence: "通勤経路の申請・承認、経路・金額確認、払戻し、運賃改定、給与連携を主な対象とします。",
      strengthQuestion: "通勤経路の妥当性確認、払戻し、運賃改定、給与反映の工数は高いですか？",
      strengthDetail: "入社・異動時の経路申請、定期代確認、差額計算、給与連携を含みます。",
      tasks: [["commute-application", "通勤経路申請・経路／金額確認", "申請、合理的経路確認、差戻し、承認"], ["commute-change", "払戻し・運賃改定・給与反映", "対象者抽出、差額計算、確定額の給与連携"]],
      process: ["従業員が経路候補を検索して申請", "規程に沿って経路・金額を自動判定", "例外だけを担当者が確認・承認", "払戻し・改定結果を給与へ連携"],
      humanDecision: "特殊な交通手段、合理的経路の例外、最終承認は人が行います。"
    },
    {
      id: "lfab", name: "L-FAB", category: "退職金管理", icon: "退", officialUrl: "https://lifefab.co.jp/",
      evidence: "退職金・年金制度の情報、履歴、計算、運用を統合して管理することを主な対象とします。",
      strengthQuestion: "複数制度のデータ収集、退職給付計算、履歴照合、委託先連携の工数は高いですか？",
      strengthDetail: "退職一時金・企業年金等の制度横断管理と退職時計算を含みます。",
      tasks: [["retirement-calc", "退職金・年金の計算・照合", "制度判定、基礎データ収集、計算、結果確認"], ["retirement-data", "制度情報・残高・履歴の更新", "複数制度・委託先データの受渡しと履歴管理"]],
      process: ["人事マスタと制度加入・履歴データを統合", "退職・変更イベントから対象制度を判定", "制度別計算と照合を実行", "給付・委託先連携と履歴を確定"],
      humanDecision: "制度適用の例外、最終給付額、委託先調整は人が行います。"
    }
  ].map(product => ({
    ...product,
    tasks: product.tasks.map(([id, label, description]) => ({ id, label, description }))
  }));

  root.HR_EFFORT_DATA = {
    productDetails,
    standardProcesses,
    methodPotential,
    products,
    coefficients,
    source: "各社公式製品ページおよび標準業務プロセス設計",
    sourceNote: "製品の得意領域は各社公式製品ページを参照。係数は無料版の概算モデル用に設定した独自仮定であり、各社の効果保証値ではありません。",
    methodology: "削減率 = MIN(75%, 作業状態の基礎率 × 連携方法係数 × 得意領域係数)",
    modelVersion: "effort-two-axis-2026-09-25"
  };
})(globalThis);
