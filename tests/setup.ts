import { beforeAll } from "vitest";

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const testRef = process.env.TEST_PROJECT_REF;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !testRef || !serviceKey) {
    throw new Error(
      "❌ TEST HALTED: Variabel .env.test belum lengkap (URL, TEST_PROJECT_REF, atau SERVICE_ROLE_KEY kosong)."
    );
  }

  // Safety Guard: Cegah test salah menembak DB Production
  if (!url.includes(testRef)) {
    throw new Error(
      `🚨 SAFETY GUARD TRIGGERED: SUPABASE_URL (${url}) tidak sesuai dengan TEST_PROJECT_REF (${testRef}). Test dibatalkan demi keamanan data!`
    );
  }
});
