/**
 * AdminDashboard — Admin Panel (/admin)
 * Dark-themed management interface for EXPAN Prophetic.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRegistrations, deleteRegistration, Registration } from "../lib/adminDb";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [isSuperAdmin] = useState(() => sessionStorage.getItem("expan_admin_role") === "superadmin");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("expan_admin_auth") !== "true") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRegistrations();
        setRegistrations(data);
      } catch (err: any) {
        setError(err.message || "Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let items = registrations;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r =>
        r.first_name.toLowerCase().includes(q) ||
        r.last_name.toLowerCase().includes(q) ||
        r.phone_number.includes(q) ||
        (r.location_name || "").toLowerCase().includes(q)
      );
    }

    // Referral source filter
    if (filterSource !== "all") {
      items = items.filter(r => r.referral_source === filterSource);
    }

    // Student filter
    if (filterStudent === "yes") {
      items = items.filter(r => r.is_student);
    } else if (filterStudent === "no") {
      items = items.filter(r => !r.is_student);
    }

    return items;
  }, [registrations, searchQuery, filterSource, filterStudent]);

  const handleDelete = (id: string) => {
    if (!isSuperAdmin) return;
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteRegistration(deleteId);
      setRegistrations(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["First Name", "Last Name", "Phone", "Location", "Referral Source", "Student", "School", "Registered At"];
    const rows = filtered.map(r => [
      r.first_name,
      r.last_name,
      r.phone_number,
      r.location_name || "",
      r.referral_source || "",
      r.is_student ? "Yes" : "No",
      r.school || "",
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expan-registrations-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("expan_admin_auth");
    navigate("/login");
  };  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center relative">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/admin-bg-pattern.png')", backgroundSize: "400px 400px", backgroundRepeat: "repeat", opacity: 0.12 }}></div>
        <div className="flex flex-col items-center gap-3">
          <div style={{ width: 32, height: 32, borderWidth: 3, borderColor: "rgba(123,30,52,0.2)", borderTopColor: "#7B1E34", borderRadius: "50%", animation: "spin 0.7s linear infinite", borderStyle: "solid" }}></div>
          <span className="text-brand/60 text-sm font-medium">Loading registrations…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0eb] font-sans relative">
      <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: "url('/admin-bg-pattern.png')", backgroundSize: "400px 400px", backgroundRepeat: "repeat", opacity: 0.12 }}></div>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#f5f0eb]/90 backdrop-blur-xl border-b border-brand/10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20">
            <span className="material-symbols-outlined text-white text-lg">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="font-bold text-sm text-brand-dark">EXPAN Admin</h1>
            <p className="text-[10px] text-brand/50 uppercase tracking-widest">Registrations Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white px-3.5 py-2 rounded-lg transition-all text-xs font-bold shadow-sm">
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
          <button onClick={handleLogout} className="text-brand/50 hover:text-brand transition-colors text-xs font-bold px-2 py-2">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 relative z-10">
        <div className="space-y-4 md:space-y-6">

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-brand rounded-xl p-4 text-center shadow-md shadow-brand/15">
              <p className="text-2xl md:text-3xl font-extrabold text-white">{registrations.length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">Total</p>
            </div>
            <div className="bg-brand rounded-xl p-4 text-center shadow-md shadow-brand/15">
              <p className="text-2xl md:text-3xl font-extrabold text-amber-300">{registrations.filter(r => r.is_student).length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">Students</p>
            </div>
            <div className="bg-brand rounded-xl p-4 text-center shadow-md shadow-brand/15">
              <p className="text-2xl md:text-3xl font-extrabold text-white">{filtered.length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">Showing</p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand/40">search</span>
              <input
                type="text"
                placeholder="Search by name, phone, or location..."
                className="w-full h-12 pl-12 pr-4 text-sm text-brand-dark placeholder:text-brand/35 bg-white/70 border border-brand/15 rounded-xl focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="h-12 px-4 text-sm text-brand-dark bg-white/70 border border-brand/15 rounded-xl cursor-pointer focus:outline-none focus:border-brand/40"
            >
              <option value="all">All Sources</option>
              <option value="Posters &amp; Flyers">Posters &amp; Flyers</option>
              <option value="Invited by someone">Invited by someone</option>
              <option value="Social Media">Social Media</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={filterStudent}
              onChange={e => setFilterStudent(e.target.value)}
              className="h-12 px-4 text-sm text-brand-dark bg-white/70 border border-brand/15 rounded-xl cursor-pointer focus:outline-none focus:border-brand/40"
            >
              <option value="all">All Members</option>
              <option value="yes">Students Only</option>
              <option value="no">Non-Students</option>
            </select>
          </div>

          {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">{error}</div>}

          {/* Registration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(reg => (
              <div key={reg.id} className="bg-[#611828] rounded-2xl p-5 group hover:bg-[#4e1320] transition-all duration-300 shadow-md shadow-brand/15">
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm border border-white/15">
                    {reg.first_name[0]}{reg.last_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-white truncate">{reg.first_name} {reg.last_name}</h3>
                    <p className="text-sm text-white/55">{reg.phone_number}</p>
                  </div>
                  {reg.is_student && (
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">STUDENT</span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-white/40">location_on</span> {reg.location_name || "Unknown Location"}
                  </p>
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-white/40">campaign</span> Heard via: <span className="text-white/80 font-medium">{reg.referral_source || "Not specified"}</span>
                  </p>
                  {reg.is_student && reg.school && (
                    <p className="text-sm text-white/60 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-white/40">school</span> {reg.school}
                    </p>
                  )}
                  <p className="text-xs text-white/35 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">calendar_today</span> {new Date(reg.created_at).toLocaleDateString()}
                  </p>
                </div>

                {isSuperAdmin && (
                  <div className="flex justify-end pt-3 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(reg.id)} className="text-red-300/70 hover:text-red-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">delete</span> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-brand/15">
              <span className="material-symbols-outlined text-5xl text-brand/20 mb-4 block">person_search</span>
              <p className="text-brand/40 text-sm">No registered members found.</p>
            </div>
          )}
        </div>
      </main>
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteId(null)}></div>
          <div className="bg-[#611828] w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border border-white/10 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-400 text-3xl">delete_forever</span>
            </div>
            <h3 className="text-white text-xl font-bold text-center mb-2">Delete Registration?</h3>
            <p className="text-white/60 text-center text-sm mb-8 px-2">
              This action cannot be undone. All data for this attendee will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                className="flex-1 h-12 rounded-xl border border-white/10 text-white/70 font-bold text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Deleting...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
