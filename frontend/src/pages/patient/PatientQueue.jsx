import { useCallback, useEffect, useState } from "react";
import {
  BellRing,
  Clock3,
  RefreshCw,
  Stethoscope,
  Ticket,
  Users,
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

function PatientQueue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQueue = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get("/queue/patient/current/");
      setData(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load your queue status.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = window.setInterval(() => fetchQueue(true), 10000);
    return () => window.clearInterval(id);
  }, [fetchQueue]);

  const ticket = data?.ticket;
  const nowServing = data?.now_serving;

  return (
    <Layout>
      <div className="page-content queue-page patient-queue-page">
        <div className="page-header queue-page-header">
          <div>
            <p className="queue-eyebrow">LIVE QUEUE STATUS</p>
            <h1>My Queue Token</h1>
            <p>Track your token and know when your doctor is ready for you.</p>
          </div>
          <button className="btn-secondary" onClick={() => fetchQueue()}><RefreshCw size={17} /> Refresh</button>
        </div>

        {error && <div className="queue-alert queue-alert-error">{error}</div>}

        {loading ? (
          <div className="loading-screen">Loading queue status...</div>
        ) : !ticket ? (
          <section className="card queue-patient-empty">
            <Ticket size={44} />
            <h2>No active queue token</h2>
            <p>Your token will appear here automatically after reception checks you in for today's appointment.</p>
          </section>
        ) : (
          <>
            <section className={`queue-patient-hero queue-patient-hero-${ticket.status.toLowerCase()}`}>
              <div className="queue-patient-token-block">
                <span>YOUR TOKEN</span>
                <strong>{ticket.token_label}</strong>
                <em>{statusLabel[ticket.status] || ticket.status}</em>
              </div>

              <div className="queue-patient-main-info">
                <h2>Dr. {ticket.doctor_name}</h2>
                <p>{ticket.department_name || ticket.specialization || "Consultation"}</p>

                <div className="queue-patient-info-grid">
                  <div><Clock3 size={18} /><span>Appointment</span><strong>{formatTime(ticket.appointment_time)}</strong></div>
                  <div><Users size={18} /><span>Patients Ahead</span><strong>{data?.ahead_count ?? 0}</strong></div>
                  <div><Ticket size={18} /><span>Your Position</span><strong>{data?.position === 0 ? "Called" : (data?.position || "—")}</strong></div>
                </div>
              </div>
            </section>

            {ticket.status === "CALLED" && (
              <div className="queue-called-banner">
                <BellRing size={26} />
                <div><strong>Your token is being called now.</strong><span>Please proceed to the doctor's consultation area.</span></div>
              </div>
            )}

            <section className="queue-patient-details-grid">
              <div className="card queue-detail-card">
                <div className="queue-detail-icon"><Stethoscope size={20} /></div>
                <div><span>Doctor</span><strong>Dr. {ticket.doctor_name}</strong><p>{ticket.specialization || "—"}</p></div>
              </div>
              <div className="card queue-detail-card">
                <div className="queue-detail-icon"><BellRing size={20} /></div>
                <div><span>Now Serving</span><strong>{nowServing?.token_label || "—"}</strong><p>{nowServing?.patient_name || "No token currently called"}</p></div>
              </div>
              <div className="card queue-detail-card">
                <div className="queue-detail-icon"><Clock3 size={20} /></div>
                <div><span>Checked In</span><strong>{formatTime(ticket.checked_in_at)}</strong><p>Queue updates automatically every 10 seconds.</p></div>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

export default PatientQueue;
