import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminCustomersPage from "@/app/admin/customer/page";

// Mock Supabase client di dalam vi.mock factory (karena vi.mock di-hoisted ke atas file)
vi.mock("@/lib/supabase", () => {
  // mockUpdate digunakan untuk rantai: from("profiles").update({...}).eq("id", ...)
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({
    eq: mockEq,
  });

  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    update: mockUpdate,
  }));

  return {
    supabase: {
      from: mockFrom,
      update: mockUpdate,
    },
    __mockFrom: mockFrom,
    __mockUpdate: mockUpdate,
  };
});

import { supabase } from "@/lib/supabase";

// Ambil mock functions dari module yang di-mock
const mockFrom = (supabase as any).from;
const mockUpdate = (supabase as any).update;

// Untuk mengakses mock order yang nested, kita perlu mock yang berbeda:
// Karena from().select().order() menghasilkan chain, kita override di beforeEach

const mockCustomers = [
  {
    id: "cust-1",
    full_name: "Budi Santoso",
    role: "customer",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "cust-2",
    full_name: "Siti Rahayu",
    role: "admin",
    created_at: "2026-02-15T00:00:00Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  // Setup chain: from("profiles").select("*").order(...) → resolve data
  const mockSelect = vi.fn(() => ({
    order: vi.fn().mockResolvedValue({ data: mockCustomers, error: null }),
  }));
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    update: mockUpdate,
  }));

  mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("Unit: AdminCustomersPage", () => {
  it("merender judul dan subtitle halaman", async () => {
    render(<AdminCustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Kelola Pelanggan")).toBeInTheDocument();
    });

    expect(screen.getByText("Daftar pelanggan toko")).toBeInTheDocument();
  });

  it("menampilkan status loading saat data sedang diambil", async () => {
    // Simulasikan loading: order belum resolve pada render pertama
    const mockSelect = vi.fn(() => ({
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
      update: mockUpdate,
    }));

    render(<AdminCustomersPage />);

    expect(screen.getByText("Memuat data pelanggan...")).toBeInTheDocument();
  });

  it("menampilkan daftar nama pelanggan setelah data berhasil dimuat", async () => {
    render(<AdminCustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    });

    expect(screen.getByText("Siti Rahayu")).toBeInTheDocument();
  });

  it("menampilkan role pelanggan dengan benar", async () => {
    render(<AdminCustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("CUSTOMER")).toBeInTheDocument();
    });

    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("memanggil supabase.from('profiles') untuk mengambil data customer", async () => {
    render(<AdminCustomersPage />);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("profiles");
    });
  });

  it("membuka dialog Ubah Role saat tombol opsi diklik", async () => {
    render(<AdminCustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    });

    // Klik tombol dropdown (tiga titik / aria-haspopup=menu) untuk membuka opsi
    const moreButtons = screen.getAllByRole("button", {
      name: "",
      hidden: false,
    }).filter((b) => b.getAttribute("aria-haspopup") === "menu");
    expect(moreButtons.length).toBeGreaterThan(0);

    fireEvent.click(moreButtons[0]);

    // Dropdown menu seharusnya muncul dengan opsi "Ubah Role"
    await waitFor(() => {
      expect(
        screen.getByText("Ubah Role (Admin / Customer)")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ubah Role (Admin / Customer)"));

    // Dialog Ubah Role Pengguna seharusnya terbuka
    await waitFor(() => {
      expect(screen.getByText("Ubah Role Pengguna")).toBeInTheDocument();
    });

    expect(screen.getByText("Ubah akses untuk pelanggan:")).toBeInTheDocument();
    // Budi Santoso muncul 2x (tabel + dialog strong), ambil yang di dialog (strong)
    const budiInDialog = screen
      .getAllByText("Budi Santoso")
      .find((el) => el.tagName === "STRONG");
    expect(budiInDialog).toBeInTheDocument();
  });

  it("memilih role admin dan mengklik Simpan Akses", async () => {
    render(<AdminCustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    });

    // Buka dialog ubah role
    const moreButtons = screen.getAllByRole("button", {
      name: "",
      hidden: false,
    }).filter((b) => b.getAttribute("aria-haspopup") === "menu");
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Ubah Role (Admin / Customer)")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ubah Role (Admin / Customer)"));

    await waitFor(() => {
      expect(screen.getByText("Ubah Role Pengguna")).toBeInTheDocument();
    });

    // Pilih role Admin dari select
    const roleSelect = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(roleSelect, { target: { value: "admin" } });
    expect(roleSelect.value).toBe("admin");

    // Klik Simpan Akses
    const saveButton = screen.getByRole("button", { name: /Simpan Akses/i });
    fireEvent.click(saveButton);

    // Harus memanggil supabase.update untuk mengubah role
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
