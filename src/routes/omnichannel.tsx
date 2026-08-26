import { useMemo, useState } from 'react'
import { MessageCircle, Search, Send, Sparkles, Ticket, UserRound } from 'lucide-react'
import '../omnichannel/omnichannel.css'
import type { Conversation, Message } from '../omnichannel/types'

const demoConversations: Conversation[] = [
  { id: 'WA-DEMO-001', channel: 'WHATSAPP', contactId: 'C-001', status: 'OPEN', subject: 'Device enrollment issue', unreadCount: 2, lastMessageAt: new Date().toISOString(), aiTicketCreated: true, ticketId: 'TKT-000143' },
  { id: 'WA-DEMO-002', channel: 'WHATSAPP', contactId: 'C-002', status: 'PENDING', subject: 'BNPL repayment question', unreadCount: 0, lastMessageAt: new Date(Date.now()-3600000).toISOString() },
]

const demoMessages: Message[] = [
  { id: 'M-1', conversationId: 'WA-DEMO-001', direction: 'INBOUND', type: 'TEXT', body: 'My phone will not enroll. I have tried twice.', timestamp: new Date(Date.now()-180000).toISOString(), status: 'READ', senderName: 'Customer' },
  { id: 'M-2', conversationId: 'WA-DEMO-001', direction: 'OUTBOUND', type: 'TEXT', body: 'I can help. Please send the IMEI shown on the device.', timestamp: new Date(Date.now()-120000).toISOString(), status: 'DELIVERED', senderName: 'Credlock Support' },
  { id: 'M-3', conversationId: 'WA-DEMO-001', direction: 'INBOUND', type: 'IMAGE', body: 'IMEI screenshot attached.', timestamp: new Date(Date.now()-30000).toISOString(), status: 'READ', senderName: 'Customer' },
]

export default function OmnichannelPage() {
  const [selectedId, setSelectedId] = useState(demoConversations[0].id)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState(demoMessages)
  const selected = demoConversations.find(c => c.id === selectedId) ?? demoConversations[0]
  const filtered = useMemo(() => demoConversations.filter(c => (c.subject ?? '').toLowerCase().includes(query.toLowerCase())), [query])

  function sendMessage() {
    const text = draft.trim()
    if (!text) return
    setMessages(prev => [...prev, { id: `M-${Date.now()}`, conversationId: selected.id, direction: 'OUTBOUND', type: 'TEXT', body: text, timestamp: new Date().toISOString(), status: 'QUEUED', senderName: 'Credlock Support' }])
    setDraft('')
  }

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div><p className="text-sm font-medium text-slate-500">Omnichannel</p><h1 className="text-2xl font-bold text-slate-950">WhatsApp & Conversations</h1><p className="text-sm text-slate-500">Unified customer communication, AI triage and ticket linkage.</p></div>
      <div className="flex gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Inbox ready</span></div>
    </div>
    <div className="omnichannel-shell">
      <aside className="omnichannel-list">
        <div className="p-3 border-b border-slate-200"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none" placeholder="Search conversations" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
        {filtered.map(c => <button key={c.id} onClick={()=>setSelectedId(c.id)} className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 ${selectedId===c.id?'bg-blue-50':''}`}><div className="flex justify-between gap-2"><strong className="text-sm text-slate-900">{c.subject}</strong>{c.unreadCount>0&&<span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">{c.unreadCount}</span>}</div><div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><MessageCircle className="h-3.5 w-3.5"/> WhatsApp {c.ticketId&&<>· {c.ticketId}</>}</div></button>)}
      </aside>
      <main className="omnichannel-thread">
        <header className="omnichannel-header flex items-center justify-between gap-3 border-b border-slate-200 bg-white p-3"><div><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-blue-600"/><strong className="text-sm">Customer / Merchant</strong></div><span className="text-xs text-slate-500">{selected.id} · {selected.status}</span></div><div className="omnichannel-actions flex gap-2"><button className="rounded-lg border px-3 py-2 text-xs font-semibold"><Ticket className="mr-1 inline h-4 w-4"/> {selected.ticketId ?? 'Create ticket'}</button><button className="rounded-lg border px-3 py-2 text-xs font-semibold">Assign</button></div></header>
        <div className="flex flex-1 flex-col overflow-auto py-3">{messages.filter(m=>m.conversationId===selected.id).map(m=><div key={m.id} className={`omnichannel-message ${m.direction.toLowerCase()}`}><div className="text-sm text-slate-800">{m.body}</div><div className="mt-1 text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · {m.status}</div></div>)}</div>
        <div className="omnichannel-composer"><textarea aria-label="Message" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="Write a WhatsApp response…"/><button onClick={sendMessage} className="rounded-lg bg-blue-600 px-4 py-2 text-white"><Send className="h-5 w-5"/></button></div>
      </main>
      <aside className="omnichannel-ai p-4"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Sparkles className="h-4 w-4 text-blue-600"/> Credlock AI</div><div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-xs font-bold text-blue-900">Automatic ticket detection</p><p className="mt-1 text-xs leading-5 text-blue-800">This conversation was classified as a support issue. Suggested ticket: <strong>{selected.ticketId ?? 'pending classification'}</strong>.</p></div><div className="mt-3 space-y-2 text-xs"><div className="rounded-lg border p-3"><span className="font-semibold">Category</span><div className="mt-1 text-slate-500">Device Enrollment</div></div><div className="rounded-lg border p-3"><span className="font-semibold">Priority</span><div className="mt-1 text-slate-500">HIGH</div></div><div className="rounded-lg border p-3"><span className="font-semibold">Suggested action</span><div className="mt-1 text-slate-500">Check IMEI duplication and enrollment status.</div></div></div></aside>
    </div>
  </div>
}
