/**
 * AdminDashboard — Admin Panel (/admin)
 * Comprehensive management interface for EXPAN Prophetic.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRegistrations, deleteRegistration, Registration } from "../lib/adminDb";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab] = useState<"registrations">("registrations");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuperAdmin] = useState(() => sessionStorage.getItem("expan_admin_role") === "superadmin");

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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r => 
        r.first_name.toLowerCase().includes(q) || 
        r.last_name.toLowerCase().includes(q) || 
        r.phone_number.includes(q) ||
        (r.location_name || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [registrations, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin || !confirm("Delete this registration?")) return;
    try {
      await deleteRegistration(id);
      setRegistrations(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("expan_admin_auth");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-white font-display">
      <header className="sticky top-0 z-50 glass-card border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="font-bold text-sm">EXPAN Admin</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Registrations Management</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors text-xs font-bold">Logout</button>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30">search</span>
            <input 
              type="text" 
              placeholder="Search by name, phone, or location..." 
              className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-primary/50 transition-all text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {error && <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(reg => (
              <div key={reg.id} className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {reg.first_name[0]}{reg.last_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate">{reg.first_name} {reg.last_name}</h3>
                    <p className="text-xs text-white/40">{reg.phone_number}</p>
                  </div>
                  {reg.is_student && (
                    <span className="bg-accent/10 text-accent text-[8px] font-bold px-2 py-0.5 rounded-full border border-accent/20">STUDENT</span>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-[11px] text-white/30 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">location_on</span> {reg.location_name || "Unknown Location"}
                  </p>
                  <p className="text-[11px] text-white/30 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">campaign</span> Heard via: <span className="text-white/60">{reg.referral_source || "Not specified"}</span>
                  </p>
                  {reg.is_student && reg.school && (
                    <p className="text-[11px] text-white/30 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">school</span> {reg.school}
                    </p>
                  )}
                </div>

                {isSuperAdmin && (
                  <div className="flex justify-end pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(reg.id)} className="text-red-400/60 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">delete</span> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/5">
              <span className="material-symbols-outlined text-5xl text-white/10 mb-4 block">person_search</span>
              <p className="text-white/20 text-sm">No registered members found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
