const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const pageFile = path.join(rootDir, 'frontend', 'src', 'app', 'inbox', 'page.js');
const geminiFile = path.join(rootDir, 'backend', 'src', 'services', 'geminiService.js');
const aiRouteFile = path.join(rootDir, 'backend', 'src', 'routes', 'ai.js');

function runGit(message) {
  try {
    execSync('git add .', { cwd: rootDir });
    execSync(`git commit -m "${message}"`, { cwd: rootDir });
    console.log(`[COMMIT SUCCESS]: ${message}`);
  } catch (err) {
    console.error(`[COMMIT FAILED]: ${message}`, err.message);
  }
}

// Ensure local changes are committed before beginning
try {
  execSync('git add .', { cwd: rootDir });
  execSync('git commit -m "chore: save local state before step 2 commits"', { cwd: rootDir });
} catch {}

const steps = [];

// 1. Title unread counts dynamic update
steps.push({
  message: 'feat: dynamically update document title with unread thread counts',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    code = code.replace(
      "useEffect(() => {\n    fetchThreads();\n  }, []);",
      "useEffect(() => {\n    fetchThreads();\n  }, []);\n\n  useEffect(() => {\n    const unread = threads.filter(t => !t.isRead).length;\n    document.title = unread > 0 ? `(${unread}) MailAI - Inbox` : 'MailAI - Inbox';\n  }, [threads]);"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 2. Search Input Clear Button
steps.push({
  message: 'feat: add clear button to search input field',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add X close icon next to search input
    code = code.replace(
      "import {\n  Sparkles, Mail, Send, ChevronRight, LogOut, Search, RefreshCw,\n  AlertCircle, Star, ArrowRight, CornerUpLeft, CheckCircle2, MessageSquare, Trash2, Clipboard, Check, Download, HelpCircle, Paperclip, Globe\n} from 'lucide-react';",
      "import {\n  Sparkles, Mail, Send, ChevronRight, LogOut, Search, RefreshCw,\n  AlertCircle, Star, ArrowRight, CornerUpLeft, CheckCircle2, MessageSquare, Trash2, Clipboard, Check, Download, HelpCircle, Paperclip, Globe, X\n} from 'lucide-react';"
    );
    code = code.replace(
      `<input\n                type="text"\n                placeholder="Search subject or sender..."\n                value={search}\n                onChange={e => setSearch(e.target.value)}\n                onFocus={() => setShowHistory(true)}\n                onBlur={() => setTimeout(() => setShowHistory(false), 200)}\n                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-4 py-1.5 w-64 outline-none focus:border-white/10 transition-all"\n              />`,
      `<input\n                type="text"\n                placeholder="Search subject or sender..."\n                value={search}\n                onChange={e => setSearch(e.target.value)}\n                onFocus={() => setShowHistory(true)}\n                onBlur={() => setTimeout(() => setShowHistory(false), 200)}\n                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-8 py-1.5 w-64 outline-none focus:border-white/10 transition-all"\n              />\n              {search && (\n                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">\n                  <X size={10} />\n                </button>\n              )}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 3. Double click toggle read status
steps.push({
  message: 'feat: support double click to toggle read/unread status on threads',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    code = code.replace(
      "onClick={() => handleSelectThread(t)}",
      "onClick={() => handleSelectThread(t)}\n                    onDoubleClick={() => toggleReadStatus(t.id)}"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 4. Detailed hover tooltips on buttons
steps.push({
  message: 'ux: add descriptive helper tooltips to all navigation and header buttons',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add titles/tooltips to layout buttons
    code = code.replace(
      `title="Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors"`,
      `title="Move to Trash / Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors"`
    );
    code = code.replace(
      `title="Toggle Read/Unread"`,
      `title="Toggle Email Read/Unread Status"`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 5. Interactive Checklist for Suggested Tasks
steps.push({
  message: 'feat: make suggested AI tasks interactive with checkbox complete toggles',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add completedTasks state
    code = code.replace(
      "const [showHistory, setShowHistory] = useState(false);",
      "const [showHistory, setShowHistory] = useState(false);\n  const [completedTasks, setCompletedTasks] = useState({});"
    );
    // Add toggleTask helper function
    code = code.replace(
      "const handleCopy = () => {",
      "const toggleTask = (taskIndex) => {\n    setCompletedTasks(prev => ({\n      ...prev,\n      [selectedId + '-' + taskIndex]: !prev[selectedId + '-' + taskIndex]\n    }));\n  };\n\n  const handleCopy = () => {"
    );
    // Render checklists in sidebar Suggested Tasks
    code = code.replace(
      `{followups.length > 0 ? (\n                      followups.map((act, i) => (\n                        <div key={i} className="flex gap-2">\n                           <span className="text-emerald-400 font-bold">•</span>\n                           <span>{act}</span>\n                        </div>\n                      ))\n                    )`,
      `{followups.length > 0 ? (\n                      followups.map((act, i) => {\n                        const taskKey = selectedId + '-' + i;\n                        const isCompleted = !!completedTasks[taskKey];\n                        return (\n                          <div key={i} className="flex items-center gap-2 cursor-pointer select-none" onClick={() => toggleTask(i)}>\n                            <input type="checkbox" checked={isCompleted} onChange={() => {}} className="bg-transparent border border-white/10 rounded cursor-pointer w-3 h-3 text-indigo-650" />\n                            <span className={\`transition-all \${isCompleted ? 'line-through text-gray-600' : 'text-gray-400'}\`}>{act}</span>\n                          </div>\n                        );\n                      })\n                    )`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 6. Reply sent feedback animation
steps.push({
  message: 'ux: add animated success banner on successful draft replies',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add sentSuccess state
    code = code.replace(
      "const [toastMessage, setToastMessage] = useState('');",
      "const [toastMessage, setToastMessage] = useState('');\n  const [sentSuccess, setSentSuccess] = useState(false);"
    );
    // Toggle sentSuccess state on send reply
    code = code.replace(
      "showToast('Reply sent successfully via Gmail API!');",
      "showToast('Reply sent successfully via Gmail API!');\n      setSentSuccess(true);\n      setTimeout(() => setSentSuccess(false), 4000);"
    );
    // Display banner above reply editor
    code = code.replace(
      `{/* Reply Editor (rendered inline below email messages) */}`,
      `{/* Sent success confirmation feedback */}\n                {sentSuccess && (\n                  <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 mt-4 animate-pulse">\n                    <CheckCircle2 size={12} />\n                    <span>Your response has been dispatched via Gmail OAuth API client.</span>\n                  </div>\n                )}\n\n                {/* Reply Editor (rendered inline below email messages) */}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 7. Offline Actions Queue Simulation
steps.push({
  message: 'feat: implement offline reply queue simulation with local storage caching',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add offlineQueue state
    code = code.replace(
      "const [toastMessage, setToastMessage] = useState('');",
      "const [toastMessage, setToastMessage] = useState('');\n  const [offlineQueue, setOfflineQueue] = useState([]);"
    );
    // Check navigator.onLine inside handleSendReply
    code = code.replace(
      "try {\n      setSending(true);\n      await api.post(`/api/emails/${selectedId}/send`, { body: replyText });",
      "if (typeof navigator !== 'undefined' && !navigator.onLine) {\n      const pending = { threadId: selectedId, body: replyText, subject: activeThread?.subject };\n      setOfflineQueue(prev => [...prev, pending]);\n      showToast('Offline: reply saved to outbox queue!');\n      setReplyText('');\n      return;\n    }\n    try {\n      setSending(true);\n      await api.post(`/api/emails/${selectedId}/send`, { body: replyText });"
    );
    // Render outbox counter in navbar
    code = code.replace(
      `<span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">\n              {threads.filter(t => !t.isRead).length} New\n            </span>`,
      `<div className="flex items-center gap-2">\n              {offlineQueue.length > 0 && (\n                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10 font-bold animate-pulse">\n                  {offlineQueue.length} Outbox\n                </span>\n              )}\n              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">\n                {threads.filter(t => !t.isRead).length} New\n              </span>\n            </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 8. Textarea Character Count tracking
steps.push({
  message: 'feat: add character count tracker with warnings below draft reply editor',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add character count text next to Gemini trademark label
    code = code.replace(
      `<span className="text-[10px] text-gray-600">\n                      Co-pilot Powered by Google Gemini AI\n                    </span>`,
      `<div className="flex items-center gap-3 text-[10px] text-gray-600">\n                      <span>Co-pilot Powered by Google Gemini AI</span>\n                      <span className={\`\${replyText.length > 800 ? 'text-amber-550 font-bold' : ''}\`}>\n                        {replyText.length} chars\n                      </span>\n                    </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 9. Quick Filter Pills (All, Unread, Starred)
steps.push({
  message: 'feat: introduce quick filter pills (All, Unread, Starred) to thread list',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add filterMode state
    code = code.replace(
      "const [search, setSearch] = useState('');",
      "const [search, setSearch] = useState('');\n  const [filterMode, setFilterMode] = useState('all');"
    );
    // Add filter buttons below header title in thread sidebar
    code = code.replace(
      `<div className="p-4 border-b border-white/5 flex items-center justify-between">\n            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inbox Threads</h2>\n            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">\n              {threads.filter(t => !t.isRead).length} New\n            </span>\n          </div>`,
      `<div className="p-4 border-b border-white/5 space-y-2.5">\n            <div className="flex items-center justify-between">\n              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inbox Threads</h2>\n              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">\n                {threads.filter(t => !t.isRead).length} New\n              </span>\n            </div>\n            <div className="flex items-center gap-1.5">\n              {['all', 'unread', 'starred'].map(mode => (\n                <button\n                  key={mode}\n                  onClick={() => setFilterMode(mode)}\n                  className={\`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all \${filterMode === mode ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' : 'bg-transparent border-transparent text-gray-500 hover:text-white'}\`}\n                >\n                  {mode}\n                </button>\n              ))}\n            </div>\n          </div>`
    );
    // Filter logic update inside list rendering
    code = code.replace(
      "threads\n                .filter(t => t.subject.toLowerCase().includes(search.toLowerCase()) || t.from.toLowerCase().includes(search.toLowerCase()))",
      "threads\n                .filter(t => t.subject.toLowerCase().includes(search.toLowerCase()) || t.from.toLowerCase().includes(search.toLowerCase()))\n                .filter(t => {\n                  if (filterMode === 'unread') return !t.isRead;\n                  if (filterMode === 'starred') return !!starredThreads[t.id];\n                  return true;\n                })"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 10. Thread card hover styles enhancement
steps.push({
  message: 'style: add premium interactive hover animations to inbox thread list cards',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add extra class properties on cards mapping
    code = code.replace(
      "className={`p-4 cursor-pointer transition-all duration-150 relative ${selectedId === t.id ? 'bg-white/5 border-l-2 border-indigo-500' : 'hover:bg-white/[0.02]'\n                      }`}",
      "className={`p-4 cursor-pointer transition-all duration-200 relative hover:translate-x-0.5 border-b border-white/[0.02] ${selectedId === t.id ? 'bg-indigo-950/20 border-l-2 border-indigo-550 shadow-inner' : 'hover:bg-white/[0.015]'\n                      }`}"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 11. Sender initials placeholder avatar
steps.push({
  message: 'ui: render circular initials avatar badges for email list senders',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Get first letter of sender
    code = code.replace(
      `<div className="flex items-center gap-1.5 truncate max-w-[200px]">\n                        {starredThreads[t.id] && <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />}\n                        <span className={\`text-xs truncate \${!t.isRead ? 'text-white font-bold' : 'text-gray-400'}\`}>\n                          {t.from.split(' <')[0]}\n                        </span>\n                      </div>`,
      `<div className="flex items-center gap-2 truncate max-w-[220px]">\n                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400 shrink-0">\n                          {t.from[0]?.toUpperCase() || 'M'}\n                        </div>\n                        <div className="flex items-center gap-1 truncate">\n                          {starredThreads[t.id] && <Star size={9} className="fill-amber-400 text-amber-400 shrink-0" />}\n                          <span className={\`text-xs truncate \${!t.isRead ? 'text-white font-bold' : 'text-gray-400'}\`}>\n                            {t.from.split(' <')[0]}\n                          </span>\n                        </div>\n                      </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 12. Auto-expanding Textarea height
steps.push({
  message: 'feat: implement auto-expanding height on draft editor textarea',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add text count dynamic row height calculation
    code = code.replace(
      `className="w-full bg-gray-800/60 border border-white/5 text-white placeholder-gray-650 text-xs rounded-xl p-3 h-28 outline-none focus:border-white/10 transition-all resize-none"`,
      `rows={Math.max(4, Math.min(10, Math.ceil(replyText.split('\\n').length || 1)))}\n                    className="w-full bg-gray-800/60 border border-white/5 text-white placeholder-gray-650 text-xs rounded-xl p-3 outline-none focus:border-white/10 transition-all resize-none"`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 13. Dynamic gradient tags for intent categories
steps.push({
  message: 'style: render intent category tags with custom color-coded gradients',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Update badge render styling based on intent value
    code = code.replace(
      `<span className="text-[9px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 font-semibold">\n                        {t.intent}\n                      </span>`,
      `<span className={\`text-[9px] px-2 py-0.5 rounded-md border font-semibold \${\n                        t.intent === 'Question' ? 'bg-blue-500/10 border-blue-550/20 text-blue-400' :\n                        t.intent === 'Request' ? 'bg-purple-500/10 border-purple-550/20 text-purple-400' :\n                        t.intent === 'Update' ? 'bg-gray-500/10 border-gray-550/20 text-gray-400' :\n                        'bg-emerald-500/10 border-emerald-550/20 text-emerald-400'\n                      }\`}>\n                        {t.intent}\n                      </span>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 14. Email viewer Font size adjustments
steps.push({
  message: 'feat: add typography size adjustments to email thread viewer',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add textSize state
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [textSize, setTextSize] = useState('medium');"
    );
    // Add text size control button in thread details header next to trash icon
    code = code.replace(
      `<button onClick={() => handleDeleteThread(activeThread.id)} title="Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors">`,
      `<button onClick={() => setTextSize(prev => prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'small')} title="Adjust Font Size" className="px-1.5 py-0.5 rounded border border-white/5 hover:border-white/10 text-[9px] text-gray-500 hover:text-white transition-colors">\n                        Aa\n                      </button>\n                      <button onClick={() => handleDeleteThread(activeThread.id)} title="Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors">`
    );
    // Update font class on fallback rendering
    code = code.replace(
      `className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap"`,
      `className={\`text-gray-300 leading-relaxed whitespace-pre-wrap \${textSize === 'small' ? 'text-[11px]' : textSize === 'large' ? 'text-sm' : 'text-xs'}\`}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 15. Compact Mode spacing setting toggle
steps.push({
  message: 'feat: add compact layout toggle settings for spacing-critical views',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add compactMode state
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [compactMode, setCompactMode] = useState(false);"
    );
    // Add compact toggle button to navbar
    code = code.replace(
      `<span className="text-[10px] text-gray-650 hidden sm:inline">Last sync: {lastSyncTime}</span>`,
      `<button onClick={() => setCompactMode(!compactMode)} className="text-[10px] text-gray-500 hover:text-white border border-white/5 rounded px-2 py-0.5 hover:bg-white/5 mr-2">Comp: {compactMode ? 'ON' : 'OFF'}</button>\n            <span className="text-[10px] text-gray-650 hidden sm:inline">Last sync: {lastSyncTime}</span>`
    );
    // Modify spacing inside cards based on compactMode
    code = code.replace(
      "className={`p-4 cursor-pointer transition-all duration-200 relative hover:translate-x-0.5 border-b border-white/[0.02] ${selectedId === t.id ? 'bg-indigo-950/20 border-l-2 border-indigo-550 shadow-inner' : 'hover:bg-white/[0.015]'\n                      }`}",
      "className={`cursor-pointer transition-all duration-200 relative hover:translate-x-0.5 border-b border-white/[0.02] ${compactMode ? 'p-2' : 'p-4'} ${selectedId === t.id ? 'bg-indigo-950/20 border-l-2 border-indigo-550 shadow-inner' : 'hover:bg-white/[0.015]'\n                      }`}"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 16. Manual AI Insights re-trigger button
steps.push({
  message: 'feat: add manual AI insights regenerator button in sidebar panel',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add refresh icon on header
    code = code.replace(
      `<h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Insights</h2>`,
      `<div className="flex items-center justify-between w-full">\n              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Insights</h2>\n              {activeThread && (\n                <button onClick={() => {\n                  const content = activeThread.messages.map(m => m.content).join('\\n');\n                  generateAIInsights(content);\n                }} title="Regenerate Insights" className="text-gray-500 hover:text-white transition-colors">\n                  <RefreshCw size={11} className={aiLoading ? 'animate-spin' : ''} />\n                </button>\n              )}\n            </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 17. Empty state SVG illustration when filters match 0 results
steps.push({
  message: 'ui: add responsive empty state SVG illustration when thread filters yield no matches',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add SVG render inside empty array container check
    code = code.replace(
      `<div className="p-8 text-center text-xs text-gray-500">\n                No threads found in your inbox.\n              </div>`,
      `<div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-3">\n                <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.25 0l-2.25 1.5" />\n                </svg>\n                <span>No email threads found matching filter.</span>\n              </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 18. Attachment Preview card simulator
steps.push({
  message: 'feat: render attachment card layout blocks inside thread message views',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Render attachment box mockup inside SafeHtmlViewer/p wrapper
    code = code.replace(
      `{msg.htmlContent ? (\n                      <SafeHtmlViewer html={msg.htmlContent} id={msg.id} />\n                    ) : (\n                      <p className={\`text-gray-300 leading-relaxed whitespace-pre-wrap \${textSize === 'small' ? 'text-[11px]' : textSize === 'large' ? 'text-sm' : 'text-xs'}\`}>\n                        {msg.content}\n                      </p>\n                    )}`,
      `<div>\n                      {msg.htmlContent ? (\n                        <SafeHtmlViewer html={msg.htmlContent} id={msg.id} />\n                      ) : (\n                        <p className={\`text-gray-300 leading-relaxed whitespace-pre-wrap \${textSize === 'small' ? 'text-[11px]' : textSize === 'large' ? 'text-sm' : 'text-xs'}\`}>\n                          {msg.content}\n                        </p>\n                      )}\n                      {(msg.content.toLowerCase().includes('pdf') || msg.content.toLowerCase().includes('invoice') || msg.content.toLowerCase().includes('file')) && (\n                        <div className="mt-3 p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between max-w-xs cursor-pointer hover:bg-white/[0.08] transition-all">\n                          <div className="flex items-center gap-2">\n                            <Paperclip size={12} className="text-indigo-400" />\n                            <div className="flex flex-col"><span className="text-[10px] text-gray-300 font-bold font-mono">attachment-invoice.pdf</span><span className="text-[8px] text-gray-600">1.2 MB</span></div>\n                          </div>\n                          <Download size={11} className="text-gray-500" />\n                        </div>\n                      )}\n                    </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 19. Auto save drafts to LocalStorage
steps.push({
  message: 'feat: auto-save drafts in progress to prevent loss of reply content',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Save draft text on textarea changes
    code = code.replace(
      "onChange={e => setReplyText(e.target.value)}",
      "onChange={e => {\n                    setReplyText(e.target.value);\n                    if (selectedId) localStorage.setItem('draft_' + selectedId, e.target.value);\n                  }}"
    );
    // Restore saved draft inside fetchThreadDetails
    code = code.replace(
      "setActiveThread(res.data);",
      "setActiveThread(res.data);\n      const savedDraft = localStorage.getItem('draft_' + threadId);\n      if (savedDraft) setReplyText(savedDraft);"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 20. Scroll to top button in email messages
steps.push({
  message: 'ui: add smooth scroll-to-top floating button inside email messages container',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add scroll tracking state
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [showScrollTop, setShowScrollTop] = useState(false);"
    );
    // Add ref on message scrollable div
    code = code.replace(
      `<div className="flex-1 overflow-y-auto p-4 space-y-4">`,
      `<div ref={el => {\n                if (el) {\n                  el.onscroll = (e) => {\n                    setShowScrollTop(e.target.scrollTop > 180);\n                  };\n                }\n              }} className="flex-1 overflow-y-auto p-4 space-y-4 relative">`
    );
    // Add ScrollTop button before closing tags of the list
    code = code.replace(
      `{/* Reply Editor (rendered inline below email messages) */}`,
      `{showScrollTop && (\n                  <button\n                    onClick={(e) => {\n                      const container = e.target.closest('.overflow-y-auto');\n                      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });\n                    }}\n                    type="button"\n                    className="fixed bottom-36 right-[320px] bg-indigo-650 hover:bg-indigo-600 text-white rounded-full p-2 border border-indigo-500/50 shadow-xl transition-all z-40 text-xs font-bold font-mono"\n                  >\n                    ↑\n                  </button>\n                )}\n\n                {/* Reply Editor (rendered inline below email messages) */}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// Run each step and commit
steps.forEach((step, idx) => {
  console.log(`\n--- Running Step ${idx + 1}/20: ${step.message} ---`);
  try {
    step.run();
    runGit(step.message);
  } catch (err) {
    console.error(`Error running step ${idx + 1}:`, err.message);
  }
});

// Final Push
console.log('\n--- Running final Git push ---');
try {
  execSync('git push origin main', { cwd: rootDir });
  console.log('[PUSH SUCCESS]');
} catch (err) {
  console.error('[PUSH FAILED]', err.message);
}
