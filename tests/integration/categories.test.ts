import { describe, it, expect, afterEach } from "vitest";
import { getAdminClient } from "../helpers/supabase";

describe("Integration: Categories CRUD", () => {
  const admin = getAdminClient();
  const createdCategoryIds: string[] = [];

  afterEach(async () => {
    // Hanya hapus kategori yang dibuat oleh test ini
    for (const id of createdCategoryIds) {
      await admin.from("categories").delete().eq("id", id);
    }
    createdCategoryIds.length = 0;
  });

  it("dapat menambahkan kategori baru ke tabel categories", async () => {
    const categoryName = `Kategori Test ${Date.now()}`;

    const { data, error } = await admin
      .from("categories")
      .insert([{ name: categoryName }])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.name).toBe(categoryName);

    createdCategoryIds.push(data.id);
  });

  it("dapat mengambil daftar kategori yang tersimpan", async () => {
    const cat1Name = `Kategori A ${Date.now()}`;
    const cat2Name = `Kategori B ${Date.now()}`;

    const { data: d1, error: e1 } = await admin
      .from("categories")
      .insert([{ name: cat1Name }])
      .select()
      .single();
    expect(e1).toBeNull();
    expect(d1).toBeDefined();
    createdCategoryIds.push(d1.id);

    const { data: d2, error: e2 } = await admin
      .from("categories")
      .insert([{ name: cat2Name }])
      .select()
      .single();
    expect(e2).toBeNull();
    expect(d2).toBeDefined();
    createdCategoryIds.push(d2.id);

    const { data, error } = await admin
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);

    const names = data.map((c) => c.name);
    expect(names).toContain(cat1Name);
    expect(names).toContain(cat2Name);
  });

  it("dapat memperbarui nama kategori yang sudah ada", async () => {
    const oldName = `Kategori Lama ${Date.now()}`;
    const newName = `Kategori Baru ${Date.now()}`;

    const { data: created, error: ce } = await admin
      .from("categories")
      .insert([{ name: oldName }])
      .select()
      .single();
    expect(ce).toBeNull();
    expect(created).toBeDefined();
    createdCategoryIds.push(created.id);

    const { data: updated, error } = await admin
      .from("categories")
      .update({ name: newName })
      .eq("id", created.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated).toBeDefined();
    expect(updated.name).toBe(newName);
  });

  it("dapat menghapus kategori dari tabel categories", async () => {
    const categoryName = `Kategori Hapus ${Date.now()}`;

    const { data: created, error: ce } = await admin
      .from("categories")
      .insert([{ name: categoryName }])
      .select()
      .single();
    expect(ce).toBeNull();
    expect(created).toBeDefined();

    const { error } = await admin
      .from("categories")
      .delete()
      .eq("id", created.id);

    expect(error).toBeNull();

    // Verifikasi kategori sudah tidak ada
    const { data: remaining, error: fetchError } = await admin
      .from("categories")
      .select("*")
      .eq("id", created.id)
      .maybeSingle();

    expect(fetchError).toBeNull();
    expect(remaining).toBeNull();
  });
});
