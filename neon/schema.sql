BEGIN;

CREATE TABLE IF NOT EXISTS saas_products (
  product_id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  official_url text NOT NULL,
  evidence text NOT NULL,
  last_verified_on date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS standard_processes (
  event_id text PRIMARY KEY CHECK (event_id IN ('join','transfer','promotion','secondment','relocation','leave','return','exit')),
  label text NOT NULL,
  source_scenario text NOT NULL,
  actors text NOT NULL,
  automation_ceiling numeric(5,4) NOT NULL CHECK (automation_ceiling BETWEEN 0 AND 1),
  steps jsonb NOT NULL CHECK (jsonb_typeof(steps) = 'array'),
  human_decision text NOT NULL,
  principle text NOT NULL,
  model_version text NOT NULL,
  sort_order smallint NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS effort_method_profiles (
  method_key text PRIMARY KEY,
  low_rate numeric(5,4) NOT NULL CHECK (low_rate BETWEEN 0 AND 1),
  base_rate numeric(5,4) NOT NULL CHECK (base_rate BETWEEN 0 AND 1),
  high_rate numeric(5,4) NOT NULL CHECK (high_rate BETWEEN 0 AND 1),
  model_version text NOT NULL,
  CHECK (low_rate <= base_rate AND base_rate <= high_rate)
);

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version text NOT NULL,
  employee_size text NOT NULL,
  industry text NOT NULL,
  priorities text[] NOT NULL DEFAULT '{}',
  scopes text[] NOT NULL DEFAULT '{}',
  diagnostic_metrics jsonb NOT NULL DEFAULT '{}',
  recommended_product_ids text[] NOT NULL DEFAULT '{}',
  annual_workdays numeric(7,2) NOT NULL CHECK (annual_workdays BETWEEN 1 AND 366),
  daily_workhours numeric(7,2) NOT NULL CHECK (daily_workhours > 0 AND daily_workhours <= 24),
  annual_capacity_hours numeric(12,2) NOT NULL,
  as_is_hours numeric(14,2) NOT NULL,
  to_be_hours numeric(14,2) NOT NULL,
  saving_hours numeric(14,2) NOT NULL,
  saving_fte numeric(14,6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  event_id text NOT NULL CHECK (event_id IN ('join','transfer','promotion','secondment','relocation','leave','return','exit')),
  annual_count numeric(14,2) NOT NULL CHECK (annual_count > 0),
  as_is_minutes numeric(14,2) NOT NULL CHECK (as_is_minutes > 0),
  to_be_minutes numeric(14,2) NOT NULL CHECK (to_be_minutes >= 0),
  saving_hours numeric(14,2) NOT NULL,
  UNIQUE (assessment_id, event_id)
);

CREATE INDEX IF NOT EXISTS assessments_created_at_idx ON assessments (created_at DESC);
CREATE INDEX IF NOT EXISTS assessment_items_assessment_id_idx ON assessment_items (assessment_id);

INSERT INTO effort_method_profiles (method_key, low_rate, base_rate, high_rate, model_version) VALUES
  ('noSystem', 0.30, 0.45, 0.60, 'free-estimate-2026-09-24'),
  ('manual', 0.25, 0.40, 0.55, 'free-estimate-2026-09-24'),
  ('csvProcessed', 0.18, 0.30, 0.45, 'free-estimate-2026-09-24'),
  ('csvRaw', 0.10, 0.22, 0.35, 'free-estimate-2026-09-24'),
  ('auto', 0.00, 0.05, 0.12, 'free-estimate-2026-09-24')
ON CONFLICT (method_key) DO UPDATE SET
  low_rate = EXCLUDED.low_rate,
  base_rate = EXCLUDED.base_rate,
  high_rate = EXCLUDED.high_rate,
  model_version = EXCLUDED.model_version;

INSERT INTO standard_processes (
  event_id, label, source_scenario, actors, automation_ceiling,
  steps, human_decision, principle, model_version, sort_order
) VALUES
  ('join','入社手続き','SC-01 入社','内定者／人事',0.60,
   '["内定者登録・社員番号発番","本人情報・扶養・口座・通勤・証憑の回収","雇用契約・労働条件通知の締結","入社承認・雇用発令","社保・税・給与・所属・権限への反映"]'::jsonb,
   '本人認証、社員番号の採番時点、雇用条件、証憑不備、情報公開範囲を人事が確認します。',
   '雇用契約、社会保険、給与・権限準備を同じ入社イベントで管理します。','free-estimate-2026-09-24',1),
  ('transfer','異動手続き','SC-12 異動・昇降格','上司／HRBP／人事',0.45,
   '["異動候補・発令日の起案","ポスト・定員・勤務地・上司・給与影響の確認","部門・人事による審議と決裁","必要な本人説明・例外確認","将来日付の発令登録と予定情報連携","発令日の切替と反映照合"]'::jsonb,
   '異動の妥当性、定員・予算、本人説明、例外条件は人事・部門が判断します。',
   '定期異動は一括処理し、例外案件は個別ワークフローで管理します。','free-estimate-2026-09-24',2),
  ('promotion','昇格・降格手続き','SC-12 異動・昇降格','上司／HRBP／人事',0.40,
   '["昇格・降格候補と発令日の起案","等級・役職・報酬・予算影響の確認","人事委員会等による審議と決裁","本人説明・賃金変更等の個別確認","発令登録と給与条件の予定連携","発令日の切替と結果照合"]'::jsonb,
   '昇降格の妥当性、評価との整合、降格・賃金減額の個別審査は人が行います。',
   '役職、等級、報酬、所属を別属性で管理し、発令日で一斉に切り替えます。','free-estimate-2026-09-24',3),
  ('secondment','出向手続き','SC-13 出向・兼務','上司／HRBP／人事／経理',0.35,
   '["目的・期間・所属・費用負担等の条件設計","会社間契約・本人説明と同意","社内承認・出向／兼務発令","給与・社保・勤怠・評価・権限の設定","会社間精算・延長／解除／復帰管理"]'::jsonb,
   '指揮命令、評価者、給与・社保、費用負担、情報アクセスを関係者が決定します。',
   '出向、受入出向、兼務を区分し、期間と終了処理まで一体で管理します。','free-estimate-2026-09-24',4),
  ('relocation','転籍手続き','SC-14 グループ内転籍','人事／転籍元・転籍先責任者',0.38,
   '["転籍日・雇用条件・承継項目の決定","本人同意・会社間契約","転籍元の退職と転籍先の入社発令","社保・税・年金・給与・勤怠の切替","会社・所属・権限変更と移行照合"]'::jsonb,
   '転籍同意、勤続・有休・退職給付の承継、雇用契約条件は人事が確定します。',
   '法人をまたぐため、通常の異動ではなく退職・入社イベントとして管理します。','free-estimate-2026-09-24',5),
  ('leave','休職手続き','SC-11 休職・復職','従業員／上司／人事／産業医',0.38,
   '["休職申請・診断書等の回収","休職可否・期間・条件の確認","承認・休職発令","給与・社保・給付・勤怠の変更","アクセス権変更と期間管理"]'::jsonb,
   '休職可否、必要書類、給与・社保の扱い、アクセス停止範囲は人事等が判断します。',
   '傷病、育児、介護等の事由別に必要書類と処理を分岐します。','free-estimate-2026-09-24',6),
  ('return','復職手続き','SC-11 休職・復職','従業員／上司／人事／産業医',0.35,
   '["復職申請・診断書等の回収","復職可否・就業条件の確認","承認・復職発令","給与・社保・勤怠・権限の再開","勤務配慮と復職後フォロー"]'::jsonb,
   '復職可否、就業上の配慮、段階復帰の条件は産業医・人事・上司が判断します。',
   '復職日だけでなく、勤務条件とフォローアップを同じ履歴で管理します。','free-estimate-2026-09-24',7),
  ('exit','退職手続き','SC-05 退職','従業員／上司／人事',0.50,
   '["退職申請・退職日等の承認","退職発令・最終給与・貸与品等の精算","社保・雇用保険・住民税の手続","源泉徴収票・離職票・退職給付の案内","利用停止・権限削除・完了照合"]'::jsonb,
   '退職日、最終給与、未消化休暇、貸与品、退職給付、アクセス停止期限を確認します。',
   '退職理由別に必要書類を分岐し、発令日とアクセス停止を同期します。','free-estimate-2026-09-24',8)
ON CONFLICT (event_id) DO UPDATE SET
  label = EXCLUDED.label,
  source_scenario = EXCLUDED.source_scenario,
  actors = EXCLUDED.actors,
  automation_ceiling = EXCLUDED.automation_ceiling,
  steps = EXCLUDED.steps,
  human_decision = EXCLUDED.human_decision,
  principle = EXCLUDED.principle,
  model_version = EXCLUDED.model_version,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO saas_products (product_id, name, category, official_url, evidence, last_verified_on) VALUES
  ('pathos','PathosLogos（HR共創プラットフォーム）','データ連携Hub','https://www.pathoslogos.jp/erp/','HR SaaSの相互自動連携、人事データ統合、入社・異動・昇格・勤怠実績のシステム間連携','2026-09-18'),
  ('combosite','Combosite人事給与','人事給与','https://www.pathoslogos.jp/combosite/','大企業の複雑な給与計算、進捗ダッシュボード、前月比較、制度変更シミュレーション、自動連携','2026-09-18'),
  ('smarthrLabor','SmartHR（労務管理）','人事労務','https://smarthr.jp/labor-management/function/agreement/','個人情報収集から入社書類・雇用契約・社会保険等の届出までオンライン化','2026-09-18'),
  ('officeStation','オフィスステーション 労務','人事労務','https://www.officestation.jp/roumu/','手続き・申請・承認フローの電子化、従業員情報の一元管理、電子申請、API連携','2026-09-18'),
  ('teamSpirit','TeamSpirit','勤怠管理','https://www.teamspirit.com/','勤怠・工数・経費・稟議を同一基盤で管理し、36協定チェック、証跡、工数と勤怠の一致を支援','2026-09-18'),
  ('teamSpiritEx','TeamSpirit Enterprise（TeamSpirit EX系）','勤怠管理','https://www.teamspirit.com/','1,000名から10万名規模、グループ全体、複雑な勤務体系に対応する大企業向けライン','2026-09-18'),
  ('kinjiro','Universal 勤次郎','勤怠管理','https://www.kinjiro-e.com/','多様な雇用形態・勤務形態・給与形態に対応する就業管理と、柔軟な勤務ルール設定','2026-09-18'),
  ('kintaiMirai','キンタイミライ','勤怠管理','https://kintaimirai.jp/','大規模法人向け、高いカスタマイズ性、多拠点・複雑運用、専任コンサルタントによる導入支援','2026-09-18'),
  ('talentPalette','タレントパレット','タレントマネジメント','https://www.pa-consul.co.jp/talentpalette/','人材データ分析、評価、最適配置、育成、スキル、採用、エンゲージメント、生成AIを広範に提供','2026-09-18'),
  ('kaonavi','カオナビ','タレントマネジメント','https://www.kaonavi.jp/','人材情報一元化、評価シート再現、200種以上のスキルテンプレート、配置・育成・分析','2026-09-18'),
  ('smarthrTalent','SmartHR（タレントマネジメント）','タレントマネジメント','https://smarthr.jp/talent-management/','労務で蓄積する従業員データを基に、人事評価、配置、キャリア、スキル、サーベイ、分析を提供','2026-09-18'),
  ('commute','駅すぱあと 通勤費Web','通勤費管理','https://teiki-web.ekispert.com/','通勤経路の申請・承認、払戻計算、運賃改定の反映、他社システム連携をクラウドで一元化','2026-09-18'),
  ('lfab','L-FAB','退職金・年金管理','https://lifefab.co.jp/','退職一時金・確定給付・確定拠出など複数制度を統合し、Excel管理と制度運用を効率化','2026-09-18')
ON CONFLICT (product_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  official_url = EXCLUDED.official_url,
  evidence = EXCLUDED.evidence,
  last_verified_on = EXCLUDED.last_verified_on,
  updated_at = now();

COMMIT;
