'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import type { Dashboard, Session } from '@/lib/learning';
const MapView = dynamic(()=>import('./visuals').then(module=>module.ConceptMap),{ssr:false});
const Chart = dynamic(()=>import('./visuals').then(module=>module.MasteryChart),{ssr:false});
type State = Dashboard & { aiEnabled: boolean };
type Recognizer = { lang:string; onresult:((event:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null; onend:(()=>void)|null; onerror:(()=>void)|null; start():void; abort():void };
type AudioWindow = Window & { SpeechRecognition?:new()=>Recognizer; webkitSpeechRecognition?:new()=>Recognizer };

export default function Workspace() {
  const [dashboard,setDashboard]=useState<State>();
  const [subject,setSubject]=useState('');
  const [topic,setTopic]=useState('');
  const [concepts,setConcepts]=useState('');
  const [text,setText]=useState('');
  const [photo,setPhoto]=useState<File>();
  const [latest,setLatest]=useState<Session>();
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [listening,setListening]=useState(false);
  const [capabilities,setCapabilities]=useState({mic:false,speaker:false});
  const [followup,setFollowup]=useState(false);
  const recognizer=useRef<Recognizer|null>(null);
  const fileInput=useRef<HTMLInputElement|null>(null);
  const cameraInput=useRef<HTMLInputElement|null>(null);
  const explanationInput=useRef<HTMLTextAreaElement|null>(null);
  const refresh=useCallback(async()=>{
    const response=await fetch('/api/learning',{cache:'no-store'});
    const body=await response.json();
    if(!response.ok) throw Error(body.error);
    setDashboard(body);
  },[]);
  useEffect(()=>{
    const audio=window as AudioWindow;
    setCapabilities({mic:!!(audio.SpeechRecognition||audio.webkitSpeechRecognition),speaker:'speechSynthesis' in window});
    void refresh().catch(()=>setNotice('Could not load learning progress.'));
    return ()=>{ recognizer.current?.abort(); if('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  },[refresh]);

  function listen() {
    if(listening){recognizer.current?.abort();return;}
    const audio=window as AudioWindow;
    const Constructor=audio.SpeechRecognition||audio.webkitSpeechRecognition;
    if(!Constructor)return;
    try {
      const item=new Constructor();
      item.lang=navigator.language||'en-IN';
      item.onresult=event=>setText(value=>[value,Array.from(event.results,result=>result[0]?.transcript??'').join(' ')].filter(Boolean).join(' ').slice(0,7000));
      item.onend=()=>setListening(false);
      item.onerror=()=>{setNotice('Speech recognition is unavailable or microphone permission was declined.');setListening(false);};
      recognizer.current=item;
      item.start();
      setListening(true);
    } catch {setNotice('Could not start speech recognition.');}
  }
  function read(question:string){
    if(!capabilities.speaker)return;
    window.speechSynthesis.cancel();
    const speech=new SpeechSynthesisUtterance(question);
    speech.lang=navigator.language||'en-IN';
    window.speechSynthesis.speak(speech);
  }
  function choose(file?:File){
    if(file && (!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>4*1024*1024)){
      setNotice('Choose a JPG, PNG or WebP photo under 4 MB.');return;
    }
    setNotice('');setPhoto(file);
  }
  function clearPhoto(){setPhoto(undefined);if(fileInput.current)fileInput.current.value='';if(cameraInput.current)cameraInput.current.value='';}
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);setNotice('');
    const form=new FormData();
    form.set('subject',subject);form.set('topic',topic);form.set('concepts',concepts);form.set('explanation',text);
    if(followup&&latest)form.set('previousQuestion',latest.feedback.question);
    if(photo)form.set('image',photo);
    try{
      const response=await fetch('/api/learning',{method:'POST',body:form});
      const body=await response.json();
      if(!response.ok)throw Error(body.error);
      setLatest(body);setFollowup(false);clearPhoto();
      await refresh();
    }catch(error){setNotice(error instanceof Error?error.message:'Could not submit work.');}
    finally{setBusy(false);}
  }

  if(!dashboard)return <p role="status">{notice||'Loading learning workspace…'}</p>;
  const items=dashboard.concepts;
  return <div className="grid gap-5">
    {notice&&<p role="alert" className="rounded-lg bg-amber-100 p-3 text-amber-950">{notice}</p>}
    {dashboard.role==='teacher'?<section className="panel">
      <h2 className="text-xl font-bold">Teacher dashboard</h2>
      <p className="mt-1">Class code <strong className="break-all">{dashboard.classCode}</strong></p>
      <p className="text-slate-600">{dashboard.studentCount} enrolled students. Share this code with students when they create their accounts.</p>
    </section>:<div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <section className="panel"><h2 className="text-xl font-bold">Teach it back</h2>
        {!dashboard.aiEnabled&&<p className="mt-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-950">Practice mode is active. Claude grading and photo analysis need an API key.</p>}
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="label">Subject<input className="field" required maxLength={100} placeholder="Computer science" value={subject} onChange={event=>{setSubject(event.target.value);setFollowup(false);}} /></label>
            <label className="label">Topic<input className="field" required maxLength={100} placeholder="Operating systems" value={topic} onChange={event=>{setTopic(event.target.value);setFollowup(false);}} /></label>
          </div>
          <label className="label">Concepts separated by commas<input className="field" required maxLength={810} placeholder="Processes, Threads" value={concepts} onChange={event=>setConcepts(event.target.value)} /></label>
          {followup&&latest&&<p className="rounded-lg bg-indigo-50 p-3 text-sm">{latest.feedback.question}</p>}
          <label className="label">Your explanation<textarea ref={explanationInput} className="field min-h-32" required={!photo} maxLength={7000} value={text} onChange={event=>setText(event.target.value)} placeholder="Explain the concept as if I’m learning it for the first time." /></label>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {capabilities.mic&&<button type="button" className="secondary" onClick={listen}>{listening?'Stop microphone':'Dictate'}</button>}
            <label className="secondary cursor-pointer">Upload photo<input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>choose(event.target.files?.[0])}/></label>
            <label className="secondary cursor-pointer">Take photo<input ref={cameraInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={event=>choose(event.target.files?.[0])}/></label>
          </div>
          {photo&&<div className="flex flex-wrap items-center gap-2 text-sm"><span className="break-all">{photo.name}</span><button type="button" className="secondary" onClick={clearPhoto}>Remove</button></div>}
          <button className="action" disabled={busy||listening}>{busy?'Checking your explanation…':'Submit explanation'}</button>
        </form>
      </section>
      <section className="panel" aria-live="polite"><h2 className="text-xl font-bold">Feedback and follow-up</h2>
        {latest?<div className="mt-3 grid gap-3">
          <p>{latest.feedback.summary}</p>
          {!!latest.feedback.misconceptions.length&&<ul className="list-disc pl-5">{latest.feedback.misconceptions.map((item,index)=><li key={index}>{item}</li>)}</ul>}
          {latest.feedback.scores&&<p className="text-sm">{latest.feedback.scores.map(item=>item.concept+' '+item.score+'%').join(' · ')}</p>}
          <blockquote className="rounded-lg bg-indigo-50 p-3 font-semibold">{latest.feedback.question}</blockquote>
          <div className="flex flex-wrap gap-2">{capabilities.speaker&&<button className="secondary" onClick={()=>read(latest.feedback.question)}>Read question aloud</button>}<button className="secondary" onClick={()=>{setSubject(latest.subject);setTopic(latest.topic);setConcepts(latest.feedback.scores?.map(item=>item.concept).join(', ') || concepts);setFollowup(true);setText('');explanationInput.current?.focus();}}>Answer question</button></div>
        </div>:<p className="mt-2 text-slate-600">Submit an explanation to get a follow-up question.</p>}
      </section>
    </div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="panel"><h2 className="mb-3 text-xl font-bold">Concept map</h2>{items.length?<MapView concepts={items}/>:<p className="text-slate-600">Graded concepts will appear here.</p>}</section>
      <section className="panel"><h2 className="mb-3 text-xl font-bold">{dashboard.role==='teacher'?'Class mastery':'Mastery by concept'}</h2>{items.length?<Chart concepts={items}/>:<p className="text-slate-600">There are no graded concepts yet.</p>}</section>
    </div>
    <section className="panel"><h2 className="mb-3 text-xl font-bold">{dashboard.role==='teacher'?'Concepts for class review':'Review plan'}</h2>
      {items.length?<ul className="grid gap-2 sm:grid-cols-2">{items.map(item=><li className="rounded-lg border border-slate-200 p-3" key={JSON.stringify([item.subject,item.concept])}><strong>{item.concept} · {item.mastery}%</strong><p className="text-sm text-slate-600 capitalize">{item.subject} · {item.attempts} graded {item.attempts===1?'attempt':'attempts'}</p><p className="text-sm">Review {new Date(item.review_at).toLocaleDateString()}</p></li>)}</ul>:<p className="text-slate-600">Review dates are added after grading.</p>}
    </section>
    {dashboard.role==='student'&&<section className="panel"><h2 className="mb-3 text-xl font-bold">Recent sessions</h2>{dashboard.sessions.length?<div className="grid gap-2">{dashboard.sessions.map(session=><details className="rounded-lg border border-slate-200 p-3" key={session.id}><summary className="font-semibold">{session.topic} · {new Date(session.created_at).toLocaleDateString()}</summary><p className="mt-2">{session.feedback.summary}</p><p className="mt-2 text-sm">{session.feedback.question}</p></details>)}</div>:<p className="text-slate-600">Your submitted explanations will appear here.</p>}</section>}
  </div>;
}
