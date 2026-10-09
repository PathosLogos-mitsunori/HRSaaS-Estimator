import { getChatGPTUser, chatGPTSignInPath } from "../chatgpt-auth";
import { listConsultations } from "@/db/consultations";

export const dynamic = "force-dynamic";
const OWNER_USER_ID = "711a7443-59d0-424e-9961-9dbd5fb1a1eb";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) return <main className="admin-wrap"><h1>相談申込一覧</h1><p>管理者はChatGPTアカウントでサインインしてください。</p><a href={chatGPTSignInPath("/admin")} target="_top">サインインする</a></main>;
  if (user.userId !== OWNER_USER_ID) return <main className="admin-wrap"><h1>アクセスできません</h1><p>このページはサイト管理者専用です。</p></main>;
  let rows;
  try { rows = await listConsultations(); } catch(error) { console.error("Consultation list failed",error); return <main className="admin-wrap"><h1>相談申込一覧</h1><p>申込を読み込めませんでした。時間をおいて再度お試しください。</p></main>; }
  return <main className="admin-wrap"><a href="/calculator.html">← 試算画面</a><h1>相談申込一覧</h1><p>直近200件。試算値は申込者の入力に基づく概算であり、商談で根拠を確認してください。</p><p>{rows.length}件</p>
    <div className="admin-list">{rows.map(row => <article key={row.id} className="admin-card"><div><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"})}</time><h2>{row.company}</h2><p>{row.contact_name}　<a href={`mailto:${row.email}`}>{row.email}</a></p><p>業種：{row.industry || "未入力"} ／ 対象SaaS：{row.selected_products}</p><p>概算：{(row.saved_hours_tenths/10).toLocaleString("ja-JP")}時間／年・{(row.saved_fte_millionths/1e6).toFixed(3)} FTE・{row.amount_yen.toLocaleString("ja-JP")}円／年</p>{row.note && <p>相談内容：{row.note}</p>}</div><details><summary>対象業務と入力根拠</summary><ul>{JSON.parse(row.result_json).map((item: {domain:string;saas:string;task:string;saved:number;basis:string;exceptions:string}, i:number) => <li key={i}>{item.domain}／{item.saas}／{item.task}：{item.saved?.toFixed(1)}時間、根拠 {item.basis}、例外 {item.exceptions}</li>)}</ul></details></article>)}</div>
  </main>;
}
