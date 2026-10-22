import { describe, it, expect, afterEach } from "vitest";
import {
  getAdminClient,
  createTestUser,
  deleteTestUser,
  waitFor,
} from "../helpers/supabase";

describe("Integration: Auth & Profile Trigger", () => {
  const adminClient = getAdminClient();
  const createdUserIds: string[] = [];

  // Selalu bersihkan semua user uji coba setelah tiap pengujian
  afterEach(async () => {
    while (createdUserIds.length > 0) {
      const userId = createdUserIds.pop();
      if (userId) {
        await deleteTestUser(userId);
      }
    }
  });

  it("otomatis membuat baris di tabel profiles dengan role 'customer' saat user baru mendaftar", async () => {
    // 1. Buat user baru menggunakan helper
    const { user } = await createTestUser("customer");
    createdUserIds.push(user.id);

    // 2. Gunakan polling pintar 'waitFor' untuk memastikan trigger database selesai dieksekusi
    const profile = await waitFor(async () => {
      const { data, error } = await adminClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Profile record belum ditemukan oleh trigger");
      return data;
    });

    // 3. Verifikasi integritas data profile
    expect(profile).toBeDefined();
    expect(profile.id).toBe(user.id);
    expect(profile.role).toBe("customer");
  });

  it("admin dapat mengubah role user dari 'customer' menjadi 'admin'", async () => {
    // 1. Buat user customer
    const { user } = await createTestUser("customer");
    createdUserIds.push(user.id);

    // 2. Tunggu profil terbentuk terlebih dahulu
    await waitFor(async () => {
      const { data } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) throw new Error("Menunggu profile siap");
      return data;
    });

    // 3. Admin mengubah role menjadi 'admin'
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id);

    expect(updateError).toBeNull();

    // 4. Verifikasi bahwa role berhasil diperbarui
    const { data: updatedProfile, error: fetchError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    expect(fetchError).toBeNull();
    expect(updatedProfile?.role).toBe("admin");
  });
});

