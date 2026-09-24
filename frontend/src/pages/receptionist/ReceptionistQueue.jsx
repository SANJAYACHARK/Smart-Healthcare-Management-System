import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  Search,
  SkipForward,
  Ticket,
  Users,
  BellRing,
  CheckCircle2,
} from "lucide-react";

import Layout from "../../components/layout/Layout";
import api from "../../api/axios";

const statusLabel = {
  WAITING: "Waiting",
  CALLED: "Called",
  IN_SERVICE: "In Consultation",
  COMPLETED: "Completed",
  SKIPPED: "Skipped",
  CANCELLED: "Cancelled",
};

const formatTime = (value) => {
  if (!value) return "—";
  const text = String(value);
  if (/^\d{2}:\d{2}/.test(text)) return text.slice(0, 5);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

function ReceptionistQueue() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  const fetchQueue = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get("/queue/receptionist/today/");
      setTickets(response.data?.results || []);
      setStats(response.data?.stats || {});
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load today's queue.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = window.setInterval(() => fetchQueue(true), 15000);
    return () => window.clearInterval(id);
  }, [fetchQueue]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const haystack = `${item.token_label} ${item.patient_name} ${item.doctor_name} ${item.department_name || ""}`.toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [tickets, search, statusFilter]);

  const updateTicket = async (id, action) => {
    try {
      setBusyId(`${action}-${id}`);
      setError("");
      await api.patch(`/queue/receptionist/${id}/${action}/`);
      await fetchQueue(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update queue token.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="page-content queue-page">
        <div className="page-header queue-page-header">
          <div>
            <p className="queue-eyebrow">TODAY'S HOSPITAL FLOW</p>
            <h1>Live Queue</h1>
            <p>Monitor checked-in patients across all doctors in real time.</p>
          </div>
          <button className="btn-secondary" onClick={() => fetchQueue()}><RefreshCw size={17} /> Refresh</button>
        </div>

        {error && <div className="queue-alert queue-alert-error">{error}</div>}

        <div className="queue-kpi-grid">
          <div className="queue-kpi-card"><Users /><div><span>Waiting</span><strong>{stats.waiting || 0}</strong></div></div>
          <div className="queue-kpi-card"><BellRing /><div><span>Called</span><strong>{stats.called || 0}</strong></div></div>
          <div className="queue-kpi-card"><Ticket /><div><span>In Consultation</span><strong>{stats.in_service || 0}</strong></div></div>
          <div className="queue-kpi-card"><CheckCircle2 /><div><span>Completed</span><strong>{stats.completed || 0}</strong></div></div>
        </div>

        <section className="card queue-table-card">
          <div className="queue-toolbar">
            <div className="queue-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search token, patient or doctor..." /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="WAITING">Waiting</option>
              <option value="CALLED">Called</option>
              <option value="IN_SERVICE">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="SKIPPED">Skipped</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-screen">Loading queue...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Ticket size={34} /><h3>No matching queue tokens</h3><p>Tokens are generated automatically when confirmed appointments are checked in.</p></div>
          ) : (
            <div className="table-responsive">
              <table className="data-table queue-table">
                <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><span className="queue-token-chip">{ticket.token_label}</span></td>
                      <td><strong>{ticket.patient_name}</strong><span className="table-secondary">{ticket.appointment_reason || "General consultation"}</span></td>
                      <td><strong>Dr. {ticket.doctor_name}</strong><span className="table-secondary">{ticket.department_name || ticket.specialization || "—"}</span></td>
                      <td>{formatTime(ticket.appointment_time)}</td>
                      <td><span className={`queue-status queue-status-${ticket.status.toLowerCase()}`}>{statusLabel[ticket.status] || ticket.status}</span></td>
                      <td>
                        <div className="queue-row-actions">
                          {["WAITING", "CALLED"].includes(ticket.status) && <button className="btn-small btn-secondary" onClick={() => updateTicket(ticket.id, "skip")} disabled={busyId === `skip-${ticket.id}`}><SkipForward size={14} /> Skip</button>}
                          {ticket.status === "SKIPPED" && <button className="btn-small btn-secondary" onClick={() => updateTicket(ticket.id, "restore")} disabled={busyId === `restore-${ticket.id}`}><RotateCcw size={14} /> Restore</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default ReceptionistQueue;
