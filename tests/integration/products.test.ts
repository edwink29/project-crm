import { describe, it, expect, afterEach } from "vitest";
import {
  getAdminClient,
  waitFor,
} from "../helpers/supabase";

describe("Integration: Products CRUD", () => {
  const admin = getAdminClient();
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];

  // Buat kategori dulu karena produk mengandalkan foreign key category_id
  const setupCategory = async (nameSuffix = "") => {
    const categoryName = `Kategori Produk Test ${Date.now()}${nameSuffix}`;
    const { data, error } = await admin
      .from("categories")
      .insert([{ name: categoryName }])
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) createdCategoryIds.push(data.id);
    return data;
  };

  afterEach(async () => {
    // Hapus produk uji coba terlebih dahulu (karena foreign key)
    for (const id of createdProductIds) {
      await admin.from("products").delete().eq("id", id);
    }
    createdProductIds.length = 0;

    // Hapus kategori uji coba
    for (const id of createdCategoryIds) {
      await admin.from("categories").delete().eq("id", id);
    }
    createdCategoryIds.length = 0;
  });

  it("dapat menambahkan produk baru ke tabel products", async () => {
    const category = await setupCategory();
    expect(category).toBeDefined();

    const productName = `Produk Test ${Date.now()}`;
    const { data, error } = await admin
      .from("products")
      .insert([
        {
          name: productName,
          price: 150000,
          buy_price: 100000,
          stock: 10,
          category_id: category.id,
          description: "Deskripsi produk uji coba",
          sizes: "S, M, L",
          image_url: "https://example.com/image.jpg",
        },
      ])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.name).toBe(productName);
    expect(data.price).toBe(150000);
    expect(data.stock).toBe(10);
    expect(data.category_id).toBe(category.id);

    createdProductIds.push(data.id);
  });

  it("dapat mengambil daftar produk dengan relasi kategori", async () => {
    const category = await setupCategory();
    expect(category).toBeDefined();

    const prod1Name = `Produk Satu ${Date.now()}`;
    const prod2Name = `Produk Dua ${Date.now()}`;

    const { data: d1, error: e1 } = await admin
      .from("products")
      .insert([
        {
          name: prod1Name,
          price: 100000,
          stock: 5,
          category_id: category.id,
        },
      ])
      .select()
      .single();
    expect(e1).toBeNull();
    expect(d1).toBeDefined();
    createdProductIds.push(d1.id);

    const { data: d2, error: e2 } = await admin
      .from("products")
      .insert([
        {
          name: prod2Name,
          price: 200000,
          stock: 3,
          category_id: category.id,
        },
      ])
      .select()
      .single();
    expect(e2).toBeNull();
    expect(d2).toBeDefined();
    createdProductIds.push(d2.id);

    // Tunggu sampai data terlihat di query select (antisipasi replication lag)
    const { data, error } = await waitFor(async () => {
      const { data, error } = await admin
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length < 2) throw new Error("Belum cukup data produk");
      return { data, error };
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);

    const names = data.map((p) => p.name);
    expect(names).toContain(prod1Name);
    expect(names).toContain(prod2Name);
  });

  it("dapat memperbarui data produk yang sudah ada", async () => {
    const category = await setupCategory();
    expect(category).toBeDefined();

    const { data: created, error: ce } = await admin
      .from("products")
      .insert([
        {
          name: `Produk Awal ${Date.now()}`,
          price: 100000,
          stock: 5,
          category_id: category.id,
        },
      ])
      .select()
      .single();
    expect(ce).toBeNull();
    expect(created).toBeDefined();
    createdProductIds.push(created.id);

    // Tunggu sampai produk terlihat sebelum update (antisipasi replication lag)
    await waitFor(async () => {
      const { data } = await admin
        .from("products")
        .select("id")
        .eq("id", created.id)
        .maybeSingle();
      if (!data) throw new Error("Produk belum siap diupdate");
      return data;
    });

    const newName = `Produk Diupdate ${Date.now()}`;
    const { data: updated, error } = await admin
      .from("products")
      .update({
        name: newName,
        price: 250000,
        stock: 20,
      })
      .eq("id", created.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated).toBeDefined();
    expect(updated.name).toBe(newName);
    expect(updated.price).toBe(250000);
    expect(updated.stock).toBe(20);
  });

  it("dapat menghapus produk dari tabel products", async () => {
    const category = await setupCategory();
    expect(category).toBeDefined();

    const { data: created, error: ce } = await admin
      .from("products")
      .insert([
        {
          name: `Produk Untuk Dihapus ${Date.now()}`,
          price: 50000,
          stock: 1,
          category_id: category.id,
        },
      ])
      .select()
      .single();
    expect(ce).toBeNull();
    expect(created).toBeDefined();

    const { error } = await admin
      .from("products")
      .delete()
      .eq("id", created.id);

    expect(error).toBeNull();

    // Verifikasi produk sudah tidak ada
    const { data: remaining, error: fetchError } = await admin
      .from("products")
      .select("*")
      .eq("id", created.id)
      .maybeSingle();

    expect(fetchError).toBeNull();
    expect(remaining).toBeNull();
  });

  it("insert produk dengan nama kosong tetap dieksekusi di database", async () => {
    const category = await setupCategory();
    expect(category).toBeDefined();

    const { error } = await admin.from("products").insert([
      {
        name: "",
        price: 100000,
        stock: 5,
        category_id: category.id,
      },
    ]);

    // Database tidak melarang nama kosong di level schema (tidak ada NOT NULL constraint),
    // tetapi aplikasi Next.js melakannya di sisi klien. Validasi wajib isi tetap dipertahankan
    // di sisi aplikasi.
    expect(error).toBeNull();
  });
});
