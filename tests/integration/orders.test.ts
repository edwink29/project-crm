import { describe, it, expect, afterEach } from "vitest";
import {
  getAdminClient,
  createTestUser,
  waitFor,
} from "../helpers/supabase";

describe("Integration: Orders Management", () => {
  const admin = getAdminClient();
  const createdUserIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdOrderIds: string[] = [];

  // Helper untuk membuat kategori uji coba
  const setupCategory = async () => {
    const { data, error } = await admin
      .from("categories")
      .insert([{ name: `Kategori Order ${Date.now()}` }])
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) createdCategoryIds.push(data.id);
    return data;
  };

  // Helper untuk membuat produk uji coba
  const setupProduct = async (categoryId: string) => {
    const { data, error } = await admin
      .from("products")
      .insert([
        {
          name: `Produk Order ${Date.now()}`,
          price: 100000,
          buy_price: 60000,
          stock: 100,
          category_id: categoryId,
        },
      ])
      .select()
      .single();
    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data) createdProductIds.push(data.id);
    return data;
  };

  afterEach(async () => {
    // Hapus order_items terlebih dahulu (foreign key ke orders & products)
    for (const orderId of createdOrderIds) {
      await admin.from("order_items").delete().eq("order_id", orderId);
      await admin.from("orders").delete().eq("id", orderId);
    }
    createdOrderIds.length = 0;

    // Hapus produk uji coba
    for (const id of createdProductIds) {
      await admin.from("products").delete().eq("id", id);
    }
    createdProductIds.length = 0;

    // Hapus kategori uji coba
    for (const id of createdCategoryIds) {
      await admin.from("categories").delete().eq("id", id);
    }
    createdCategoryIds.length = 0;

    // Hapus user uji coba
    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
    createdUserIds.length = 0;
  });

  it("dapat membuat pesanan (order) beserta order_items", async () => {
    // 1. Buat customer user agar ada baris di tabel profiles
    const { user } = await createTestUser("customer");
    createdUserIds.push(user.id);

    // Tunggu sampai profil terbentuk oleh trigger database
    await waitFor(async () => {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) throw new Error("Profil belum siap");
      return data;
    });

    // 2. Buat kategori dan produk
    const category = await setupCategory();
    expect(category).toBeDefined();
    const product = await setupProduct(category.id);
    expect(product).toBeDefined();

    // Tunggu sampai produk terlihat di tabel sebelum dibuat order_items
    await waitFor(async () => {
      const { data } = await admin
        .from("products")
        .select("id")
        .eq("id", product.id)
        .maybeSingle();
      if (!data) throw new Error("Produk belum siap");
      return data;
    });

    // 3. Buat order
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert([
        {
          customer_id: user.id,
          total_amount: 200000,
          status: "pending",
          payment_method: "transfer_bank",
          payment_status: "unpaid",
          shipping_address: "Jl. Contoh No. 123, Kota Test",
        },
      ])
      .select()
      .single();

    expect(orderError).toBeNull();
    expect(order).toBeDefined();
    expect(order.customer_id).toBe(user.id);
    expect(order.total_amount).toBe(200000);
    expect(order.status).toBe("pending");

    createdOrderIds.push(order.id);

    // 4. Buat order_items yang terkait dengan order
    const { data: orderItem, error: itemError } = await admin
      .from("order_items")
      .insert([
        {
          order_id: order.id,
          product_id: product.id,
          quantity: 2,
          price_at_purchase: 100000,
        },
      ])
      .select()
      .single();

    expect(itemError).toBeNull();
    expect(orderItem).toBeDefined();
    expect(orderItem.order_id).toBe(order.id);
    expect(orderItem.product_id).toBe(product.id);
    expect(orderItem.quantity).toBe(2);
  });

  it("dapat mengambil daftar pesanan dengan relasi customer dan produk", async () => {
    // Buat customer user
    const { user } = await createTestUser("customer");
    createdUserIds.push(user.id);

    await waitFor(async () => {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) throw new Error("Profil belum siap");
      return data;
    });

    // Buat kategori dan produk
    const category = await setupCategory();
    const product = await setupProduct(category.id);

    // Buat 2 order
    const { data: order1, error: oe1 } = await admin
      .from("orders")
      .insert([
        {
          customer_id: user.id,
          total_amount: 100000,
          status: "pending",
          payment_method: "cash",
          payment_status: "unpaid",
          shipping_address: "Alamat 1",
        },
      ])
      .select()
      .single();
    expect(oe1).toBeNull();
    expect(order1).toBeDefined();
    createdOrderIds.push(order1.id);

    const { data: order2, error: oe2 } = await admin
      .from("orders")
      .insert([
        {
          customer_id: user.id,
          total_amount: 300000,
          status: "completed",
          payment_method: "transfer_bank",
          payment_status: "paid",
          shipping_address: "Alamat 2",
        },
      ])
      .select()
      .single();
    expect(oe2).toBeNull();
    expect(order2).toBeDefined();
    createdOrderIds.push(order2.id);

    // Tunggu sampai order terlihat sebelum insert order_items
    await waitFor(async () => {
      const { data } = await admin
        .from("orders")
        .select("id")
        .eq("id", order1.id)
        .maybeSingle();
      if (!data) throw new Error("Order belum siap");
      return data;
    });

    // Tambahkan order_items
    const { error: ie1 } = await admin.from("order_items").insert([
      {
        order_id: order1.id,
        product_id: product.id,
        quantity: 1,
        price_at_purchase: 100000,
      },
      {
        order_id: order2.id,
        product_id: product.id,
        quantity: 3,
        price_at_purchase: 100000,
      },
    ]);
    expect(ie1).toBeNull();

    // Tunggu sampai data terlihat di query select dengan relasi (antisipasi replication lag)
    const { data, error } = await waitFor(async () => {
      const { data, error } = await admin
        .from("orders")
        .select(
          `*,
          profiles (full_name),
          order_items (
            id,
            quantity,
            price_at_purchase,
            products (name, image_url)
          )
        `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length < 2) throw new Error("Belum cukup data pesanan");
      return { data, error };
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);

    const orderWithItems = data.find((o) => o.id === order1.id);
    expect(orderWithItems).toBeDefined();
    expect(orderWithItems?.order_items.length).toBeGreaterThanOrEqual(1);
    expect(orderWithItems?.profiles?.full_name).toBeDefined();
  });

  it("dapat mengubah status pesanan (pending -> completed)", async () => {
    // Buat customer user
    const { user } = await createTestUser("customer");
    createdUserIds.push(user.id);

    await waitFor(async () => {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) throw new Error("Profil belum siap");
      return data;
    });

    // Buat kategori dan produk
    const category = await setupCategory();
    const product = await setupProduct(category.id);

    // Buat order dengan status pending
    const { data: order, error: oe } = await admin
      .from("orders")
      .insert([
        {
          customer_id: user.id,
          total_amount: 150000,
          status: "pending",
          payment_method: "cash",
          payment_status: "unpaid",
          shipping_address: "Alamat Pengiriman",
        },
      ])
      .select()
      .single();

    expect(oe).toBeNull();
    expect(order).toBeDefined();
    createdOrderIds.push(order.id);

    // Tunggu sampai order terlihat sebelum update status
    await waitFor(async () => {
      const { data } = await admin
        .from("orders")
        .select("id")
        .eq("id", order.id)
        .maybeSingle();
      if (!data) throw new Error("Order belum siap");
      return data;
    });

    // Ubah status menjadi completed
    const { data: updated, error } = await admin
      .from("orders")
      .update({ status: "completed" })
      .eq("id", order.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated).toBeDefined();
    expect(updated.status).toBe("completed");
  });

  it("dapat menghapus pesanan beserta order_items-nya", async () => {
    // Buat customer user
    const { user } = await createTestUser("customer");
    createdUserIds.push(user.id);

    await waitFor(async () => {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) throw new Error("Profil belum siap");
      return data;
    });

    // Buat kategori dan produk
    const category = await setupCategory();
    const product = await setupProduct(category.id);

    // Buat order
    const { data: order, error: oe } = await admin
      .from("orders")
      .insert([
        {
          customer_id: user.id,
          total_amount: 50000,
          status: "pending",
          payment_method: "cash",
          payment_status: "unpaid",
          shipping_address: "Alamat Hapus",
        },
      ])
      .select()
      .single();

    expect(oe).toBeNull();
    expect(order).toBeDefined();
    createdOrderIds.push(order.id);

    // Tambahkan order_items
    await admin.from("order_items").insert([
      {
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        price_at_purchase: 50000,
      },
    ]);

    // Hapus order_items terlebih dahulu
    await admin.from("order_items").delete().eq("order_id", order.id);

    // Hapus order
    const { error } = await admin.from("orders").delete().eq("id", order.id);
    expect(error).toBeNull();

    // Verifikasi order sudah tidak ada
    const { data: remaining, error: fetchError } = await admin
      .from("orders")
      .select("*")
      .eq("id", order.id)
      .maybeSingle();

    expect(fetchError).toBeNull();
    expect(remaining).toBeNull();
  });
});
