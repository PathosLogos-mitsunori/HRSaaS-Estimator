import { saveConsultation } from "@/db/consultations";

export const runtime = "edge";
const response = (message: string, status: number) => Response.json({ message }, { status });
const str = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";
const finite = (v: unknown, max: number) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : null;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return response("送信元を確認できません。", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return response("送信形式を確認してください。", 415);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 25000) return response("送信内容が大きすぎます。", 413);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return response("入力内容を読み取れません。", 400); }
  if (str(body.website, 100)) return response("入力内容を確認してください。", 400);
  if (body.consent !== true) return response("保存と連絡への同意が必要です。", 400);
  const company = str(body.company, 80), contactName = str(body.contactName, 60);
  const email = str(body.email, 150), note = str(body.note, 1000);
  if (!company || !contactName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response("会社名・お名前・メールアドレスを確認してください。", 400);
  const result = body.result && typeof body.result === "object" && !Array.isArray(body.result) ? body.result as Record<string, unknown> : null;
  const hours = finite(result?.saved, 1e9), fte = finite(result?.fte, 1e6), amount = finite(result?.amount, 1e13);
  const profile = result?.profile && typeof result.profile === "object" ? result.profile as Record<string, unknown> : null;
  const items = Array.isArray(result?.items) ? result.items.slice(0, 50) : [];
  if (hours === null || fte === null || amount === null || !items.length || items.length > 50) return response("試算結果を確認できません。もう一度試算してください。", 400);
  const compact = items.map((row: unknown) => { const v = row && typeof row === "object" ? row as Record<string, unknown> : {}; return {
    domain: str(v.domainName, 50), saas: str(v.productName, 80), task: str(v.label, 80),
    count: finite(v.count, 1e9), minutes: finite(v.minutes, 1e7), rate: finite(v.rate, 1), saved: finite(v.saved, 1e9),
    basis: str(v.basis, 30), exceptions: str(v.exceptions, 30),
  }; });
  try {
    await saveConsultation({id:crypto.randomUUID(),created_at:new Date().toISOString(),company,contact_name:contactName,email,note,
      industry:str(profile?.industry,60),selected_products:str(result?.selectedProducts,500),
      saved_hours_tenths:Math.round(hours*10),saved_fte_millionths:Math.round(fte*1e6),amount_yen:Math.round(amount),
      result_json:JSON.stringify(compact)});
    return Response.json({message:"相談申込を受け付けました。"},{status:201});
  } catch(error) {
    console.error("Consultation save failed", error);
    return response("保存できませんでした。しばらくしてから再送してください。", 503);
  }
}
