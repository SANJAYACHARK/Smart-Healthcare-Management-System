import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Play,
  RefreshCw,
  SkipForward,
  Ticket,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

function DoctorQueue() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [nowServing, setNowServing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const fetchQueue = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get("/queue/doctor/today/");
      setTickets(response.data?.results || []);
      setStats(response.data?.stats || {});
      setNowServing(response.data?.now_serving || null);
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

  const waiting = useMemo(
    () => tickets.filter((item) => item.status === "WAITING"),
    [tickets]
  );

  const runAction = async (key, request) => {
    try {
      setBusyId(key);
      setError("");
      const response = await request();
      await fetchQueue(true);
      return response;
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update queue.");
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const callNext = () =>
    runAction("call-next", () => api.post("/queue/doctor/call-next/"));

  const callTicket = (id) =>
    runAction(`call-${id}`, () => api.patch(`/queue/doctor/${id}/call/`));

  const skipTicket = (id) =>
    runAction(`skip-${id}`, () => api.patch(`/queue/doctor/${id}/skip/`));

  const startConsultation = async (ticket) => {
    const response = await runAction(
      `start-${ticket.id}`,
      () => api.patch(`/queue/doctor/${ticket.id}/start/`)
    );
    const appointmentId = response?.data?.appointment_id;
    if (appointmentId) {
      navigate(`/doctor/consultation/${appointmentId}`);
    }
  };

  return (
    <Layout>
      <div className="page-content queue-page">
        <div className="page-header queue-page-header">
          <div>
            <p className="queue-eyebrow">LIVE PATIENT FLOW</p>
            <h1>My Queue</h1>
            <p>Call patients in order and start consultation directly from the queue.</p>
          </div>

          <div className="page-header-actions">
            <button className="btn-secondary" onClick={() => fetchQueue()}>
              <RefreshCw size={17} /> Refresh
            </button>
            <button
              className="btn-primary"
              onClick={callNext}
              disabled={busyId === "call-next" || waiting.length === 0}
            >
              <BellRing size={17} />
              {busyId === "call-next" ? "Calling..." : "Call Next"}
            </button>
          </div>
        </div>

        {error && <div className="queue-alert queue-alert-error">{error}</div>}

        <div className="queue-kpi-grid">
          <div className="queue-kpi-card"><Users /><div><span>Waiting</span><strong>{stats.waiting || 0}</strong></div></div>
          <div className="queue-kpi-card"><BellRing /><div><span>Called</span><strong>{stats.called || 0}</strong></div></div>
          <div className="queue-kpi-card"><Play /><div><span>In Consultation</span><strong>{stats.in_service || 0}</strong></div></div>
          <div className="queue-kpi-card"><CheckCircle2 /><div><span>Completed</span><strong>{stats.completed || 0}</strong></div></div>
        </div>

        <section className="queue-now-serving-card">
          <div>
            <span className="queue-now-label">NOW SERVING</span>
            <strong>{nowServing?.token_label || "—"}</strong>
          </div>
          <div className="queue-now-patient">
            <b>{nowServing?.patient_name || "No patient currently called"}</b>
            <span>{nowServing ? statusLabel[nowServing.status] : "Queue is ready"}</span>
          </div>
          {nowServing?.status === "CALLED" && (
            <button
              className="btn-primary"
              onClick={() => startConsultation(nowServing)}
              disabled={busyId === `start-${nowServing.id}`}
            >
              <Play size={16} /> Start Consultation
            </button>
          )}
        </section>

        <section className="card queue-table-card">
          <div className="queue-section-heading">
            <div><h2>Today's Queue</h2><p>{tickets.length} token(s) generated today</p></div>
          </div>

          {loading ? (
            <div className="loading-screen">Loading queue...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state"><Ticket size={34} /><h3>No queue tokens yet</h3><p>Checked-in patients will appear here.</p></div>
          ) : (
            <div className="table-responsive">
              <table className="data-table queue-table">
                <thead><tr><th>Token</th><th>Patient</th><th>Appointment</th><th>Status</th><th>Check-in</th><th>Actions</th></tr></thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><span className="queue-token-chip">{ticket.token_label}</span></td>
                      <td><strong>{ticket.patient_name}</strong><span className="table-secondary">{ticket.appointment_reason || "General consultation"}</span></td>
                      <td>{formatTime(ticket.appointment_time)}</td>
                      <td><span className={`queue-status queue-status-${ticket.status.toLowerCase()}`}>{statusLabel[ticket.status] || ticket.status}</span></td>
                      <td>{formatTime(ticket.checked_in_at)}</td>
                      <td>
                        <div className="queue-row-actions">
                          {ticket.status === "WAITING" && <button className="btn-small btn-secondary" onClick={() => callTicket(ticket.id)} disabled={busyId === `call-${ticket.id}`}><BellRing size={14} /> Call</button>}
                          {ticket.status === "CALLED" && <button className="btn-small btn-primary" onClick={() => startConsultation(ticket)} disabled={busyId === `start-${ticket.id}`}><Play size={14} /> Start</button>}
                          {["WAITING", "CALLED"].includes(ticket.status) && <button className="btn-small btn-secondary" onClick={() => skipTicket(ticket.id)} disabled={busyId === `skip-${ticket.id}`}><SkipForward size={14} /> Skip</button>}
                          {ticket.status === "IN_SERVICE" && <button className="btn-small btn-primary" onClick={() => navigate(`/doctor/consultation/${ticket.appointment_id}`)}><Play size={14} /> Open</button>}
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

export default DoctorQueue;
