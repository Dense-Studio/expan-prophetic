/**
 * AdminDashboard — Admin Panel (/admin)
 * Dark-themed management interface for EXPAN Prophetic.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRegistrations, deleteRegistration, updateRegistration, Registration } from "../lib/adminDb";
import { EVENTS, getEventLabel } from "../lib/event";
import BulkLiveSmsPanel from "./BulkLiveSmsPanel";
import BulkReminderSmsPanel from "./BulkReminderSmsPanel";
import SmsCampaignHistory from "./SmsCampaignHistory";
import { apiRequest } from "../lib/api";

const PAGE_SIZE = 100;

interface RegistrationEditForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  location: string;
  referralSource: string;
  preferredLanguage: string;
  attendanceCount: string;
  isStudent: boolean;
  school: string;
  eventKey: string;
}

function createEditForm(registration: Registration): RegistrationEditForm {
  return {
    firstName: registration.first_name,
    lastName: registration.last_name,
    phoneNumber: registration.phone_number,
    location: registration.location_name || "",
    referralSource: registration.referral_source || "",
    preferredLanguage: registration.preferred_language || "",
    attendanceCount: registration.expan_attendance_count?.toString() || "",
    isStudent: registration.is_student,
    school: registration.school || "",
    eventKey: registration.event_key || "expan-all-night-2026-03-27",
  };
}

function normalizePhoneNumber(phoneNumber: string): string | null {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 9) return `0${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("233")) return `0${digits.slice(3)}`;
  return null;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const registrationsTopRef = useRef<HTMLDivElement>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterAttendanceCount, setFilterAttendanceCount] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [editForm, setEditForm] = useState<RegistrationEditForm | null>(null);
  const [isEditingRegistration, setIsEditingRegistration] = useState(false);
  const [isSavingRegistration, setIsSavingRegistration] = useState(false);
  const [editError, setEditError] = useState("");

  const refreshRegistrations = useCallback(async () => {
    const data = await fetchRegistrations();
    setRegistrations(data);
    setError("");
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await apiRequest<{ authenticated: boolean }>("/api/admin/session");
        await refreshRegistrations();
      } catch (err: any) {
        if (err?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(err.message || "Failed to load registrations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, refreshRegistrations]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!selectedRegistration) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSavingRegistration) {
        setSelectedRegistration(null);
        setIsEditingRegistration(false);
        setEditError("");
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRegistration, isSavingRegistration]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterEvent, filterSource, filterStudent, filterLanguage, filterAttendanceCount]);

  const filtered = useMemo(() => {
    let items = registrations;

    // Records created before event tracking was introduced belong to March.
    if (filterEvent !== "all") {
      items = items.filter(r =>
        (r.event_key || "expan-all-night-2026-03-27") === filterEvent
      );
    }

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

    if (filterLanguage !== "all") {
      items = items.filter(r => r.preferred_language === filterLanguage);
    }

    if (filterAttendanceCount !== "all") {
      items = items.filter(r => r.expan_attendance_count === Number(filterAttendanceCount));
    }

    return items;
  }, [registrations, searchQuery, filterEvent, filterSource, filterStudent, filterLanguage, filterAttendanceCount]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedRegistrations = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const paginationItems = useMemo<Array<number | string>>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const visiblePages = [...new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])]
      .filter(page => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
    const items: Array<number | string> = [];

    visiblePages.forEach((page, index) => {
      const previousPage = visiblePages[index - 1];
      if (index > 0 && page - previousPage === 2) items.push(previousPage + 1);
      if (index > 0 && page - previousPage > 2) items.push(`ellipsis-${previousPage}`);
      items.push(page);
    });

    return items;
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(page => Math.min(page, totalPages));
  }, [totalPages]);

  const editionRegistrations = useMemo(() => {
    if (filterEvent === "all") return registrations;
    return registrations.filter(r =>
      (r.event_key || "expan-all-night-2026-03-27") === filterEvent
    );
  }, [registrations, filterEvent]);

  const smsAudienceLabel = useMemo(() => {
    const edition = filterEvent === "all"
      ? "all EXPAN editions"
      : `${getEventLabel(filterEvent)} registrations`;
    const hasExtraFilters = Boolean(
      searchQuery.trim() ||
      filterSource !== "all" ||
      filterStudent !== "all" ||
      filterLanguage !== "all" ||
      filterAttendanceCount !== "all"
    );
    return hasExtraFilters ? `${edition}, matching the active filters` : edition;
  }, [filterEvent, searchQuery, filterSource, filterStudent, filterLanguage, filterAttendanceCount]);

  const openRegistrationDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setEditForm(createEditForm(registration));
    setIsEditingRegistration(false);
    setEditError("");
  };

  const closeRegistrationDetails = () => {
    if (isSavingRegistration) return;
    setSelectedRegistration(null);
    setEditForm(null);
    setIsEditingRegistration(false);
    setEditError("");
  };

  const updateEditField = (field: keyof RegistrationEditForm, value: string | boolean) => {
    setEditForm(previous => previous ? { ...previous, [field]: value } as RegistrationEditForm : previous);
    setEditError("");
  };

  const handleSaveRegistration = async () => {
    if (!selectedRegistration || !editForm || isSavingRegistration) return;

    const firstName = editForm.firstName.trim().replace(/\s+/g, " ");
    const lastName = editForm.lastName.trim().replace(/\s+/g, " ");
    const phoneNumber = normalizePhoneNumber(editForm.phoneNumber);
    if (!firstName || !lastName) {
      setEditError("First name and last name are required.");
      return;
    }
    if (!phoneNumber) {
      setEditError("Enter a valid Ghana phone number.");
      return;
    }

    setIsSavingRegistration(true);
    setEditError("");
    try {
      const updated = await updateRegistration(selectedRegistration.id, {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        location_name: editForm.location.trim() || null,
        referral_source: editForm.referralSource || null,
        preferred_language: editForm.preferredLanguage || null,
        expan_attendance_count: editForm.attendanceCount ? Number(editForm.attendanceCount) : null,
        is_student: editForm.isStudent,
        school: editForm.isStudent ? editForm.school.trim() || null : null,
        event_key: editForm.eventKey,
      });

      setRegistrations(previous => previous.map(registration => registration.id === updated.id ? updated : registration));
      setSelectedRegistration(updated);
      setEditForm(createEditForm(updated));
      setIsEditingRegistration(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not save the registration.");
    } finally {
      setIsSavingRegistration(false);
    }
  };

  const handleDelete = (id: string) => {
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
    const headers = ["EXPAN Edition", "First Name", "Last Name", "Phone", "Preferred Language", "EXPAN Attendance", "Location", "Referral Source", "Student", "School", "Registered At"];
    const rows = filtered.map(r => [
      getEventLabel(r.event_key),
      r.first_name,
      r.last_name,
      r.phone_number,
      r.preferred_language || "",
      r.expan_attendance_count || "",
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
    const edition = filterEvent === "all" ? "all-events" : getEventLabel(filterEvent).toLowerCase().replace(/\s+/g, "-");
    link.download = `expan-${edition}-registrations-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    try {
      await apiRequest<{ authenticated: boolean }>("/api/admin/logout", { method: "POST" });
    } finally {
      navigate("/login");
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.requestAnimationFrame(() => {
      registrationsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (loading) {
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
              <p className="text-2xl md:text-3xl font-extrabold text-white">{editionRegistrations.length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">In Edition</p>
            </div>
            <div className="bg-brand rounded-xl p-4 text-center shadow-md shadow-brand/15">
              <p className="text-2xl md:text-3xl font-extrabold text-amber-300">{editionRegistrations.filter(r => r.is_student).length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">Students</p>
            </div>
            <div className="bg-brand rounded-xl p-4 text-center shadow-md shadow-brand/15">
              <p className="text-2xl md:text-3xl font-extrabold text-white">{paginatedRegistrations.length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider mt-1">On Page</p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              value={filterEvent}
              onChange={e => setFilterEvent(e.target.value)}
              className="h-12 px-4 text-sm font-semibold text-brand-dark bg-white/90 border-2 border-brand/25 rounded-xl cursor-pointer focus:outline-none focus:border-brand"
              aria-label="Filter by EXPAN edition"
            >
              <option value="all">All EXPAN Editions</option>
              {Object.values(EVENTS).map(event => (
                <option key={event.key} value={event.key}>{event.shortName}</option>
              ))}
            </select>
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
            <select
              value={filterLanguage}
              onChange={e => setFilterLanguage(e.target.value)}
              className="h-12 px-4 text-sm text-brand-dark bg-white/70 border border-brand/15 rounded-xl cursor-pointer focus:outline-none focus:border-brand/40"
              aria-label="Filter by preferred language"
            >
              <option value="all">All Languages</option>
              {['English', 'Twi', 'Fante', 'Ga', 'Ewe'].map(language => <option key={language} value={language}>{language}</option>)}
            </select>
            <select
              value={filterAttendanceCount}
              onChange={e => setFilterAttendanceCount(e.target.value)}
              className="h-12 px-4 text-sm text-brand-dark bg-white/70 border border-brand/15 rounded-xl cursor-pointer focus:outline-none focus:border-brand/40"
              aria-label="Filter by EXPAN attendance count"
            >
              <option value="all">All Attendance History</option>
              <option value="1">1 EXPAN Edition</option>
              <option value="2">2 EXPAN Editions</option>
              <option value="3">3 EXPAN Editions</option>
              <option value="4">4 EXPAN Editions</option>
            </select>
          </div>

          <BulkReminderSmsPanel
            registrationIds={filtered.map((registration) => registration.id)}
            audienceLabel={smsAudienceLabel}
          />

          <BulkLiveSmsPanel
            registrationIds={filtered.map((registration) => registration.id)}
            audienceLabel={smsAudienceLabel}
            onRefreshAudience={refreshRegistrations}
          />

          <SmsCampaignHistory />

          {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">{error}</div>}

          {/* Registration Cards */}
          <div ref={registrationsTopRef} className="scroll-mt-24" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {paginatedRegistrations.map(reg => (
              <div
                key={reg.id}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${reg.first_name} ${reg.last_name}`}
                onClick={() => openRegistrationDetails(reg)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openRegistrationDetails(reg);
                  }
                }}
                className="bg-[#611828] rounded-2xl p-5 group hover:bg-[#4e1320] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 transition-all duration-300 shadow-md shadow-brand/15 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm border border-white/15">
                    {reg.first_name[0]}{reg.last_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-white truncate">{reg.first_name} {reg.last_name}</h3>
                    <p className="text-sm text-white/55">{reg.phone_number}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="bg-white/15 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">{getEventLabel(reg.event_key)}</span>
                    {reg.is_student && (
                      <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">STUDENT</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-white/40">location_on</span> {reg.location_name || "Unknown Location"}
                  </p>
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-white/40">campaign</span> Heard via: <span className="text-white/80 font-medium">{reg.referral_source || "Not specified"}</span>
                  </p>
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-white/40">translate</span> Language: <span className="text-white/80 font-medium">{reg.preferred_language || "Not specified"}</span>
                  </p>
                  <p className="text-sm text-white/60 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-white/40">event_repeat</span> EXPAN history: <span className="text-white/80 font-medium">{reg.expan_attendance_count ?? "Not specified"}</span>
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

                <div className="flex justify-end pt-3 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(reg.id);
                    }}
                    onKeyDown={event => event.stopPropagation()}
                    className="text-red-300/70 hover:text-red-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-brand/15">
              <span className="material-symbols-outlined text-5xl text-brand/20 mb-4 block">person_search</span>
              <p className="text-brand/40 text-sm">No registered members found.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white/70 border border-brand/15 px-4 py-4 shadow-sm" aria-label="Registration pagination">
              <p className="text-xs sm:text-sm text-brand/60 font-medium">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10 px-3 rounded-xl border border-brand/15 bg-white text-brand font-bold text-xs hover:border-brand/40 hover:bg-brand-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    aria-label="Previous page"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {paginationItems.map(item => typeof item === "number" ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      aria-label={`Page ${item}`}
                      aria-current={item === currentPage ? "page" : undefined}
                      className={`w-10 h-10 rounded-xl text-xs font-extrabold transition-colors ${item === currentPage ? "bg-brand text-white shadow-md shadow-brand/20" : "bg-white border border-brand/15 text-brand hover:border-brand/40 hover:bg-brand-50"}`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="w-7 text-center text-brand/35 font-bold" aria-hidden="true">…</span>
                  ))}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-10 px-3 rounded-xl border border-brand/15 bg-white text-brand font-bold text-xs hover:border-brand/40 hover:bg-brand-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              )}
            </nav>
          )}
        </div>
      </main>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll back to top"
        className={`fixed bottom-5 right-5 md:bottom-7 md:right-7 z-50 w-12 h-12 rounded-full bg-brand text-white shadow-xl shadow-brand/25 flex items-center justify-center hover:bg-brand-dark hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ${showScrollTop ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"}`}
      >
        <span className="material-symbols-outlined">arrow_upward</span>
      </button>

      {/* Registration Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="registration-detail-title">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-brand-dark/55 backdrop-blur-sm cursor-default"
            onClick={closeRegistrationDetails}
            aria-label="Close registration details"
          />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-[#fbf7f2] shadow-2xl border border-white/50 animate-scale-in" style={{ opacity: 0 }}>
            <div className="relative overflow-hidden bg-gradient-to-br from-[#7b1e34] via-[#611828] to-[#3f0f1b] px-6 pt-6 pb-8 sm:px-8">
              <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -bottom-20 -left-8 w-40 h-40 rounded-full bg-amber-300/10 pointer-events-none" />
              <button
                type="button"
                onClick={closeRegistrationDetails}
                className="absolute top-5 right-5 z-30 w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="relative flex flex-col sm:flex-row sm:items-end gap-4 pr-12">
                <div className="w-20 h-20 rounded-3xl bg-white/15 border border-white/20 text-white text-2xl font-extrabold flex items-center justify-center shadow-lg backdrop-blur-sm">
                  {selectedRegistration.first_name[0]}{selectedRegistration.last_name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-[0.16em] font-extrabold text-white/60">Registration Details</span>
                    <span className="rounded-full bg-white/12 border border-white/15 px-2.5 py-1 text-[10px] font-bold text-white/85">{getEventLabel(selectedRegistration.event_key)}</span>
                    {selectedRegistration.is_student && <span className="rounded-full bg-amber-300/15 border border-amber-300/25 px-2.5 py-1 text-[10px] font-bold text-amber-200">STUDENT</span>}
                  </div>
                  <h2 id="registration-detail-title" className="font-serif text-3xl sm:text-4xl text-white leading-tight break-words">
                    {selectedRegistration.first_name} {selectedRegistration.last_name}
                  </h2>
                  <a href={`tel:${selectedRegistration.phone_number}`} className="inline-flex items-center gap-1.5 mt-2 text-white/65 hover:text-white text-sm transition-colors">
                    <span className="material-symbols-outlined text-base">call</span>
                    {selectedRegistration.phone_number}
                  </a>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              {isEditingRegistration && editForm ? (
                <form onSubmit={(event) => { event.preventDefault(); void handleSaveRegistration(); }}>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] font-extrabold text-brand/45">Edit Registration</p>
                      <h3 className="font-serif text-2xl text-brand-dark">Update their details</h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-brand/8 text-brand flex items-center justify-center">
                      <span className="material-symbols-outlined">edit_square</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">First Name</span>
                      <input value={editForm.firstName} onChange={event => updateEditField("firstName", event.target.value)} className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">Last Name</span>
                      <input value={editForm.lastName} onChange={event => updateEditField("lastName", event.target.value)} className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">Phone Number</span>
                      <input type="tel" value={editForm.phoneNumber} onChange={event => updateEditField("phoneNumber", event.target.value)} className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">Location</span>
                      <input value={editForm.location} onChange={event => updateEditField("location", event.target.value)} placeholder="Not specified" className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark placeholder:text-brand/30 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">Event Classification</span>
                      <select value={editForm.eventKey} onChange={event => updateEditField("eventKey", event.target.value)} className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10">
                        {Object.values(EVENTS).map(event => <option key={event.key} value={event.key}>{event.shortName}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">Referral Source</span>
                      <select value={editForm.referralSource} onChange={event => updateEditField("referralSource", event.target.value)} className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10">
                        <option value="">Not specified</option>
                        <option value="Posters &amp; Flyers">Posters &amp; Flyers</option>
                        <option value="Invited by someone">Invited by someone</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">Preferred Language</span>
                      <select value={editForm.preferredLanguage} onChange={event => updateEditField("preferredLanguage", event.target.value)} className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10">
                        <option value="">Not specified</option>
                        {['English', 'Twi', 'Fante', 'Ga', 'Ewe'].map(language => <option key={language} value={language}>{language}</option>)}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">EXPAN Attendance</span>
                      <select value={editForm.attendanceCount} onChange={event => updateEditField("attendanceCount", event.target.value)} className="h-12 rounded-xl border border-brand/15 bg-white px-4 text-sm font-medium text-brand-dark focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10">
                        <option value="">Not specified</option>
                        {[1, 2, 3, 4].map(count => <option key={count} value={count}>{count}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white border border-brand/10 p-4">
                    <label className="flex items-center justify-between gap-4 cursor-pointer">
                      <span>
                        <span className="block text-sm font-bold text-brand-dark">Student</span>
                        <span className="block text-xs text-brand/45 mt-0.5">Enable this to add their school.</span>
                      </span>
                      <input type="checkbox" checked={editForm.isStudent} onChange={event => updateEditField("isStudent", event.target.checked)} className="w-5 h-5 accent-brand" />
                    </label>
                    {editForm.isStudent && (
                      <label className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-brand/10">
                        <span className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/55">School</span>
                        <input value={editForm.school} onChange={event => updateEditField("school", event.target.value)} placeholder="Enter school name" className="h-12 rounded-xl border border-brand/15 bg-[#fbf7f2] px-4 text-sm font-medium text-brand-dark placeholder:text-brand/30 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
                      </label>
                    )}
                  </div>

                  {editError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">error</span>
                      {editError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button type="button" disabled={isSavingRegistration} onClick={() => { setIsEditingRegistration(false); setEditForm(createEditForm(selectedRegistration)); setEditError(""); }} className="h-12 rounded-xl border border-brand/15 bg-white text-brand font-bold text-sm hover:bg-brand-50 disabled:opacity-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSavingRegistration} className="h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-dark disabled:opacity-50 transition-all shadow-md shadow-brand/15 flex items-center justify-center gap-2">
                      {isSavingRegistration ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><span className="material-symbols-outlined text-lg">save</span>Save Changes</>}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: "location_on", label: "Location", value: selectedRegistration.location_name || "Not specified" },
                      { icon: "campaign", label: "Referral Source", value: selectedRegistration.referral_source || "Not specified" },
                      { icon: "translate", label: "Preferred Language", value: selectedRegistration.preferred_language || "Not specified" },
                      { icon: "event_repeat", label: "EXPAN Attendance", value: selectedRegistration.expan_attendance_count ? `${selectedRegistration.expan_attendance_count} edition${selectedRegistration.expan_attendance_count === 1 ? "" : "s"}` : "Not specified" },
                      { icon: "person", label: "Member Type", value: selectedRegistration.is_student ? "Student" : "Non-student" },
                      { icon: "school", label: "School", value: selectedRegistration.school || "Not specified" },
                      { icon: "calendar_today", label: "Registered", value: new Date(selectedRegistration.created_at).toLocaleString() },
                      { icon: "pin_drop", label: "Coordinates", value: selectedRegistration.latitude != null && selectedRegistration.longitude != null ? `${selectedRegistration.latitude.toFixed(5)}, ${selectedRegistration.longitude.toFixed(5)}` : "Not captured" },
                    ].map(detail => (
                      <div key={detail.label} className="rounded-2xl bg-white border border-brand/10 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-xl bg-brand/8 text-brand flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg">{detail.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.12em] font-extrabold text-brand/45 mb-1">{detail.label}</p>
                            <p className="text-sm font-semibold text-brand-dark break-words">{detail.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button type="button" onClick={() => { setIsEditingRegistration(true); setEditForm(createEditForm(selectedRegistration)); setEditError(""); }} className="h-12 rounded-xl border-2 border-brand text-brand font-bold text-sm hover:bg-brand-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Edit Details
                    </button>
                    <button type="button" onClick={closeRegistrationDetails} className="h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-dark active:scale-[0.99] transition-all shadow-md shadow-brand/15">
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
