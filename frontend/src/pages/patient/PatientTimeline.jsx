import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard, FileHeart, Filter, Pill, RefreshCw, Stethoscope, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import api from "../../api/axios";

const FILTERS=[["ALL","All Events"],["APPOINTMENT","Appointments"],["MEDICAL_RECORD","Medical Records"],["PRESCRIPTION","Prescriptions"],["LAB_REPORT","Lab Reports"],["BILLING","Billing"]];
const META={APPOINTMENT:["Appointment",CalendarDays],MEDICAL_RECORD:["Medical Record",FileHeart],PRESCRIPTION:["Prescription",Pill],LAB_REPORT:["Lab Report",TestTube],BILLING:["Billing",CreditCard]};
const fmt=v=>{if(!v)return"Date unavailable";const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});};

export default function PatientTimeline(){
 const navigate=useNavigate(),[events,setEvents]=useState([]),[patient,setPatient]=useState(null),[filter,setFilter]=useState("ALL"),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{try{setLoading(true);const r=await api.get("/medical-records/patient/timeline/");setEvents(r.data?.results||[]);setPatient(r.data?.patient||null);setError("");}catch(e){setError(e.response?.data?.detail||"Unable to load your health timeline.");}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 const shown=useMemo(()=>filter==="ALL"?events:events.filter(x=>x.type===filter),[events,filter]);
 const counts=useMemo(()=>events.reduce((a,x)=>({...a,[x.type]:(a[x.type]||0)+1}),{}),[events]);
 return <Layout><div className="page-content ehr-page">
  <div className="page-header ehr-page-header"><div><p className="ehr-eyebrow">ELECTRONIC HEALTH RECORD</p><h1>My Health Timeline</h1><p>Appointments, clinical records, prescriptions, laboratory tests and billing in one chronological history.</p></div><button className="btn-secondary" onClick={load}><RefreshCw size={17}/> Refresh</button></div>
  {error&&<div className="ehr-alert ehr-alert-error">{error}</div>}
  <section className="ehr-summary-card"><div className="ehr-summary-icon"><Stethoscope size={26}/></div><div><span>PATIENT HEALTH RECORD</span><h2>{patient?.name||"My Medical History"}</h2><p>{events.length} recorded healthcare event(s)</p></div></section>
  <div className="ehr-filter-row"><div className="ehr-filter-title"><Filter size={17}/> Filter timeline</div><div className="ehr-filter-buttons">{FILTERS.map(([v,l])=><button key={v} className={`ehr-filter-btn ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}<span>{v==="ALL"?events.length:(counts[v]||0)}</span></button>)}</div></div>
  {loading?<div className="loading-screen">Loading health timeline...</div>:!shown.length?<div className="card ehr-empty-state"><FileHeart size={40}/><h3>No health events found</h3><p>Your healthcare activity will appear here as records are created.</p></div>:
  <section className="ehr-timeline">{shown.map(x=>{const [label,Icon]=META[x.type]||META.MEDICAL_RECORD;return <article key={x.id} className="ehr-timeline-item"><div className="ehr-timeline-rail"><div className={`ehr-timeline-icon ehr-type-${x.type.toLowerCase()}`}><Icon size={18}/></div></div><div className="card ehr-event-card"><div className="ehr-event-header"><div><span className="ehr-event-type">{label}</span><h3>{x.title}</h3><p>{x.subtitle||"SmartCare"}</p></div>{x.status&&<span className="ehr-status">{x.status.replaceAll("_"," ")}</span>}</div><div className="ehr-event-footer"><span>{fmt(x.occurred_at)}</span>{x.action_url&&<button className="btn-small btn-secondary" onClick={()=>navigate(x.action_url)}>View Details</button>}</div></div></article>})}</section>}
 </div></Layout>;
}
