import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getInvitation } from "@/lib/invitation";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const inv = await getInvitation();

  if (!inv) {
    return (
      <div className="panel">
        <div className="panel-body">
          <h1>Belum ada undangan</h1>
          <p className="b-hint">Jalankan <code>npm run db:seed</code> untuk membuat data awal.</p>
        </div>
      </div>
    );
  }

  const [totalGuests, opened, wishes, hadir, ragu, tidakHadir, headcount, recentGuests, recentWishes] =
    await Promise.all([
      prisma.guest.count({ where: { invitationId: inv.id } }),
      prisma.guest.count({ where: { invitationId: inv.id, firstOpenedAt: { not: null } } }),
      prisma.wish.count({ where: { invitationId: inv.id } }),
      prisma.wish.count({ where: { invitationId: inv.id, attendance: "HADIR" } }),
      prisma.wish.count({ where: { invitationId: inv.id, attendance: "RAGU" } }),
      prisma.wish.count({ where: { invitationId: inv.id, attendance: "TIDAK_HADIR" } }),
      prisma.wish.aggregate({
        where: { invitationId: inv.id, attendance: "HADIR" },
        _sum: { guestCount: true },
      }),
      prisma.guest.findMany({
        where: { invitationId: inv.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { wish: { select: { attendance: true } } },
      }),
      prisma.wish.findMany({
        where: { invitationId: inv.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const attendedGuests = hadir; // jumlah ucapan hadir (1 per tamu/ucapan)
  const rsvpTotal = hadir + ragu + tidakHadir;
  const openRate = totalGuests ? Math.round((opened / totalGuests) * 100) : 0;
  const totalJiwa = headcount._sum.guestCount ?? 0;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Dashboard</h1>
          <p>
            Undangan <strong>/{inv.slug}</strong> · {inv.brideNick} &amp; {inv.groomNick}
          </p>
        </div>
        <div className="toolbar">
          <Link className="b-btn b-ghost" href={`/${inv.slug}`} target="_blank">
            Lihat Undangan
          </Link>
          <Link className="b-btn b-primary" href="/admin/tamu">
            + Tambah Tamu
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tamu</div>
          <div className="stat-value">{totalGuests}</div>
          <div className="stat-note">link undangan dibuat</div>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-label">Sudah Membuka</div>
          <div className="stat-value">{opened}</div>
          <div className="stat-note">{openRate}% dari total tamu</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Belum Membuka</div>
          <div className="stat-value">{totalGuests - opened}</div>
          <div className="stat-note">belum ada kunjungan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Ucapan</div>
          <div className="stat-value">{wishes}</div>
          <div className="stat-note">{rsvpTotal} konfirmasi kehadiran</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Hadir</div>
          <div className="stat-value">{attendedGuests}</div>
          <div className="stat-note">konfirmasi hadir</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ragu</div>
          <div className="stat-value">{ragu}</div>
          <div className="stat-note">belum memastikan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tidak Hadir</div>
          <div className="stat-value">{tidakHadir}</div>
          <div className="stat-note">berhalangan</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Jiwa Hadir</div>
          <div className="stat-value">{totalJiwa}</div>
          <div className="stat-note">termasuk pendamping</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Tamu Terbaru</h2>
          <Link className="b-btn b-ghost b-mini" href="/admin/tamu">
            Lihat semua
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Dibuka</th>
                <th>RSVP</th>
                <th>Ditambahkan</th>
              </tr>
            </thead>
            <tbody>
              {recentGuests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="b-hint">
                    Belum ada tamu.
                  </td>
                </tr>
              ) : (
                recentGuests.map((g) => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td>
                      {g.firstOpenedAt ? (
                        <span className="pill pill-ok">Sudah · {g.openCount}×</span>
                      ) : (
                        <span className="pill pill-muted">Belum</span>
                      )}
                    </td>
                    <td>
                      {g.wish ? (
                        <span
                          className={`pill ${
                            g.wish.attendance === "HADIR"
                              ? "pill-ok"
                              : g.wish.attendance === "RAGU"
                                ? "pill-warn"
                                : "pill-off"
                          }`}
                        >
                          {g.wish.attendance === "HADIR"
                            ? "Hadir"
                            : g.wish.attendance === "RAGU"
                              ? "Ragu"
                              : "Tidak Hadir"}
                        </span>
                      ) : (
                        <span className="pill pill-muted">—</span>
                      )}
                    </td>
                    <td className="b-hint">{timeAgo(g.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Ucapan Terbaru</h2>
          <Link className="b-btn b-ghost b-mini" href="/admin/ucapan">
            Kelola ucapan
          </Link>
        </div>
        <div className="panel-body">
          {recentWishes.length === 0 ? (
            <p className="b-hint">Belum ada ucapan.</p>
          ) : (
            <ul style={{ display: "grid", gap: ".6rem", listStyle: "none", padding: 0, margin: 0 }}>
              {recentWishes.map((w) => (
                <li key={w.id} style={{ borderLeft: "2px solid #e2c574", paddingLeft: ".7rem" }}>
                  <div style={{ fontSize: ".85rem", fontWeight: 600 }}>
                    {w.name}{" "}
                    <span className="pill pill-muted" style={{ fontWeight: 400 }}>
                      {w.attendance === "HADIR" ? "Hadir" : w.attendance === "RAGU" ? "Ragu" : "Tidak Hadir"}
                    </span>
                  </div>
                  <div style={{ fontSize: ".82rem", color: "#5a6d61", marginTop: ".1rem" }}>{w.message}</div>
                  <div className="b-hint">{timeAgo(w.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
