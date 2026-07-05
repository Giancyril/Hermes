"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Mail, Send, ChevronRight, LogOut, Search, RefreshCw,
  AlertCircle, Star, ArrowRight, CornerUpLeft, CheckCircle2, MessageSquare, Trash2
} from 'lucide-react';
import UrgencyBadge from '@/components/UrgencyBadge';
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
  const [activeTone, setActiveTone] = useState('formal');
  const [replyText, setReplyText] = useState('');

  // Loaders
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftsLoading, setDraftsLoading] = useState({ formal: false, casual: false, urgent: false });

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
        api.post('/api/ai/summarize', { threadContent }).catch(e => ({ data: { summary: 'Summary unavailable.' } })),
        api.post('/api/ai/draft', { threadContent, tone: 'formal' }).catch(e => null),
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

  const handleSendReply = async () => {
    if (!replyText || sending) return;
    try {
      setSending(true);
      await api.post(`/api/emails/${selectedId}/send`, { body: replyText });
      alert('Reply sent successfully via Gmail API!');
      setReplyText('');
      // Reload details to show the new message
      fetchThreadDetails(selectedId);
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Error sending reply.');
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
                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-4 py-1.5 w-64 outline-none focus:border-white/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
              {threads.filter(t => !t.isRead).length} New
            </span>
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
                .map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectThread(t)}
                    className={`p-4 cursor-pointer transition-all duration-150 relative ${selectedId === t.id ? 'bg-white/5 border-l-2 border-indigo-500' : 'hover:bg-white/[0.02]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs truncate max-w-[200px] ${!t.isRead ? 'text-white font-bold' : 'text-gray-400'}`}>
                        {t.from.split(' <')[0]}
                      </span>
                      <span className="text-[10px] text-gray-600 font-medium shrink-0">{t.date}</span>
                    </div>
                    <h3 className={`text-xs truncate mb-1 ${!t.isRead ? 'text-white font-bold' : 'text-gray-300'}`}>
                      {t.subject}
                    </h3>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {t.snippet}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
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
                <h1 className="text-sm font-bold text-white mb-1">{activeThread.subject}</h1>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{activeThread.from}</span>
                  {classification && (
                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={classification.urgency} />
                      <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {classification.intent}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thread Messages */}
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
              </div>

              {/* Reply Editor */}
              <div className="p-4 border-t border-white/5 space-y-3 bg-gray-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <CornerUpLeft size={12} /> Reply to {activeThread.from.split(' <')[0]}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Tone selectors */}
                    {['formal', 'casual', 'urgent'].map(t => (
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
                  className="w-full bg-gray-800/60 border border-white/5 text-white placeholder-gray-650 text-xs rounded-xl p-3 h-28 outline-none focus:border-white/10 transition-all resize-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">
                    Co-pilot Powered by Google Gemini AI
                  </span>
                  <div className="flex items-center gap-2">
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
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Thread Summary
                  </h3>
                  <div className="bg-gray-900 border border-white/5 rounded-xl p-3.5 text-xs text-gray-400 leading-relaxed">
                    {summary || 'No summary generated.'}
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
    </div>
  );
}
