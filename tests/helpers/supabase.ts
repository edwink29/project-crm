import { createClient } from "@supabase/supabase-js";

// Client Admin (Service Role) - bisa bypass RLS, create/delete user auth, reset data
export const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Client Anon Publik biasa (aman untuk environment Node.js test)
export const getAnonClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper Polling pintar untuk menunggu trigger database asynchronous
export const waitFor = async <T>(
  assertionFn: () => Promise<T>,
  options: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<T> => {
  const { timeoutMs = 4000, intervalMs = 100 } = options;
  const startTime = Date.now();

  let lastError: any;
  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await assertionFn();
      if (result) return result;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw lastError || new Error(`Timed out after ${timeoutMs}ms waiting for condition.`);
};

// Helper membuat user testing baru
export const createTestUser = async (role: "customer" | "admin" = "customer") => {
  const admin = getAdminClient();
  const testEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@testcrm.com`;
  const testPassword = "PasswordTesting123!";

  const { data, error } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Gagal membuat test user: ${error?.message}`);
  }

  // Jika ingin role admin, update tabel profiles setelah trigger selesai
  if (role === "admin") {
    await waitFor(async () => {
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profile) throw new Error("Profile belum siap diupdate ke admin");
      return profile;
    });

    await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  }

  return {
    user: data.user,
    email: testEmail,
    password: testPassword,
  };
};

// Helper menghapus user testing
export const deleteTestUser = async (userId: string) => {
  const admin = getAdminClient();
  await admin.auth.admin.deleteUser(userId);
};

// Helper untuk membersihkan data tabel
export const resetTables = async (tables: string[]) => {
  const admin = getAdminClient();
  for (const table of tables) {
    await admin.from(table).delete().not("id", "is", null);
  }
};

