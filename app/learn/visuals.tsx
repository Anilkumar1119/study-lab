'use client';
import { useMemo } from 'react';
import { Background, ReactFlow, type Node, type Edge } from '@xyflow/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Concept } from '@/lib/learning';
import '@xyflow/react/dist/style.css';

export function MasteryChart({ concepts }: { concepts: Concept[] }) {
  const entries = concepts.slice(0, 8).map(concept=>({ ...concept, label: concept.concept.length>26 ? concept.concept.slice(0,25)+'…' : concept.concept }));
  return <div className="h-64 min-w-0" aria-label="Mastery percentages">
    <ResponsiveContainer width="100%" height="100%" minWidth={1}>
      <BarChart data={entries} layout="vertical" margin={{left:6,right:20,top:5,bottom:4}}>
        <CartesianGrid horizontal={false} strokeDasharray="4 3" />
        <XAxis type="number" domain={[0,100]} unit="%" />
        <YAxis type="category" dataKey="label" width={117} tick={{fontSize:11}} />
        <Tooltip labelFormatter={(_,serial)=>serial[0]?.payload?.concept ?? ''} />
        <Bar dataKey="mastery" name="Mastery (%)" fill="#4f46c6" radius={[0,5,5,0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

export function ConceptMap({ concepts }: { concepts: Concept[] }) {
  const graph = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const topics = Map.groupBy(concepts.slice(0,24), item=>item.subject);
    let y=0;
    for(const [subject,items] of topics) {
      const group='group-'+subject;
      nodes.push({id:group,position:{x:0,y},data:{label:subject},style:{background:'#e0e7ff',borderColor:'#9ba7df',textTransform:'capitalize'}});
      for(const [index,item] of items.entries()) {
        const id=JSON.stringify([subject,item.concept]);
        const tone=item.mastery<60?'#fff0d7':item.mastery<80?'#e8ebff':'#e1f7ea';
        nodes.push({id,position:{x:225+(index%3)*200,y:y+Math.floor(index/3)*80},data:{label:item.concept+' · '+item.mastery+'%'},style:{background:tone,borderColor:'#b4bed1',width:175}});
        edges.push({id:group+id,source:group,target:id});
      }
      y+=Math.ceil(items.length/3)*80+35;
    }
    return {nodes,edges};
  },[concepts]);
  return <div className="h-72 overflow-hidden rounded-lg border border-slate-200" aria-label="Concept map grouped by subject">
    <ReactFlow key={JSON.stringify(graph.nodes.map(node=>node.id))} {...graph} fitView minZoom={.05} maxZoom={1.4} nodesDraggable={false} nodesConnectable={false} panOnScroll={false}>
      <Background />
    </ReactFlow>
  </div>;
}
