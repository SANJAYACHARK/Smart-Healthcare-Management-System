import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Banknote, CalendarDays, FlaskConical, RefreshCw,
  Stethoscope, TrendingUp, Users
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import Layout from "../../components/layout/Layout";
import api from "../../api/axios";

const EMPTY={kpis:{},appointment_status:[],monthly_trend:[],department_performance:[],patient_growth:[],lab_status:[],payment_status:[],top_doctors:[]};
const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(v||0));
const pretty=v=>String(v||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());

export default function AdminDashboard(){
  const [data,setData]=useState(EMPTY),[days,setDays]=useState(180),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState("");
  const load=useCallback(async(refresh=false)=>{
    try{
      refresh?setRefreshing(true):setLoading(true); setError("");
      const r=await api.get(`/analytics/admin/?days=${days}`);
      setData({...EMPTY,...r.data});
    }catch(e){setError(e.response?.data?.detail||"Failed to load hospital analytics.");}
    finally{setLoading(false);setRefreshing(false);}
  },[days]);
  useEffect(()=>{load();},[load]);

  const k=data.kpis||{};
  const cards=useMemo(()=>[
    ["Total Patients",k.total_patients,Users,"Registered patient accounts"],
    ["Appointments",k.total_appointments,CalendarDays,`${k.completion_rate||0}% completion rate`],
    ["Collected Revenue",money(k.total_revenue),Banknote,"Paid bills in selected period"],
    ["Consultations",k.consultations,Stethoscope,"Completed clinical records"],
    ["Prescriptions",k.prescriptions,Activity,"Prescriptions generated"],
    ["Lab Requests",k.lab_requests,FlaskConical,`${k.completed_labs||0} completed`],
  ],[k]);

  return <Layout><div className="page-content admin-analytics-page">
    <div className="admin-dashboard-header">
      <div><p className="page-eyebrow">ADMINISTRATION · ANALYTICS</p><h1>Hospital Analytics</h1><p className="page-description">Monitor appointments, patients, revenue, clinical activity, laboratories and department performance using live SmartCare data.</p></div>
      <div className="admin-analytics-controls">
        <select value={days} onChange={e=>setDays(Number(e.target.value))}>
          <option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 6 months</option><option value={365}>Last 12 months</option><option value={730}>Last 24 months</option>
        </select>
        <button className="btn-secondary" disabled={refreshing} onClick={()=>load(true)}><RefreshCw size={16} className={refreshing?"spin":""}/>{refreshing?"Refreshing...":"Refresh"}</button>
      </div>
    </div>
    {error&&<div className="error-message">{error}</div>}
    <div className="admin-analytics-kpi-grid">{cards.map(([label,value,Icon,desc])=><div className="card admin-analytics-kpi" key={label}><div className="admin-analytics-kpi-icon"><Icon size={21}/></div><div><span>{label}</span><strong>{loading?"...":value??0}</strong><p>{desc}</p></div></div>)}</div>

    <div className="admin-analytics-chart-grid">
      <div className="card admin-analytics-chart-card"><div className="card-header"><div><h3>Appointment Trend</h3><p>Monthly appointment volume</p></div><TrendingUp size={20}/></div><div className="admin-chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.monthly_trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis allowDecimals={false}/><Tooltip/><Area type="monotone" dataKey="appointments" stroke="#970747" fill="#970747" fillOpacity={0.12}/></AreaChart></ResponsiveContainer></div></div>
      <div className="card admin-analytics-chart-card"><div className="card-header"><div><h3>Revenue Trend</h3><p>Paid billing revenue by month</p></div><Banknote size={20}/></div><div className="admin-chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthly_trend}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={v=>money(v)}/><Bar dataKey="revenue" fill="#997747" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div>
      <div className="card admin-analytics-chart-card"><div className="card-header"><div><h3>Appointment Status</h3><p>Current workflow distribution</p></div></div><div className="admin-chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.appointment_status} dataKey="value" nameKey="status" innerRadius={58} outerRadius={88} paddingAngle={3}>{data.appointment_status.map((_,i)=><Cell key={i} fill={["#970747","#997747","#57534E","#7A0538","#78716C","#A8A29E"][i%6]}/>)}</Pie><Tooltip formatter={(v,n)=>[v,pretty(n)]}/><Legend formatter={pretty}/></PieChart></ResponsiveContainer></div></div>
      <div className="card admin-analytics-chart-card"><div className="card-header"><div><h3>Patient Growth</h3><p>New patient registrations</p></div></div><div className="admin-chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.patient_growth}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="new_patients" fill="#970747" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div>
    </div>

    <div className="admin-analytics-bottom-grid">
      <div className="card admin-analytics-table-card"><div className="card-header"><div><h3>Department Performance</h3><p>Appointments and completed consultations</p></div></div><div className="table-responsive"><table className="data-table"><thead><tr><th>Department</th><th>Appointments</th><th>Completed</th><th>Rate</th></tr></thead><tbody>{data.department_performance.length?data.department_performance.map(r=><tr key={r.department}><td><strong>{r.department}</strong></td><td>{r.appointments}</td><td>{r.completed}</td><td>{r.appointments?Math.round(r.completed/r.appointments*100):0}%</td></tr>):<tr><td colSpan="4">No department activity in this period.</td></tr>}</tbody></table></div></div>
      <div className="card admin-analytics-table-card"><div className="card-header"><div><h3>Doctor Performance</h3><p>Top doctors by completed consultations</p></div></div><div className="table-responsive"><table className="data-table"><thead><tr><th>Doctor</th><th>Specialization</th><th>Appointments</th><th>Completed</th></tr></thead><tbody>{data.top_doctors.length?data.top_doctors.map((r,i)=><tr key={`${r.doctor}-${i}`}><td><strong>Dr. {r.doctor}</strong></td><td>{r.specialization||"—"}</td><td>{r.appointments}</td><td>{r.completed}</td></tr>):<tr><td colSpan="4">No doctor activity in this period.</td></tr>}</tbody></table></div></div>
    </div>

    <div className="admin-analytics-mini-grid">
      <div className="card"><h3>Billing Status</h3>{data.payment_status.map(x=><div className="admin-analytics-status-row" key={x.status}><span>{pretty(x.status)}</span><strong>{x.value} · {money(x.amount)}</strong></div>)}<div className="admin-analytics-status-row total"><span>Outstanding</span><strong>{money(k.outstanding_amount)}</strong></div></div>
      <div className="card"><h3>Laboratory Status</h3>{data.lab_status.map(x=><div className="admin-analytics-status-row" key={x.status}><span>{pretty(x.status)}</span><strong>{x.value}</strong></div>)}</div>
    </div>
  </div></Layout>;
}
