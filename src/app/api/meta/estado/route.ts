import { NextResponse } from "next/server";
import { metaConfigurada } from "@/lib/meta";

/**
 * ¿Está lista la Conversions API? Solo dice sí o no, nunca los valores. Sirve para comprobar,
 * después de poner META_CAPI_TOKEN en Vercel, que la web ya lo ve (src/lib/meta.ts).
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    conversionsApi: metaConfigurada(),
    soloConCookies: process.env.META_CAPI_SOLO_CON_CONSENTIMIENTO === "1",
  });
}
