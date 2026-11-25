'use client';
import { useRef, useState } from 'react';
import { fields, types, sourceLinks } from '@/lib/resources-data';

type Match = {title:string; source:string; description:string; url:string};
export default function Resources() {
  const [topic,setTopic]=useState('');
  const [type,setType]=useState('all');
  const [last,setLast]=useState({topic:'',type:'all'});
  const [results,setResults]=useState<Match[]>([]);
  const [message,setMessage]=useState('');
  const active=useRef<AbortController|null>(null);
  async function search(term:string, kind:string) {
    term=term.trim();
    if(term.length<2) return;
    active.current?.abort();
    const controller=new AbortController();
    active.current=controller;
    setLast({topic:term,type:kind});setResults([]);setMessage('Searching catalogs…');
    try {
      const response=await fetch('/api/resources?'+new URLSearchParams({q:term,type:kind}),{signal:controller.signal});
      const data=await response.json();
      if(!response.ok) throw Error(data.error);
      if(controller.signal.aborted) return;
      setResults(data.results);
      setMessage(data.results.length ? data.results.length+' catalog matches.' : 'Continue with the provider searches below.');
    } catch { if(!controller.signal.aborted) setMessage('Catalogs are unavailable. Provider searches are available below.'); }
  }
  return <div className="mt-6 grid gap-6">
    <section className="panel" aria-labelledby="search-title">
      <h2 id="search-title" className="mb-3 text-xl font-bold">Search educational resources</h2>
      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={event=>{event.preventDefault();void search(topic,type);}}>
        <input aria-label="Subject or topic" className="field" type="search" placeholder="Try Kannada, nursing, or renewable energy" value={topic} onChange={event=>setTopic(event.target.value)} minLength={2} maxLength={120} required />
        <select className="field" aria-label="Resource type" value={type} onChange={event=>setType(event.target.value)}>{types.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
        <button className="action">Search</button>
      </form>
      {message && <p role="status" className="my-3 text-sm text-slate-600">{message}</p>}
      {!!results.length && <ul className="grid gap-2 sm:grid-cols-2">{results.map(result=><li key={result.url}><a href={result.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 p-3 hover:bg-indigo-50"><strong>{result.title}</strong><p className="text-sm text-slate-600">{result.source} {result.description}</p></a></li>)}</ul>}
    </section>
    <section className="panel"><h2 className="mb-3 text-xl font-bold">Browse subjects</h2>
      <div className="grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([name,topics])=><details key={String(name)} className="rounded-lg border border-slate-200 p-3"><summary className="font-semibold">{name}</summary><div className="mt-2 flex flex-wrap gap-1.5">{(topics as string[]).map(item=><button type="button" key={item} className="secondary" onClick={()=>{setTopic(item);void search(item,type);}}>{item}</button>)}</div></details>)}</div>
    </section>
    <section className="panel"><h2 className="mb-3 text-xl font-bold">Provider catalogs{last.topic ? ' for “'+last.topic+'”' : ''}</h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{sourceLinks(last.topic,last.type).map(source=><li key={source.name}><a className="block rounded-lg border border-slate-200 p-3 hover:bg-indigo-50" href={source.url ?? undefined} target="_blank" rel="noreferrer"><strong>{source.name}</strong><p className="text-sm text-slate-600">{source.label} ↗</p></a></li>)}</ul>
    </section>
  </div>;
}
