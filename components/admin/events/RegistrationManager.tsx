"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

type Registration = { id: string; status: string; confirmation_number: string; full_name: string; email: string;
  answers: { label: string; value: string }[] };

export default function RegistrationManager({ eventId }: { eventId: string }) {
  const [registrations,setRegistrations] = useState<Registration[]>([]);
  const [offset,setOffset] = useState(0);
  const [hasMore,setHasMore] = useState(false);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [saving,setSaving] = useState<string | null>(null);
  const { addToast } = useToast();
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    fetch(`/api/admin/events/${encodeURIComponent(eventId)}/registrations?offset=${offset}`)
      .then(async(response) => { const data = await response.json(); if(!response.ok)throw new Error(data.error || "Failed to load registrations");return data; })
      .then((data) => { if(active){setRegistrations(data.registrations);setHasMore(data.hasMore);} })
      .catch((failure) => {if(active)setError(failure.message);})
      .finally(() => {if(active)setLoading(false);});
    return () => {active=false;};
  },[eventId,offset]);
  const updateStatus = async (registration: Registration, status: string) => {
    setSaving(registration.id);
    try {
      const response = await fetch(`/api/admin/events/${encodeURIComponent(eventId)}/registrations`, {
        method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ registrationId: registration.id, status }),
      });
      const data = await response.json();
      if(!response.ok)throw new Error(data.error || "Failed to update registration");
      setRegistrations((current) => current.map((row) => row.id===registration.id ? {...row,status:data.registration.status} : row));
      addToast({ type:"success",title:"Registration updated",description:status==="confirmed" && registration.status!=="confirmed" && !data.emailSent ? "Saved. Confirmation email could not be sent." : "Registration status saved." });
    } catch(failure) {
      addToast({ type:"error",title:"Update failed",description:failure instanceof Error?failure.message:"Please try again." });
    } finally {setSaving(null);}
  };
  return <div style={{padding:"1rem",display:"grid",gap:"1rem"}}>
    <a href={`/api/admin/events/${encodeURIComponent(eventId)}/registrations/export?format=excel`}>Download all registrations (Excel)</a>
    {loading && <p>Loading registrations…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && !registrations.length && <p>No registrations yet.</p>}
    {registrations.map((registration) => <article key={registration.id} style={{border:"1px solid var(--admin-line)",borderRadius:"0.5rem",padding:"1rem"}}>
      <p><strong>{registration.full_name || "Deleted member"}</strong> · {registration.email} · {registration.status}</p>
      <p style={{fontSize:"0.8rem"}}>{registration.confirmation_number}</p>
      <details><summary>Registration answers</summary>{(registration.answers || []).map((answer,index)=><p key={index}><strong>{answer.label}:</strong> {answer.value}</p>)}</details>
      <div style={{display:"flex",gap:"1rem",marginTop:"0.75rem"}}>
        {["confirmed","waitlist","cancelled"].map((status)=><button type="button" key={status} disabled={saving===registration.id || registration.status===status} onClick={()=>updateStatus(registration,status)}>{status==="confirmed"?"Approve":status==="waitlist"?"Waitlist":"Cancel"}</button>)}
      </div>
    </article>)}
    <div style={{display:"flex",gap:"1rem"}}>
      <button type="button" disabled={offset===0 || loading} onClick={()=>setOffset((value)=>Math.max(0,value-100))}>Previous</button>
      <button type="button" disabled={!hasMore || loading} onClick={()=>setOffset((value)=>value+100)}>Next</button>
    </div>
  </div>;
}
