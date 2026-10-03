"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2, ArrowLeft } from "lucide-react";
import { getDashboardStats, getSubmissions, updateSubmissionStatus, type Submission } from "./actions";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ totalResponses: number; newResponses: number; reviewedResponses: number; todayResponses: number; roleCounts: Record<string, number> } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [count, setCount] = useState(0);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isLoading, setIsLoading] = useState(true);

  const [selectedResponse, setSelectedResponse] = useState<Submission | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, submissionsData] = await Promise.all([
        getDashboardStats(),
        getSubmissions({ page, limit, role: roleFilter, status: statusFilter, date: dateFilter, search: searchQuery }),
      ]);
      setStats(statsData);
      setSubmissions(submissionsData.data);
      setCount(submissionsData.count);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, roleFilter, statusFilter, dateFilter, searchQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleStatusChange = async (id: string, newStatus: "new" | "reviewed") => {
    try {
      await updateSubmissionStatus(id, newStatus);
      // Update local state
      setSubmissions((prev) => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      if (selectedResponse && selectedResponse.id === id) {
        setSelectedResponse({ ...selectedResponse, status: newStatus });
      }
      // Re-fetch stats quietly
      getDashboardStats().then(setStats).catch(console.error);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="flex gap-8 relative max-w-7xl mx-auto h-full">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${selectedResponse ? 'hidden lg:block lg:pr-[400px]' : ''}`}>
        
        {/* Stats Row */}
        {isLoading && !stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-sm">
              <div className="text-[10px] text-[#A1A1AA] font-bold tracking-widest uppercase mb-2">Total Responses</div>
              <div className="text-3xl font-medium">{stats.totalResponses}</div>
            </div>
            <div className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-sm">
              <div className="text-[10px] text-[#A1A1AA] font-bold tracking-widest uppercase mb-2">New</div>
              <div className="text-3xl font-medium">{stats.newResponses}</div>
            </div>
            <div className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-sm">
              <div className="text-[10px] text-[#A1A1AA] font-bold tracking-widest uppercase mb-2">Reviewed</div>
              <div className="text-3xl font-medium">{stats.reviewedResponses}</div>
            </div>
            <div className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-sm">
              <div className="text-[10px] text-[#A1A1AA] font-bold tracking-widest uppercase mb-2">Today</div>
              <div className="text-3xl font-medium">{stats.todayResponses}</div>
            </div>
          </div>
        ) : null}

        {/* Breakdown Row */}
        {stats && (
          <div className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 mb-12 shadow-sm">
            <h3 className="text-[11px] font-bold tracking-[0.2em] text-[#A1A1AA] uppercase mb-6">Response Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { label: "Patient", key: "patient" },
                { label: "Family", key: "family" },
                { label: "Doctor", key: "doctor" },
                { label: "Nurse", key: "nurse" },
                { label: "Staff", key: "staff" },
                { label: "Other", key: "other" }
              ].map(role => {
                const count = stats.roleCounts[role.key] || 0;
                const percent = stats.totalResponses > 0 ? (count / stats.totalResponses) * 100 : 0;
                return (
                  <div key={role.key}>
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-xs text-[#A1A1AA]">{role.label}</div>
                      <div className="text-sm font-medium">{count}</div>
                    </div>
                    <div className="h-1.5 w-full bg-[#171717] rounded-full overflow-hidden">
                      <div className="h-full bg-white/80" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={roleFilter} 
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Roles</option>
              <option value="patient">Patient</option>
              <option value="family">Family / Caregiver</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="staff">Healthcare Staff</option>
              <option value="other">Other</option>
            </select>
            
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
            </select>

            <select 
              value={dateFilter} 
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.12)] text-[#FFFFFF] text-xs px-3 py-1.5 rounded-md focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>

            {(roleFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || searchInput) && (
              <button onClick={resetFilters} className="text-xs text-[#A1A1AA] hover:text-white flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input 
              type="text" 
              placeholder="Search responses..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-[#0B0B0B] border border-[rgba(255,255,255,0.12)] rounded-md text-sm w-full md:w-64 focus:outline-none focus:border-[#A1A1AA]"
            />
          </div>
        </div>

        {/* Responses Table */}
        <div className="bg-[#0B0B0B] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#050505]/50">
                  <th className="px-5 py-3 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono">Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono">Role</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono">Problem</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-[#71717A]">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading responses...
                      </div>
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <p className="text-white font-medium mb-1">No responses yet.</p>
                      <p className="text-[#71717A] text-sm">Responses submitted through the public experience will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr 
                      key={sub.id} 
                      onClick={() => setSelectedResponse(sub)}
                      className={`group cursor-pointer transition-colors ${selectedResponse?.id === sub.id ? 'bg-[#171717]' : 'hover:bg-[#111111]'}`}
                    >
                      <td className="px-5 py-4 text-xs text-[#A1A1AA] whitespace-nowrap align-top">{formatDate(sub.created_at)}</td>
                      <td className="px-5 py-4 text-sm text-white capitalize align-top">{sub.role}</td>
                      <td className="px-5 py-4 align-top max-w-md">
                        <p className="text-sm text-[#A1A1AA] line-clamp-2 leading-relaxed group-hover:text-white/90 transition-colors">
                          {sub.problem_text}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center align-top">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          sub.status === 'new' 
                            ? 'bg-white/10 text-white border-white/20' 
                            : 'bg-[#111111] text-[#71717A] border-[#333]'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!isLoading && count > limit && (
            <div className="border-t border-[rgba(255,255,255,0.08)] px-5 py-3 flex items-center justify-between bg-[#050505]/50">
              <span className="text-xs text-[#71717A]">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, count)} of {count}
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-xs border border-[rgba(255,255,255,0.12)] rounded-md disabled:opacity-30 hover:bg-[#171717]"
                >
                  Prev
                </button>
                <button 
                  disabled={page * limit >= count}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-xs border border-[rgba(255,255,255,0.12)] rounded-md disabled:opacity-30 hover:bg-[#171717]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side Detail Panel */}
      <div className={`fixed inset-0 z-50 bg-[#0B0B0B] lg:bg-transparent lg:absolute lg:top-0 lg:right-0 lg:bottom-0 lg:w-[400px] border-l border-[rgba(255,255,255,0.08)] transition-transform duration-300 ${
        selectedResponse ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {selectedResponse && (
          <div className="flex flex-col h-full lg:h-[calc(100vh-4rem)] bg-[#0B0B0B]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)] bg-[#050505]">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedResponse(null)} className="lg:hidden text-[#A1A1AA] hover:text-white p-1 -ml-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-sm font-medium">Response Detail</h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                    selectedResponse.status === 'new' 
                      ? 'bg-white/10 text-white border-white/20' 
                      : 'bg-[#111111] text-[#71717A] border-[#333]'
                  }`}>
                    {selectedResponse.status}
                </span>
              </div>
              <button onClick={() => setSelectedResponse(null)} className="hidden lg:block text-[#71717A] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#A1A1AA] uppercase mb-2">Role</h4>
                <div className="text-sm capitalize px-3 py-1.5 bg-[#171717] inline-block rounded-md border border-[rgba(255,255,255,0.04)]">{selectedResponse.role}</div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#A1A1AA] uppercase mb-2">Problem</h4>
                <p className="text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap">{selectedResponse.problem_text}</p>
              </div>

              {selectedResponse.improvement_text && (
                <div>
                  <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#A1A1AA] uppercase mb-2">What would have made it easier?</h4>
                  <p className="text-[15px] leading-relaxed text-[#A1A1AA] whitespace-pre-wrap">{selectedResponse.improvement_text}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[rgba(255,255,255,0.04)]">
                <div>
                  <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#71717A] uppercase mb-1">Date Submitted</h4>
                  <div className="text-xs text-[#A1A1AA] font-mono">{formatDate(selectedResponse.created_at)}</div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#71717A] uppercase mb-1">Source</h4>
                  <div className="text-xs text-[#A1A1AA] font-mono">{selectedResponse.source || "Unknown"}</div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#71717A] uppercase mb-1">Response ID</h4>
                  <div className="text-[10px] text-[#71717A] font-mono truncate" title={selectedResponse.id}>{selectedResponse.id}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[#050505]">
              {selectedResponse.status === "new" ? (
                <button 
                  onClick={() => handleStatusChange(selectedResponse.id, "reviewed")}
                  className="w-full bg-white text-black font-medium text-sm py-2.5 rounded-md hover:bg-[#EAE8E1] transition-colors"
                >
                  Mark as Reviewed
                </button>
              ) : (
                <button 
                  onClick={() => handleStatusChange(selectedResponse.id, "new")}
                  className="w-full bg-transparent border border-[#333] text-[#A1A1AA] font-medium text-sm py-2.5 rounded-md hover:bg-[#111111] hover:text-white transition-colors"
                >
                  Move back to New
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
