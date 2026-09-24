import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CreditCard, FileHeart, Pill, RefreshCw, TestTube } from "lucide-react";
import { useParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import api from "../../api/axios";
const ICONS={APPOINTMENT:CalendarDays,MEDICAL_RECORD:FileHeart,PRESCRIPTION:Pill,LAB_REPORT:TestTube,BILLING:CreditCard};
export default function PatientTimelineView(){
 const {patientId}=useParams(),[data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const load=useCallback(async()=>{try{setLoading(true);const r=await api.get(`/medical-records/doctor/patients/${patientId}/timeline/`);setData(r.data);setError("");}catch(e){setError(e.response?.data?.detail||"Unable to load patient timeline.");}finally{setLoading(false);}},[patientId]);
 useEffect(()=>{load();},[load]);
 return <Layout><div className="page-content ehr-page"><div className="page-header ehr-page-header"><div><p className="ehr-eyebrow">PATIENT EHR</p><h1>{data?.patient?.name||"Patient Timeline"}</h1><p>Longitudinal clinical history available to you as the treating doctor.</p></div><button className="btn-secondary" onClick={load}><RefreshCw size={17}/> Refresh</button></div>{error&&<div className="ehr-alert ehr-alert-error">{error}</div>}{loading?<div className="loading-screen">Loading patient timeline...</div>:!data?.results?.length?<div className="card ehr-empty-state"><FileHeart size={40}/><h3>No health history found</h3></div>:<section className="ehr-timeline">{data.results.map(x=>{const Icon=ICONS[x.type]||FileHeart;return <article key={x.id} className="ehr-timeline-item"><div className="ehr-timeline-rail"><div className={`ehr-timeline-icon ehr-type-${x.type.toLowerCase()}`}><Icon size={18}/></div></div><div className="card ehr-event-card"><div className="ehr-event-header"><div><span className="ehr-event-type">{x.type.replaceAll("_"," ")}</span><h3>{x.title}</h3><p>{x.subtitle}</p></div>{x.status&&<span className="ehr-status">{x.status.replaceAll("_"," ")}</span>}</div><div className="ehr-event-footer"><span>{x.occurred_at?new Date(x.occurred_at).toLocaleString("en-IN"):"—"}</span></div></div></article>})}</section>}</div></Layout>;
}
