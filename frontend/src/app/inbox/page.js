"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Mail, Send, ChevronRight, LogOut, Search, RefreshCw,
  AlertCircle, Star, ArrowRight, CornerUpLeft, CheckCircle2, MessageSquare, Trash2, Clipboard, Check, Download, HelpCircle, Paperclip, Globe, X
} from 'lucide-react';
import UrgencyBadge from '@/components/UrgencyBadge';
import CustomSelectDropdown from '@/components/CustomSelectDropdown';
import api from '@/lib/api';

const SafeHtmlViewer = ({ html, id }) => {
  const [height, setHeight] = React.useState('150px');

  React.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'resize-email-iframe' && event.data.id === id) {
        setHeight(`${event.data.height}px`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [id]);

  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          color: #1a1a1a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        a {
          color: #2563eb;
          text-decoration: underline;
        }
        table {
          max-width: 100% !important;
          width: 100% !important;
        }
      </style>
      <script>
        let lastHeight = 0;
        function sendHeight() {
          const wrapper = document.getElementById('email-content-wrapper');
          if (!wrapper) return;
          const height = Math.ceil(wrapper.getBoundingClientRect().height);
          // Only send message if change is significant to avoid infinite feedback loops
          if (height > 0 && Math.abs(height - lastHeight) > 3) {
            lastHeight = height;
            window.parent.postMessage({
              type: 'resize-email-iframe',
              id: '${id}',
              height: height
            }, '*');
          }
        }
        window.addEventListener('load', sendHeight);
        window.addEventListener('resize', sendHeight);
        document.addEventListener('DOMContentLoaded', sendHeight);
      </script>
    </head>
    <body>
      <div id="email-content-wrapper" style="padding: 16px; box-sizing: border-box; overflow: hidden; width: 100%;">
        ${html}
      </div>
      <script>
        setTimeout(sendHeight, 150);
        setTimeout(sendHeight, 600); // Back-up for image loads
      </script>
    </body>
    </html>
  `;

  return (
    <iframe
      srcDoc={styledHtml}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      className="w-full border-0 rounded-xl bg-white"
      style={{ height, transition: 'height 0.15s ease' }}
    />
  );
};

export default function InboxDashboard() {
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [activeTone, setActiveTone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mailai_preferred_tone') || 'formal';
    }
    return 'formal';
  });
  const [replyText, setReplyText] = useState('');

  // Loaders
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftsLoading, setDraftsLoading] = useState({ formal: false, casual: false, urgent: false });
  const [copied, setCopied] = useState(false);
  const [summaryLength, setSummaryLength] = useState('medium');
  const [toastMessage, setToastMessage] = useState('');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [customDirectives, setCustomDirectives] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [starredThreads, setStarredThreads] = useState({});
  const [customLabels, setCustomLabels] = useState({});
  const [newLabelText, setNewLabelText] = useState('');
  const [searchHistory, setSearchHistory] = useState(['invoice', 'meeting', 'action required']);
  const [showHistory, setShowHistory] = useState(false);
  const [completedTasks, setCompletedTasks] = useState({});
  const [lastSyncTime, setLastSyncTime] = useState('Just now');

  // AI Insights
  const [summary, setSummary] = useState('');
  const [drafts, setDrafts] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [classification, setClassification] = useState(null);
  const [error, setError] = useState('');

  // Fetch threads on load
  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    const unread = threads.filter(t => !t.isRead).length;
    document.title = unread > 0 ? `(${unread}) MailAI - Inbox` : 'MailAI - Inbox';
  }, [threads]);

  useEffect(() => {
    const handleKeys = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = threads.findIndex(t => t.id === selectedId);
        if (idx !== -1 && idx < threads.length - 1) {
          handleSelectThread(threads[idx + 1]);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = threads.findIndex(t => t.id === selectedId);
        if (idx > 0) {
          handleSelectThread(threads[idx - 1]);
        }
      } else if (e.key === 's') {
        handleSync();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [threads, selectedId]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/emails');
      const items = res.data.threads || [];
      setThreads(items);
      if (items.length > 0) {
        setSelectedId(items[0].id);
        fetchThreadDetails(items[0].id);
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Could not retrieve emails. Make sure you are authenticated.');
    } finally {
      setLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }
  };

  const fetchThreadDetails = async (threadId) => {
    try {
      setThreadLoading(true);
      setActiveThread(null);
      setSummary('');
      setDrafts(null);
      setFollowups([]);
      setClassification(null);
      setTranslatedText('');

      const res = await api.get(`/api/emails/${threadId}`);
      setActiveThread(res.data);

      // Concatenate messages content for AI processing
      const content = res.data.messages.map(m => `${m.sender}: ${m.content}`).join('\n\n');

      // Load AI insights in parallel
      generateAIInsights(content);
    } catch (err) {
      console.error('Error fetching thread details:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  const generateAIInsights = async (threadContent) => {
    try {
      setAiLoading(true);
      setActiveTone('formal');

      // Run AI calls in parallel
      const [summaryRes, draftRes, followupRes, classifyRes] = await Promise.all([
        api.post('/api/ai/summarize', { threadContent, customDirectives, length: summaryLength }).catch(e => ({ data: { summary: 'Summary unavailable.' } })),
        api.post('/api/ai/draft', { threadContent, tone: 'formal', customDirectives }).catch(e => null),
        api.post('/api/ai/followup', { threadContent }).catch(e => ({ data: { followups: '• No suggested actions.' } })),
        api.post('/api/ai/classify', { threadContent }).catch(e => ({ data: { urgency: 'Medium', intent: 'Update' } }))
      ]);

      setSummary(summaryRes.data.summary);

      // Process bullet points from followups response
      const bulletPoints = followupRes.data.followups
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
      setFollowups(bulletPoints);

      setClassification(classifyRes.data);

      // Parse drafts if available
      if (draftRes && draftRes.data.drafts) {
        const rawText = draftRes.data.drafts;

        // Simple draft split parser for Direct vs Warmer formats from prompt
        const d1Match = rawText.match(/Draft 1[\s\S]*?(?=Draft 2|$)/i);
        const d1 = d1Match ? d1Match[0].replace(/Draft 1\s*\(direct\):?/i, '').trim() : rawText;

        setDrafts({
          formal: d1,
          casual: '',
          urgent: ''
        });

        setReplyText(d1);
      } else {
        // Fallback drafts
        setDrafts({
          formal: 'Dear Sender,\n\nI received your email and will follow up shortly.\n\nBest regards.',
          casual: 'Hi there,\n\nThanks for the email. Talk to you soon!',
          urgent: 'Hi,\n\nGot it. Will get back to you as soon as possible.'
        });
        setReplyText('Dear Sender,\n\nI received your email and will follow up shortly.\n\nBest regards.');
      }
    } catch (err) {
      console.error('AI Insights failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleToneChange = async (tone) => {
    setActiveTone(tone);
    localStorage.setItem('mailai_preferred_tone', tone);
    if (!activeThread) return;

    if (drafts && drafts[tone]) {
      setReplyText(drafts[tone]);
      return;
    }

    try {
      setDraftsLoading(prev => ({ ...prev, [tone]: true }));
      const content = activeThread.messages.map(m => `${m.sender}: ${m.content}`).join('\n\n');
      const res = await api.post('/api/ai/draft', { threadContent: content, tone });
      if (res && res.data.drafts) {
        const rawText = res.data.drafts;

        // Simple draft split parser for Direct vs Warmer formats
        const d1Match = rawText.match(/Draft 1[\s\S]*?(?=Draft 2|$)/i);
        const d1 = d1Match ? d1Match[0].replace(/Draft 1\s*\(direct\):?/i, '').trim() : rawText;

        setDrafts(prev => ({
          ...prev,
          [tone]: d1
        }));
        setReplyText(d1);
      }
    } catch (err) {
      console.error(`Failed to generate ${tone} draft:`, err);
    } finally {
      setDraftsLoading(prev => ({ ...prev, [tone]: false }));
    }
  };

  const handleSelectThread = (thread) => {
    setSelectedId(thread.id);
    fetchThreadDetails(thread.id);
  };

  const handleSync = async () => {
    setSyncing(true);
    await fetchThreads();
    setSyncing(false);
  };

  const handleExportSummary = () => {
    if (!summary) return;
    const element = document.createElement('a');
    const file = new Blob([`Subject: ${activeThread?.subject}\nFrom: ${activeThread?.from}\n\nAI THREAD SUMMARY:\n${summary}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `summary-${selectedId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDeleteThread = (threadId) => {
    if (confirm('Are you sure you want to delete this thread?')) {
      setThreads(prev => prev.filter(t => t.id !== threadId));
      setActiveThread(null);
      setSelectedId('');
    }
  };

  const toggleReadStatus = (threadId) => {
    setThreads(prev =>
      prev.map(t => (t.id === threadId ? { ...t, isRead: !t.isRead } : t))
    );
    if (activeThread && activeThread.id === threadId) {
      // toggle local active thread status visual indicator if any
    }
  };

  const toggleStar = (threadId) => {
    setStarredThreads(prev => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
  };

  const handleTemplateChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    setReplyText(val);
    e.target.value = '';
  };

  const handleTranslate = async (lang) => {
    if (!lang || !activeThread) return;
    try {
      setTranslating(true);
      const content = activeThread.messages.map(m => m.content).join('\n');
      const res = await api.post('/api/ai/translate', { text: content, language: lang });
      setTranslatedText(res.data.translatedText);
    } catch (err) {
      console.error(err);
    } finally {
      setTranslating(false);
    }
  };

  const addLabel = () => {
    if (!newLabelText.trim() || !selectedId) return;
    setCustomLabels(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newLabelText.trim()]
    }));
    setNewLabelText('');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const toggleTask = (taskIndex) => {
    setCompletedTasks(prev => ({
      ...prev,
      [selectedId + '-' + taskIndex]: !prev[selectedId + '-' + taskIndex]
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(replyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReply = async () => {
    if (!replyText || sending) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const pending = { threadId: selectedId, body: replyText, subject: activeThread?.subject };
      setOfflineQueue(prev => [...prev, pending]);
      showToast('Offline: reply saved to outbox queue!');
      setReplyText('');
      return;
    }
    try {
      setSending(true);
      await api.post(`/api/emails/${selectedId}/send`, { body: replyText });
      showToast('Reply sent successfully via Gmail API!');
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
      setReplyText('');
      // Reload details to show the new message
      fetchThreadDetails(selectedId);
    } catch (err) {
      console.error('Failed to send reply:', err);
      showToast('Error sending reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">MailAI</span>
            </div>
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search subject or sender..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-8 py-1.5 w-64 outline-none focus:border-white/10 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  <X size={10} />
                </button>
              )}
              {showHistory && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/5 rounded-xl shadow-xl z-50 p-2 space-y-1">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider px-2 py-1">Recent Searches</p>
                  {searchHistory.map((s, idx) => (
                    <button key={idx} onClick={() => setSearch(s)} className="w-full text-left text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors">{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShortcuts(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-gray-500 hover:text-white text-xs transition-colors" title="Keyboard Shortcuts"
            >
              <HelpCircle size={13} />
            </button>
            <span className="text-[10px] text-gray-600 hidden sm:inline">Last sync: {lastSyncTime}</span>
            <button
              onClick={handleSync}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Sync
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-red-400 text-xs transition-colors"
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Dashboard Grid ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Side: Threads List */}
        <div className="w-full md:w-[350px] lg:w-[400px] border-r border-white/5 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inbox Threads</h2>
            <div className="flex items-center gap-2">
              {offlineQueue.length > 0 && (
                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10 font-bold animate-pulse">
                  {offlineQueue.length} Outbox
                </span>
              )}
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                {threads.filter(t => !t.isRead).length} New
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-indigo-500" />
                Loading your inbox...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-xs text-red-400 flex flex-col items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No threads found in your inbox.
              </div>
            ) : (
              threads
                .filter(t => t.subject.toLowerCase().includes(search.toLowerCase()) || t.from.toLowerCase().includes(search.toLowerCase()))
                .filter(t => {
                  if (filterMode === 'unread') return !t.isRead;
                  if (filterMode === 'starred') return !!starredThreads[t.id];
                  return true;
                })
                .map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectThread(t)}
                    onDoubleClick={() => toggleReadStatus(t.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 relative hover:translate-x-0.5 border-b border-white/[0.02] ${selectedId === t.id ? 'bg-indigo-950/20 border-l-2 border-indigo-550 shadow-inner' : 'hover:bg-white/[0.015]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 truncate max-w-[220px]">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400 shrink-0">
                          {t.from[0]?.toUpperCase() || 'M'}
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          {starredThreads[t.id] && <Star size={9} className="fill-amber-400 text-amber-400 shrink-0" />}
                          <span className={`text-xs truncate ${!t.isRead ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {t.from.split(' <')[0]}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-600 font-medium shrink-0">{t.date}</span>
                    </div>
                    <h3 className={`text-xs truncate mb-1 ${!t.isRead ? 'text-white font-bold' : 'text-gray-300'}`}>
                      {t.subject}
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {t.snippet}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {(t.subject.toLowerCase().includes('pdf') || t.snippet.toLowerCase().includes('attach') || t.snippet.toLowerCase().includes('file')) && (
                        <Paperclip size={10} className="text-gray-500 shrink-0" title="Contains attachments" />
                      )}
                      <UrgencyBadge urgency={t.urgency} />
                      <span className="text-[9px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 font-semibold">
                        {t.intent}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Center: Thread Viewer & Reply */}
        <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden border-r border-white/5">
          {threadLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
              <RefreshCw size={18} className="animate-spin text-indigo-500" />
              <span>Loading messages...</span>
            </div>
          ) : activeThread ? (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => toggleStar(activeThread.id)} className="transition-colors">
                    <Star size={14} className={starredThreads[activeThread.id] ? "fill-amber-400 text-amber-400" : "text-gray-500 hover:text-amber-400"} />
                  </button>
                  <h1 className="text-sm font-bold text-white">{activeThread.subject}</h1>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{activeThread.from}</span>
                  {classification && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleReadStatus(activeThread.id)} title="Toggle Email Read/Unread Status" className="px-2 py-0.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] text-gray-400 hover:text-white transition-all">
                        {threads.find(x => x.id === activeThread.id)?.isRead ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      <UrgencyBadge urgency={classification.urgency} />
                      <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {classification.intent}
                      </span>
                      <div className="flex items-center gap-1">
                        <input type="text" placeholder="Add tag..." value={newLabelText} onChange={e=>setNewLabelText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') addLabel();}} className="bg-transparent border border-white/5 text-[9px] px-1 py-0.5 rounded outline-none w-16" />
                      </div>
                      <button onClick={() => handleDeleteThread(activeThread.id)} title="Move to Trash / Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Thread Messages & Reply Editor */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeThread.messages.map((msg, i) => (
                  <div key={i} className="bg-gray-900 border border-white/5 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-indigo-400">{msg.sender}</span>
                      <span className="text-[10px] text-gray-600">{msg.time}</span>
                    </div>
                    {msg.htmlContent ? (
                      <SafeHtmlViewer html={msg.htmlContent} id={msg.id} />
                    ) : (
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    )}
                  </div>
                ))}

                {/* Sent success confirmation feedback */}
                {sentSuccess && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 mt-4 animate-pulse">
                    <CheckCircle2 size={12} />
                    <span>Your response has been dispatched via Gmail OAuth API client.</span>
                  </div>
                )}

                {/* Reply Editor (rendered inline below email messages) */}
                <div className="p-4 border border-white/5 bg-gray-900/30 rounded-2xl space-y-3 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <div className="flex items-center gap-2 shrink-0">
                        <CornerUpLeft size={12} />
                        <CustomSelectDropdown
                          value=""
                          onChange={(val) => handleTemplateChange({ target: { value: val } })}
                          placeholder="Template"
                          options={[
                            { value: "Hi, scheduling a quick sync. Does next Tuesday afternoon work for you?", label: "Meeting Sync" },
                            { value: "Hi there, thanks for the update. I will review this and follow up shortly.", label: "Ack Update" },
                            { value: "Thanks for reaching out! I am currently out of office and will reply when I return.", label: "Out of Office" }
                          ]}
                          className="w-24 text-[10px]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Tone selectors */}
                      {['formal', 'casual', 'urgent', 'apologetic', 'assertive'].map(t => (
                        <button
                          key={t}
                          onClick={() => handleToneChange(t)}
                          disabled={draftsLoading[t]}
                          className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border transition-all flex items-center gap-1 ${activeTone === t
                            ? 'bg-indigo-600 border-indigo-500/50 text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                            } disabled:opacity-50`}
                        >
                          {t} {draftsLoading[t] && <RefreshCw size={8} className="animate-spin text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Draft your reply here..."
                    rows={Math.max(4, Math.min(10, Math.ceil(replyText.split('\n').length || 1)))}
                    className="w-full bg-gray-800/60 border border-white/5 text-white placeholder-gray-650 text-xs rounded-xl p-3 outline-none focus:border-white/10 transition-all resize-none"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-gray-600">
                      <span>Co-pilot Powered by Google Gemini AI</span>
                      <span className={`${replyText.length > 800 ? 'text-amber-550 font-bold' : ''}`}>
                        {replyText.length} chars
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        type="button"
                        className="px-3 py-1.5 bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        {copied ? <Check size={11} className="text-emerald-400" /> : <Clipboard size={11} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => setReplyText('')}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={sending || !replyText}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-655 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50"
                      >
                        {sending ? 'Sending...' : 'Send'} <Send size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Mail size={24} />
              <span>Select an email thread to view details</span>
            </div>
          )}
        </div>

        {/* Right Side: AI Panel */}
        <div className="w-[300px] bg-gray-950 hidden lg:flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-white/5 flex items-center gap-1.5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Insights</h2>
          </div>

          <div className="p-4 space-y-5">
            {aiLoading ? (
              <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-indigo-500" />
                Analyzing thread with Gemini...
              </div>
            ) : (
              <>
                {/* Urgency Alert banner */}
                {classification && (classification.urgency === 'Critical' || classification.urgency === 'High') && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-950/20 border border-red-500/10 rounded-xl">
                    <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-300 text-[11px] font-bold">Action Required Immediately</p>
                      <p className="text-red-400/70 text-[10px] mt-0.5">Gemini classified this thread as priority.</p>
                    </div>
                  </div>
                )}

                {/* Summarizer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Thread Summary
                    </h3>
                    {summary && (
                      <div className="flex items-center gap-2">
                      <CustomSelectDropdown
                        value={summaryLength}
                        onChange={(val) => setSummaryLength(val)}
                        placeholder="Med"
                        options={[
                          { value: "short", label: "Short" },
                          { value: "medium", label: "Med" },
                          { value: "long", label: "Long" }
                        ]}
                        className="w-16"
                      />
                      <button onClick={handleExportSummary} title="Export to TXT" className="text-gray-500 hover:text-white transition-colors">
                        <Download size={11} />
                      </button>
                    </div>
                    )}
                  </div>
                  <div className="bg-gray-900 border border-white/5 rounded-xl p-3.5 text-xs text-gray-400 leading-relaxed">
                    {summary || 'No summary generated.'}
                  </div>
                </div>

                {/* Sender Profile Stats */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Sender Profile
                  </h3>
                  <div className="bg-gray-900 border border-white/5 rounded-xl p-3 text-[11px] text-gray-500 space-y-1.5">
                    <div className="flex justify-between"><span>Sender Rank</span><span className="text-white font-bold">Frequent</span></div>
                    <div className="flex justify-between"><span>Previous Threads</span><span className="text-white">8 interactions</span></div>
                    <div className="flex justify-between"><span>Avg Response Time</span><span className="text-white">2.5 hours</span></div>
                  </div>
                </div>

                {/* Suggested actions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Suggested Tasks
                  </h3>
                  <div className="bg-gray-900 border border-white/5 rounded-xl p-3.5 space-y-2.5 text-xs text-gray-400">
                    {followups.length > 0 ? (
                      followups.map((act, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{act}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-600">No suggestions.</div>
                    )}
                  </div>
                </div>
                {/* Custom instructions directives */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Custom Directives
                  </h3>
                  <input
                    type="text"
                    placeholder="e.g. Keep summaries brief..."
                    value={customDirectives}
                    onChange={(e) => setCustomDirectives(e.target.value)}
                    className="w-full bg-gray-900 border border-white/5 text-[11px] text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-white/10 transition-all"
                  />
                </div>

                {/* Translation tool */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Globe size={11} className="text-indigo-400" /> AI Translation</span>
                    <CustomSelectDropdown
                      value=""
                      onChange={(val) => handleTranslate(val)}
                      placeholder="Select Lang"
                      options={[
                        { value: "Spanish", label: "Spanish" },
                        { value: "French", label: "French" },
                        { value: "Japanese", label: "Japanese" },
                        { value: "Filipino", label: "Filipino" }
                      ]}
                      className="w-24 font-normal"
                    />
                  </h3>
                  {translating ? (
                    <div className="text-[10px] text-gray-600">Translating...</div>
                  ) : translatedText ? (
                    <div className="bg-gray-900 border border-indigo-500/10 rounded-xl p-3 text-[11px] text-gray-400 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {translatedText}
                    </div>
                  ) : null}
                </div>

                {/* Tone selector preview drafts */}
                {drafts && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Insert Draft
                    </h3>
                    <div className="space-y-2">
                      {['formal', 'casual', 'urgent'].map(t => (
                        <button
                          key={t}
                          onClick={() => handleToneChange(t)}
                          disabled={draftsLoading[t]}
                          className="w-full text-left bg-gray-900 hover:bg-gray-850 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all space-y-1.5 group flex flex-col disabled:opacity-75"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                              {t} tone {draftsLoading[t] && <RefreshCw size={8} className="animate-spin text-indigo-455" />}
                            </span>
                            <ChevronRight size={10} className="text-gray-700" />
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                            {drafts[t] || 'Click to generate draft...'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/5 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><HelpCircle size={14} className="text-indigo-400" /> Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-xs text-gray-500 hover:text-white">&times; Close</button>
            </div>
            <div className="space-y-2.5 text-xs text-gray-450">
              <div className="flex justify-between"><span>Navigate Up</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">ArrowUp / J</kbd></div>
              <div className="flex justify-between"><span>Navigate Down</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">ArrowDown / K</kbd></div>
              <div className="flex justify-between"><span>Sync Inbox</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">S</kbd></div>
              <div className="flex justify-between"><span>Focus Reply Box</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">R</kbd></div>
              <div className="flex justify-between"><span>Clear Reply text</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">Esc</kbd></div>
            </div>
          </div>
        </div>
      )}
      {/* Premium Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 border border-indigo-500 text-white rounded-xl px-4 py-2.5 text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={12} className="text-emerald-300" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
