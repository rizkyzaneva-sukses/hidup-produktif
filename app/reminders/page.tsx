'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ROLES, FREQUENCIES } from '@/lib/constants';
import { Card, CardContent, Button, Input, Select, Dialog, EmptyState, Toggle, Badge } from '@/components/ui';
import { RoleBadge } from '@/components/shared/badges';
const fetcher = (url: string) => fetch(url).then(r => r.json());
const FREQ_COLORS: Record<string,any> = { Sekali:'slate', Harian:'default', Mingguan:'purple', Bulanan:'success' };
export default function RemindersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title:'', role:'CEO', date:'', frequency:'Sekali' });
  const { data: reminders=[] } = useQuery({ queryKey:['reminders'], queryFn:()=>fetcher('/api/reminders') });
  const create = useMutation({ mutationFn:(d:any)=>fetch('/api/reminders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}), onSuccess:()=>{qc.invalidateQueries({queryKey:['reminders']});setShowForm(false);setForm({title:'',role:'CEO',date:'',frequency:'Sekali'});} });
  const update = useMutation({ mutationFn:({id,...d}:any)=>fetch(`/api/reminders/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}), onSuccess:()=>{qc.invalidateQueries({queryKey:['reminders']});setEditItem(null);} });
  const del = useMutation({ mutationFn:(id:string)=>fetch(`/api/reminders/${id}`,{method:'DELETE'}), onSuccess:()=>qc.invalidateQueries({queryKey:['reminders']}) });
  const FormContent = ({data,setData,onSave}:any)=>(
    <div className="space-y-3">
      <Input placeholder="Judul reminder *" value={data.title} onChange={(e:any)=>setData((p:any)=>({...p,title:e.target.value}))} />
      <div className="grid grid-cols-2 gap-2">
        <Select options={ROLES.map(r=>({value:r,label:r}))} value={data.role} onChange={(e:any)=>setData((p:any)=>({...p,role:e.target.value}))} />
        <Select options={FREQUENCIES.map(f=>({value:f,label:f}))} value={data.frequency} onChange={(e:any)=>setData((p:any)=>({...p,frequency:e.target.value}))} />
        <Input type="date" value={data.date} onChange={(e:any)=>setData((p:any)=>({...p,date:e.target.value}))} className="col-span-2"/>
      </div>
      <div className="flex gap-2"><Button onClick={()=>onSave(data)} disabled={!data.title.trim()} className="flex-1">Simpan</Button><Button variant="outline" onClick={()=>{setShowForm(false);setEditItem(null);}}>Batal</Button></div>
    </div>
  );
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white">🔔 Reminders</h1><p className="text-slate-400 text-sm">{reminders.filter((r:any)=>r.active).length} aktif · Notifikasi via Telegram</p></div>
        <Button size="sm" onClick={()=>setShowForm(true)}>+ Reminder</Button>
      </div>
      {reminders.length===0?<EmptyState icon="🔔" title="Belum ada reminder" desc="Tambah reminder dan terima notifikasi di Telegram"/>:
      <div className="space-y-2">{reminders.map((r:any)=>(
        <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-800/40">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${r.active?'text-white':'text-slate-500'}`}>{r.title}</p>
            <div className="flex flex-wrap gap-1.5 mt-1"><RoleBadge role={r.role}/><Badge variant={FREQ_COLORS[r.frequency]}>{r.frequency}</Badge>{r.date&&<span className="text-xs text-slate-500">📅 {r.date}</span>}</div>
          </div>
          <Toggle checked={r.active} onChange={v=>update.mutate({id:r.id,active:v})}/>
          <Button size="icon" variant="ghost" onClick={()=>{setEditItem(r);}} className="h-7 w-7">✏️</Button>
          <Button size="icon" variant="ghost" onClick={()=>del.mutate(r.id)} className="h-7 w-7 text-red-400">🗑</Button>
        </div>
      ))}</div>}
      <Dialog open={showForm} onClose={()=>setShowForm(false)} title="🔔 Tambah Reminder">
        <FormContent data={form} setData={setForm} onSave={(d:any)=>create.mutate(d)}/>
      </Dialog>
      <Dialog open={!!editItem} onClose={()=>setEditItem(null)} title="✏️ Edit Reminder">
        {editItem&&<FormContent data={editItem} setData={setEditItem} onSave={(d:any)=>update.mutate({id:editItem.id,...d})}/>}
      </Dialog>
    </div>
  );
}
