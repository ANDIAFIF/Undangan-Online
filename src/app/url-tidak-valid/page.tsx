import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "URL Tidak Valid",
  robots: { index: false, follow: false },
};

export default function InvalidUrlPage() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "3rem 1.5rem", background: "#102c25", color: "#f6e8bc", textAlign: "center" }}>
      <div style={{ width: "100%", maxWidth: "40rem" }}>
        <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)", fontWeight: 500, lineHeight: 1.3, textWrap: "balance" }}>
          Jangan Merubah Halaman URL
          <br />
          sembarangan yah,
        </h1>
        <div aria-hidden="true" style={{ width: "3rem", height: "1px", margin: "2rem auto", background: "#f6e8bc", opacity: 0.35 }} />
        <p style={{ margin: 0, fontFamily: "Arial, sans-serif", fontSize: "clamp(0.875rem, 2.5vw, 1rem)", letterSpacing: "0.12em", lineHeight: 1.8 }}>
          UNDANGAN ONLINE
        </p>
        <p style={{ margin: "0.5rem 0 0", fontFamily: "Arial, sans-serif", fontSize: "0.8rem", letterSpacing: "0.18em", opacity: 0.65 }}>
          Gunakan tautan dari pengundang.
        </p>
      </div>
    </main>
  );
}
