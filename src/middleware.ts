import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 1. Inisialisasi Supabase Client khusus Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. Cek apakah user sedang login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const url = req.nextUrl.clone();

  // Jika user belum login dan mencoba akses halaman terproteksi (Admin atau Customer)
  if (!user) {
    if (
      url.pathname.startsWith("/admin") ||
      url.pathname === "/cart" ||
      url.pathname === "/checkout"
    ) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return res;
  }

  // 3. Ambil Role User dari tabel profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "customer";

  // --- ATURAN ROUTING DINDING PENCEGAH (GUARD) ---

  // A. Jika USER adalah ADMIN:
  // Admin TIDAK BOLEH akses halaman customer (/ , /cart, /checkout)
  if (userRole === "admin") {
    if (
      url.pathname === "/" ||
      url.pathname === "/cart" ||
      url.pathname === "/checkout"
    ) {
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // B. Jika USER adalah CUSTOMER:
  // Customer TIDAK BOLEH akses halaman Admin (/admin/...)
  if (userRole !== "admin" && url.pathname.startsWith("/admin")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return res;
}

// Tentukan rute halaman mana saja yang dijaga oleh middleware ini
export const config = {
  matcher: ["/", "/cart", "/checkout", "/admin/:path*"],
};
