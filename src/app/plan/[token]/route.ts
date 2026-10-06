import { servirPlan } from "@/lib/plan/pagina";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return servirPlan(req, token, "formacion");
}
