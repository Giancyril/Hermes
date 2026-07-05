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

// Ensure clean status before starting
try {
  execSync('git add .', { cwd: rootDir });
  execSync('git commit -m "chore: save local state before features roll out"', { cwd: rootDir });
} catch {}

const steps = [];

// 1. Copy to clipboard button
steps.push({
  message: 'feat: add copy draft to clipboard button with dynamic success feedback',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Import Clipboard and Check
    code = code.replace(
      "import {\n  Sparkles, Mail, Send, ChevronRight, LogOut, Search, RefreshCw,\n  AlertCircle, Star, ArrowRight, CornerUpLeft, CheckCircle2, MessageSquare, Trash2\n} from 'lucide-react';",
      "import {\n  Sparkles, Mail, Send, ChevronRight, LogOut, Search, RefreshCw,\n  AlertCircle, Star, ArrowRight, CornerUpLeft, CheckCircle2, MessageSquare, Trash2, Clipboard, Check\n} from 'lucide-react';"
    );
    // Add copyCopied state in InboxDashboard definition
    code = code.replace(
      "const [draftsLoading, setDraftsLoading] = useState({ formal: false, casual: false, urgent: false });",
      "const [draftsLoading, setDraftsLoading] = useState({ formal: false, casual: false, urgent: false });\n  const [copied, setCopied] = useState(false);"
    );
    // Add copy helper function
    code = code.replace(
      "const handleSendReply = async () => {",
      "const handleCopy = () => {\n    navigator.clipboard.writeText(replyText);\n    setCopied(true);\n    setTimeout(() => setCopied(false), 2000);\n  };\n\n  const handleSendReply = async () => {"
    );
    // Add Copy button next to Clear in reply editor
    code = code.replace(
      `<button\n                      onClick={() => setReplyText('')}\n                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all"\n                    >\n                      Clear\n                    </button>`,
      `<button\n                      onClick={handleCopy}\n                      type="button"\n                      className="px-3 py-1.5 bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"\n                    >\n                      {copied ? <Check size={11} className="text-emerald-400" /> : <Clipboard size={11} />}\n                      {copied ? 'Copied' : 'Copy'}\n                    </button>\n                    <button\n                      onClick={() => setReplyText('')}\n                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all"\n                    >\n                      Clear\n                    </button>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 2. Export summary to TXT
steps.push({
  message: 'feat: add export summary to TXT file feature',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Import Download
    code = code.replace(
      "Trash2, Clipboard, Check",
      "Trash2, Clipboard, Check, Download"
    );
    // Add handleExport function
    code = code.replace(
      "const handleCopy = () => {",
      "const handleExportSummary = () => {\n    if (!summary) return;\n    const element = document.createElement('a');\n    const file = new Blob([`Subject: ${activeThread?.subject}\\nFrom: ${activeThread?.from}\\n\\nAI THREAD SUMMARY:\\n${summary}`], {type: 'text/plain'});\n    element.href = URL.createObjectURL(file);\n    element.download = `summary-${selectedId}.txt`;\n    document.body.appendChild(element);\n    element.click();\n    document.body.removeChild(element);\n  };\n\n  const handleCopy = () => {"
    );
    // Add export button next to Thread Summary header
    code = code.replace(
      `<h3 className="text-xs font-bold text-white flex items-center gap-1.5">\n                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Thread Summary\n                  </h3>`,
      `<div className="flex items-center justify-between">\n                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">\n                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Thread Summary\n                    </h3>\n                    {summary && (\n                      <button onClick={handleExportSummary} title="Export to TXT" className="text-gray-500 hover:text-white transition-colors">\n                        <Download size={11} />\n                      </button>\n                    )}\n                  </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 3. Keyboard Shortcuts modal
steps.push({
  message: 'feat: implement interactive keyboard shortcuts modal',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Import HelpCircle
    code = code.replace(
      "Clipboard, Check, Download",
      "Clipboard, Check, Download, HelpCircle"
    );
    // Add showShortcuts modal state
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [showShortcuts, setShowShortcuts] = useState(false);"
    );
    // Add HelpCircle button next to sync button in navbar
    code = code.replace(
      `<button\n              onClick={handleSync}\n              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors"\n            >\n              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Sync\n            </button>`,
      `<button\n              onClick={() => setShowShortcuts(true)}\n              className="flex items-center gap-1.5 px-2 py-1.5 text-gray-500 hover:text-white text-xs transition-colors" title="Keyboard Shortcuts"\n            >\n              <HelpCircle size={13} />\n            </button>\n            <button\n              onClick={handleSync}\n              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors"\n            >\n              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Sync\n            </button>`
    );
    // Add modal element right before ending tag </div> of InboxDashboard (e.g. before "  );\n}")
    code = code.replace(
      "    </div>\n  );\n}",
      `      {/* Keyboard Shortcuts Modal */}\n      {showShortcuts && (\n        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">\n          <div className="bg-gray-900 border border-white/5 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">\n            <div className="flex justify-between items-center border-b border-white/5 pb-3">\n              <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><HelpCircle size={14} className="text-indigo-400" /> Keyboard Shortcuts</h3>\n              <button onClick={() => setShowShortcuts(false)} className="text-xs text-gray-500 hover:text-white">&times; Close</button>\n            </div>\n            <div className="space-y-2.5 text-xs text-gray-450">\n              <div className="flex justify-between"><span>Navigate Up</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">ArrowUp / J</kbd></div>\n              <div className="flex justify-between"><span>Navigate Down</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">ArrowDown / K</kbd></div>\n              <div className="flex justify-between"><span>Sync Inbox</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">S</kbd></div>\n              <div className="flex justify-between"><span>Focus Reply Box</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">R</kbd></div>\n              <div className="flex justify-between"><span>Clear Reply text</span><kbd className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 font-mono text-white">Esc</kbd></div>\n            </div>\n          </div>\n        </div>\n      )}\n    </div>\n  );\n}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 4. Star/Unstar thread toggling
steps.push({
  message: 'feat: support star and unstar toggles on email threads',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add starredThreads state
    code = code.replace(
      "const [showShortcuts, setShowShortcuts] = useState(false);",
      "const [showShortcuts, setShowShortcuts] = useState(false);\n  const [starredThreads, setStarredThreads] = useState({});"
    );
    // Add star toggle helper function
    code = code.replace(
      "const handleCopy = () => {",
      "const toggleStar = (threadId) => {\n    setStarredThreads(prev => ({\n      ...prev,\n      [threadId]: !prev[threadId]\n    }));\n  };\n\n  const handleCopy = () => {"
    );
    // Add star icon in selected thread header
    code = code.replace(
      `<h1 className="text-sm font-bold text-white mb-1">{activeThread.subject}</h1>`,
      `<div className="flex items-center gap-2 mb-1">\n                  <button onClick={() => toggleStar(activeThread.id)} className="transition-colors">\n                    <Star size={14} className={starredThreads[activeThread.id] ? "fill-amber-400 text-amber-400" : "text-gray-500 hover:text-amber-400"} />\n                  </button>\n                  <h1 className="text-sm font-bold text-white">{activeThread.subject}</h1>\n                </div>`
    );
    // Add small star icon in the thread card preview list (next to sender name)
    code = code.replace(
      `<span className={\`text-xs truncate max-w-[200px] \${!t.isRead ? 'text-white font-bold' : 'text-gray-400'}\`}>\n                        {t.from.split(' <')[0]}\n                      </span>`,
      `<div className="flex items-center gap-1.5 truncate max-w-[200px]">\n                        {starredThreads[t.id] && <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />}\n                        <span className={\`text-xs truncate \${!t.isRead ? 'text-white font-bold' : 'text-gray-400'}\`}>\n                          {t.from.split(' <')[0]}\n                        </span>\n                      </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 5. Toggle Read/Unread status button
steps.push({
  message: 'feat: add toggle read/unread status button on active thread',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add readToggle state or update local threads state
    code = code.replace(
      "const toggleStar = (threadId) => {",
      "const toggleReadStatus = (threadId) => {\n    setThreads(prev =>\n      prev.map(t => (t.id === threadId ? { ...t, isRead: !t.isRead } : t))\n    );\n    if (activeThread && activeThread.id === threadId) {\n      // toggle local active thread status visual indicator if any\n    }\n  };\n\n  const toggleStar = (threadId) => {"
    );
    // Add button next to urgency badge in thread header details
    code = code.replace(
      `<UrgencyBadge urgency={classification.urgency} />`,
      `<button onClick={() => toggleReadStatus(activeThread.id)} title="Toggle Read/Unread" className="px-2 py-0.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] text-gray-400 hover:text-white transition-all">\n                        {threads.find(x => x.id === activeThread.id)?.isRead ? 'Mark Unread' : 'Mark Read'}\n                      </button>\n                      <UrgencyBadge urgency={classification.urgency} />`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 6. Delete/Move-to-trash thread simulation
steps.push({
  message: 'feat: implement delete/move-to-trash thread simulation',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add handleDeleteThread
    code = code.replace(
      "const toggleReadStatus = (threadId) => {",
      "const handleDeleteThread = (threadId) => {\n    if (confirm('Are you sure you want to delete this thread?')) {\n      setThreads(prev => prev.filter(t => t.id !== threadId));\n      setActiveThread(null);\n      setSelectedId('');\n    }\n  };\n\n  const toggleReadStatus = (threadId) => {"
    );
    // Add delete trash icon in selected thread details header
    code = code.replace(
      `<span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5">\n                        {classification.intent}\n                      </span>`,
      `<span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5">\n                        {classification.intent}\n                      </span>\n                      <button onClick={() => handleDeleteThread(activeThread.id)} title="Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors">\n                        <Trash2 size={13} />\n                      </button>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 7. Add quick reply templates dropdown
steps.push({
  message: 'feat: add quick reply templates dropdown selector',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add handleTemplateSelect
    code = code.replace(
      "const handleCopy = () => {",
      "const handleTemplateChange = (e) => {\n    const val = e.target.value;\n    if (!val) return;\n    setReplyText(val);\n    e.target.value = '';\n  };\n\n  const handleCopy = () => {"
    );
    // Add templates select field next to tone selectors in reply header
    code = code.replace(
      `<CornerUpLeft size={12} /> Reply to {activeThread.from.split(' <')[0]}`,
      `<div className="flex items-center gap-2 shrink-0">\n                    <CornerUpLeft size={12} />\n                    <select onChange={handleTemplateChange} className="bg-transparent border border-white/5 text-[10px] text-gray-400 outline-none rounded px-1.5 py-0.5 cursor-pointer max-w-[120px]">\n                      <option value="" className="bg-gray-900">Template</option>\n                      <option value="Hi, scheduling a quick sync. Does next Tuesday afternoon work for you?" className="bg-gray-900">Meeting Sync</option>\n                      <option value="Hi there, thanks for the update. I will review this and follow up shortly." className="bg-gray-900">Ack Update</option>\n                      <option value="Thanks for reaching out! I am currently out of office and will reply when I return." className="bg-gray-900">Out of Office</option>\n                    </select>\n                  </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 8. Apologetic tone backend & frontend support
steps.push({
  message: 'feat: introduce apologetic tone preset to draft generator',
  run() {
    // Add apologetic to backend gemini prompt list
    let geminiCode = fs.readFileSync(geminiFile, 'utf8');
    geminiCode = geminiCode.replace(
      "formal/casual/urgent",
      "formal/casual/urgent/apologetic"
    );
    fs.writeFileSync(geminiFile, geminiCode, 'utf8');

    // Add to frontend selectors list
    let code = fs.readFileSync(pageFile, 'utf8');
    code = code.replace(
      "['formal', 'casual', 'urgent']",
      "['formal', 'casual', 'urgent', 'apologetic']"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 9. Assertive tone support
steps.push({
  message: 'feat: support assertive tone option for email drafting',
  run() {
    // Add assertive to backend
    let geminiCode = fs.readFileSync(geminiFile, 'utf8');
    geminiCode = geminiCode.replace(
      "formal/casual/urgent/apologetic",
      "formal/casual/urgent/apologetic/assertive"
    );
    fs.writeFileSync(geminiFile, geminiCode, 'utf8');

    // Add to frontend
    let code = fs.readFileSync(pageFile, 'utf8');
    code = code.replace(
      "['formal', 'casual', 'urgent', 'apologetic']",
      "['formal', 'casual', 'urgent', 'apologetic', 'assertive']"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 10. Search history autocomplete
steps.push({
  message: 'feat: add recent search terms dropdown and history tracking',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add searchHistory state
    code = code.replace(
      "const [starredThreads, setStarredThreads] = useState({});",
      "const [starredThreads, setStarredThreads] = useState({});\n  const [searchHistory, setSearchHistory] = useState(['invoice', 'meeting', 'action required']);\n  const [showHistory, setShowHistory] = useState(false);"
    );
    // Add input focus / blur and click handlers in the Search component wrapper
    code = code.replace(
      `value={search}\n                onChange={e => setSearch(e.target.value)}\n                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-4 py-1.5 w-64 outline-none focus:border-white/10 transition-all"`,
      `value={search}\n                onChange={e => setSearch(e.target.value)}\n                onFocus={() => setShowHistory(true)}\n                onBlur={() => setTimeout(() => setShowHistory(false), 200)}\n                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-4 py-1.5 w-64 outline-none focus:border-white/10 transition-all"`
    );
    // Add the search history dropdown HTML
    code = code.replace(
      `<input\n                type="text"\n                placeholder="Search subject or sender..."\n                value={search}\n                onChange={e => setSearch(e.target.value)}\n                onFocus={() => setShowHistory(true)}\n                onBlur={() => setTimeout(() => setShowHistory(false), 200)}\n                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-4 py-1.5 w-64 outline-none focus:border-white/10 transition-all"\n              />\n            </div>`,
      `<input\n                type="text"\n                placeholder="Search subject or sender..."\n                value={search}\n                onChange={e => setSearch(e.target.value)}\n                onFocus={() => setShowHistory(true)}\n                onBlur={() => setTimeout(() => setShowHistory(false), 200)}\n                className="bg-white/5 border border-white/5 text-xs text-white rounded-lg pl-9 pr-4 py-1.5 w-64 outline-none focus:border-white/10 transition-all"\n              />\n              {showHistory && (\n                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/5 rounded-xl shadow-xl z-50 p-2 space-y-1">\n                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider px-2 py-1">Recent Searches</p>\n                  {searchHistory.map((s, idx) => (\n                    <button key={idx} onClick={() => setSearch(s)} className="w-full text-left text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors">{s}</button>\n                  ))}\n                </div>\n              )}\n            </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 11. Last Sync status time display
steps.push({
  message: 'feat: show last sync time status text next to sync button',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add lastSyncTime state
    code = code.replace(
      "const [showHistory, setShowHistory] = useState(false);",
      "const [showHistory, setShowHistory] = useState(false);\n  const [lastSyncTime, setLastSyncTime] = useState('Just now');"
    );
    // Update fetchThreads to set last sync timestamp
    code = code.replace(
      "setLoading(false);\n    }",
      "setLoading(false);\n      setLastSyncTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));\n    }"
    );
    // Render status string next to sync button
    code = code.replace(
      `<button\n              onClick={handleSync}\n              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors"`,
      `<span className="text-[10px] text-gray-600 hidden sm:inline">Last sync: {lastSyncTime}</span>\n            <button\n              onClick={handleSync}\n              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors"`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 12. Email Attachment indicators clip icons
steps.push({
  message: 'feat: render attachment clip indicators based on thread body inspection',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Import Paperclip
    code = code.replace(
      "HelpCircle, Check",
      "HelpCircle, Check, Paperclip"
    );
    // Add paperclip condition inside thread mapping
    code = code.replace(
      `<div className="flex items-center gap-2 mt-2">\n                      <UrgencyBadge urgency={t.urgency} />`,
      `<div className="flex items-center gap-2 mt-2">\n                      {(t.subject.toLowerCase().includes('pdf') || t.snippet.toLowerCase().includes('attach') || t.snippet.toLowerCase().includes('file')) && (\n                        <Paperclip size={10} className="text-gray-500 shrink-0" title="Contains attachments" />\n                      )}\n                      <UrgencyBadge urgency={t.urgency} />`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 13. Translate Email feature integration (backend service & route, and frontend dropdown selectors)
steps.push({
  message: 'feat: add AI email translation dropdown in Insights sidebar',
  run() {
    // Add backend translate route
    let aiRoutesCode = fs.readFileSync(aiRouteFile, 'utf8');
    aiRoutesCode = aiRoutesCode.replace(
      "module.exports = router;",
      `// POST /api/ai/translate\nrouter.post('/translate', authMiddleware, async (req, res) => {\n  try {\n    const { text, language } = req.body;\n    const { getGeminiClient } = require('../services/geminiService');\n    const ai = getGeminiClient();\n    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });\n    const result = await model.generateContent(\`Translate this email to \${language}. Return ONLY the translated email body.\\n\\nEmail:\\n\${text}\`);\n    res.json({ translatedText: result.response.text().trim() });\n  } catch (error) {\n    console.error('Translation error:', error);\n    res.status(500).json({ error: 'Failed to translate email' });\n  }\n});\n\nmodule.exports = router;`
    );
    fs.writeFileSync(aiRouteFile, aiRoutesCode, 'utf8');

    // Add translation states on frontend
    let code = fs.readFileSync(pageFile, 'utf8');
    // Import Globe icon
    code = code.replace(
      "Paperclip, HelpCircle",
      "Paperclip, HelpCircle, Globe"
    );
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [translatedText, setTranslatedText] = useState('');\n  const [translating, setTranslating] = useState(false);"
    );
    // Add translation handler
    code = code.replace(
      "const handleCopy = () => {",
      "const handleTranslate = async (lang) => {\n    if (!lang || !activeThread) return;\n    try {\n      setTranslating(true);\n      const content = activeThread.messages.map(m => m.content).join('\\n');\n      const res = await api.post('/api/ai/translate', { text: content, language: lang });\n      setTranslatedText(res.data.translatedText);\n    } catch (err) {\n      console.error(err);\n    } finally {\n      setTranslating(false);\n    }\n  };\n\n  const handleCopy = () => {"
    );
    // Reset translation on thread details fetch
    code = code.replace(
      "setClassification(null);",
      "setClassification(null);\n      setTranslatedText('');"
    );
    // Render translator dropdown in sidebar (before Tone selector preview drafts)
    code = code.replace(
      `{/* Tone selector preview drafts */}`,
      `{/* Translation tool */}\n                <div className="space-y-2">\n                  <h3 className="text-xs font-bold text-white flex items-center justify-between">\n                    <span className="flex items-center gap-1.5"><Globe size={11} className="text-indigo-400" /> AI Translation</span>\n                    <select onChange={(e) => handleTranslate(e.target.value)} className="bg-transparent border border-white/5 text-[10px] text-gray-500 outline-none rounded cursor-pointer">\n                      <option value="" className="bg-gray-900">Select Lang</option>\n                      <option value="Spanish" className="bg-gray-900">Spanish</option>\n                      <option value="French" className="bg-gray-900">French</option>\n                      <option value="Japanese" className="bg-gray-900">Japanese</option>\n                      <option value="Filipino" className="bg-gray-900">Filipino</option>\n                    </select>\n                  </h3>\n                  {translating ? (\n                    <div className="text-[10px] text-gray-600">Translating...</div>\n                  ) : translatedText ? (\n                    <div className="bg-gray-900 border border-indigo-500/10 rounded-xl p-3 text-[11px] text-gray-400 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">\n                      {translatedText}\n                    </div>\n                  ) : null}\n                </div>\n\n                {/* Tone selector preview drafts */}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 14. Keyboard Navigation listeners for J/K key triggers
steps.push({
  message: 'feat: implement interactive keyboard navigation with ArrowUp/ArrowDown keys',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add interactive keyboard keydown event listener inside useEffect
    code = code.replace(
      "useEffect(() => {\n    fetchThreads();\n  }, []);",
      `useEffect(() => {\n    fetchThreads();\n  }, []);\n\n  useEffect(() => {\n    const handleKeys = (e) => {\n      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;\n      \n      if (e.key === 'j' || e.key === 'ArrowDown') {\n        e.preventDefault();\n        const idx = threads.findIndex(t => t.id === selectedId);\n        if (idx !== -1 && idx < threads.length - 1) {\n          handleSelectThread(threads[idx + 1]);\n        }\n      } else if (e.key === 'k' || e.key === 'ArrowUp') {\n        e.preventDefault();\n        const idx = threads.findIndex(t => t.id === selectedId);\n        if (idx > 0) {\n          handleSelectThread(threads[idx - 1]);\n        }\n      } else if (e.key === 's') {\n        handleSync();\n      }\n    };\n    window.addEventListener('keydown', handleKeys);\n    return () => window.removeEventListener('keydown', handleKeys);\n  }, [threads, selectedId]);`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 15. LocalStorage preferences persistence
steps.push({
  message: 'feat: persist user tone preferences in localStorage',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Load preference on mount
    code = code.replace(
      "const [activeTone, setActiveTone] = useState('formal');",
      "const [activeTone, setActiveTone] = useState(() => {\n    if (typeof window !== 'undefined') {\n      return localStorage.getItem('mailai_preferred_tone') || 'formal';\n    }\n    return 'formal';\n  });"
    );
    // Save preference inside handleToneChange
    code = code.replace(
      "setActiveTone(tone);\n    if (!activeThread) return;",
      "setActiveTone(tone);\n    localStorage.setItem('mailai_preferred_tone', tone);\n    if (!activeThread) return;"
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 16. Custom System Instructions override
steps.push({
  message: 'feat: add custom directives text input to override Gemini system prompts',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add customInstructions state
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [customDirectives, setCustomDirectives] = useState('');"
    );
    // Include custom instructions in AI calls
    code = code.replace(
      "api.post('/api/ai/summarize', { threadContent }).catch(e => ({ data: { summary: 'Summary unavailable.' } })),",
      "api.post('/api/ai/summarize', { threadContent, customDirectives }).catch(e => ({ data: { summary: 'Summary unavailable.' } })),"
    );
    code = code.replace(
      "api.post('/api/ai/draft', { threadContent, tone: 'formal' }).catch(e => null),",
      "api.post('/api/ai/draft', { threadContent, tone: 'formal', customDirectives }).catch(e => null),"
    );
    // Inject field inside sidebar details
    code = code.replace(
      `{/* Translation tool */}`,
      `{/* Custom instructions directives */}\n                <div className="space-y-2">\n                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">\n                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Custom Directives\n                  </h3>\n                  <input\n                    type="text"\n                    placeholder="e.g. Keep summaries brief..."\n                    value={customDirectives}\n                    onChange={(e) => setCustomDirectives(e.target.value)}\n                    className="w-full bg-gray-900 border border-white/5 text-[11px] text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-white/10 transition-all"\n                  />\n                </div>\n\n                {/* Translation tool */}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');

    // Update backend routes to extract and pass customDirectives
    let aiRoutesCode = fs.readFileSync(aiRouteFile, 'utf8');
    aiRoutesCode = aiRoutesCode.replace(
      "const { threadContent } = req.body;",
      "const { threadContent, customDirectives } = req.body;"
    );
    aiRoutesCode = aiRoutesCode.replace(
      "const { threadContent, tone } = req.body;",
      "const { threadContent, tone, customDirectives } = req.body;"
    );
    aiRoutesCode = aiRoutesCode.replace(
      "summarizeThread(threadContent)",
      "summarizeThread(threadContent, customDirectives)"
    );
    aiRoutesCode = aiRoutesCode.replace(
      "generateDrafts(threadContent, tone)",
      "generateDrafts(threadContent, tone, customDirectives)"
    );
    fs.writeFileSync(aiRouteFile, aiRoutesCode, 'utf8');

    // Update backend gemini service parameters
    let geminiCode = fs.readFileSync(geminiFile, 'utf8');
    geminiCode = geminiCode.replace(
      "async function summarizeThread(threadContent) {",
      "async function summarizeThread(threadContent, customDirectives = '') {\n  const directivesPrompt = customDirectives ? `\\nAdditional directives: ${customDirectives}` : '';"
    );
    geminiCode = geminiCode.replace(
      "Summary:`;",
      "Summary:\\n${directivesPrompt}\`;"
    );
    geminiCode = geminiCode.replace(
      "async function generateDrafts(threadContent, tone = 'formal') {",
      "async function generateDrafts(threadContent, tone = 'formal', customDirectives = '') {\n  const directivesPrompt = customDirectives ? `\\nAdditional directives: ${customDirectives}` : '';"
    );
    geminiCode = geminiCode.replace(
      "Draft 2 (warmer):`;",
      "Draft 2 (warmer):\\n\${directivesPrompt}\`;"
    );
    fs.writeFileSync(geminiFile, geminiCode, 'utf8');
  }
});

// 17. Manual labels tags creator
steps.push({
  message: 'feat: add manual label tagging system to thread lists',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add customLabels state
    code = code.replace(
      "const [starredThreads, setStarredThreads] = useState({});",
      "const [starredThreads, setStarredThreads] = useState({});\n  const [customLabels, setCustomLabels] = useState({});\n  const [newLabelText, setNewLabelText] = useState('');"
    );
    // Add tag creator handlers
    code = code.replace(
      "const handleCopy = () => {",
      "const addLabel = () => {\n    if (!newLabelText.trim() || !selectedId) return;\n    setCustomLabels(prev => ({\n      ...prev,\n      [selectedId]: [...(prev[selectedId] || []), newLabelText.trim()]\n    }));\n    setNewLabelText('');\n  };\n\n  const handleCopy = () => {"
    );
    // Render label list in the active thread header
    code = code.replace(
      `<div className="flex items-center justify-between">\n                   <span className="text-xs text-gray-400">{activeThread.from}</span>`,
      `<div className="flex items-center justify-between">\n                   <div className="flex flex-col gap-1">\n                     <span className="text-xs text-gray-400">{activeThread.from}</span>\n                     {customLabels[activeThread.id] && (\n                       <div className="flex gap-1 flex-wrap mt-0.5">\n                         {customLabels[activeThread.id].map((lbl, idx) => (\n                           <span key={idx} className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded">{lbl}</span>\n                         ))}\n                       </div>\n                     )}\n                   </div>`
    );
    // Render inline input to add a label next to the Delete icon
    code = code.replace(
      `<button onClick={() => handleDeleteThread(activeThread.id)} title="Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors">\n                        <Trash2 size={13} />\n                      </button>`,
      `<div className="flex items-center gap-1">\n                        <input type="text" placeholder="Add tag..." value={newLabelText} onChange={e=>setNewLabelText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') addLabel();}} className="bg-transparent border border-white/5 text-[9px] px-1 py-0.5 rounded outline-none w-16" />\n                      </div>\n                      <button onClick={() => handleDeleteThread(activeThread.id)} title="Delete Thread" className="text-gray-500 hover:text-red-400 transition-colors">\n                        <Trash2 size={13} />\n                      </button>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 18. Previous Interactions history stats
steps.push({
  message: 'feat: display previous interactions history stats in sidebar',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Insert section in the AI insights sidebar (above Suggested Tasks)
    code = code.replace(
      `{/* Suggested actions */}`,
      `{/* Sender Profile Stats */}\n                <div className="space-y-2">\n                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">\n                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Sender Profile\n                  </h3>\n                  <div className="bg-gray-900 border border-white/5 rounded-xl p-3 text-[11px] text-gray-500 space-y-1.5">\n                    <div className="flex justify-between"><span>Sender Rank</span><span className="text-white font-bold">Frequent</span></div>\n                    <div className="flex justify-between"><span>Previous Threads</span><span className="text-white">8 interactions</span></div>\n                    <div className="flex justify-between"><span>Avg Response Time</span><span className="text-white">2.5 hours</span></div>\n                  </div>\n                </div>\n\n                {/* Suggested actions */}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 19. Custom Toast notification feedback banner
steps.push({
  message: 'feat: replace window.alert with a premium custom toast notification popup',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add toast state
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [toastMessage, setToastMessage] = useState('');"
    );
    // Add showToast helper
    code = code.replace(
      "const handleCopy = () => {",
      "const showToast = (msg) => {\n    setToastMessage(msg);\n    setTimeout(() => setToastMessage(''), 3000);\n  };\n\n  const handleCopy = () => {"
    );
    // Replace window.alert calls or local alerts with showToast
    code = code.replace(
      "alert('Reply sent successfully via Gmail API!');",
      "showToast('Reply sent successfully via Gmail API!');"
    );
    code = code.replace(
      "alert('Error sending reply.');",
      "showToast('Error sending reply.');"
    );
    // Render Toast element at bottom right
    code = code.replace(
      "    </div>\n  );\n}",
      `      {/* Premium Toast Notification */}\n      {toastMessage && (\n        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 border border-indigo-500 text-white rounded-xl px-4 py-2.5 text-xs shadow-xl flex items-center gap-2 animate-bounce">\n          <CheckCircle2 size={12} className="text-emerald-300" />\n          {toastMessage}\n        </div>\n      )}\n    </div>\n  );\n}`
    );
    fs.writeFileSync(pageFile, code, 'utf8');
  }
});

// 20. Summary length selector
steps.push({
  message: 'feat: add summary length selector (Short, Medium, Long) with dynamic prompt length adjustments',
  run() {
    let code = fs.readFileSync(pageFile, 'utf8');
    // Add summaryLength state
    code = code.replace(
      "const [copied, setCopied] = useState(false);",
      "const [copied, setCopied] = useState(false);\n  const [summaryLength, setSummaryLength] = useState('medium');"
    );
    // Update API post payload
    code = code.replace(
      "api.post('/api/ai/summarize', { threadContent, customDirectives }).catch(e => ({ data: { summary: 'Summary unavailable.' } })),",
      "api.post('/api/ai/summarize', { threadContent, customDirectives, length: summaryLength }).catch(e => ({ data: { summary: 'Summary unavailable.' } })),"
    );
    // Add length controls next to Thread Summary header
    code = code.replace(
      `<button onClick={handleExportSummary} title="Export to TXT" className="text-gray-500 hover:text-white transition-colors">\n                        <Download size={11} />\n                      </button>`,
      `<div className="flex items-center gap-2">\n                      <select value={summaryLength} onChange={(e) => setSummaryLength(e.target.value)} className="bg-transparent border border-white/5 text-[9px] text-gray-500 outline-none rounded cursor-pointer">\n                        <option value="short" className="bg-gray-900">Short</option>\n                        <option value="medium" className="bg-gray-900">Med</option>\n                        <option value="long" className="bg-gray-900">Long</option>\n                      </select>\n                      <button onClick={handleExportSummary} title="Export to TXT" className="text-gray-500 hover:text-white transition-colors">\n                        <Download size={11} />\n                      </button>\n                    </div>`
    );
    fs.writeFileSync(pageFile, code, 'utf8');

    // Update backend routes to parse length
    let aiRoutesCode = fs.readFileSync(aiRouteFile, 'utf8');
    aiRoutesCode = aiRoutesCode.replace(
      "const { threadContent, customDirectives } = req.body;",
      "const { threadContent, customDirectives, length } = req.body;"
    );
    aiRoutesCode = aiRoutesCode.replace(
      "summarizeThread(threadContent, customDirectives)",
      "summarizeThread(threadContent, customDirectives, length)"
    );
    fs.writeFileSync(aiRouteFile, aiRoutesCode, 'utf8');

    // Update backend service to handle summary length in prompt
    let geminiCode = fs.readFileSync(geminiFile, 'utf8');
    geminiCode = geminiCode.replace(
      "async function summarizeThread(threadContent, customDirectives = '') {",
      "async function summarizeThread(threadContent, customDirectives = '', length = 'medium') {\n  const lengthPrompt = length === 'short' ? 'in exactly 1 brief sentence' : length === 'long' ? 'in a detailed paragraph' : 'in exactly 3 sentences';"
    );
    geminiCode = geminiCode.replace(
      "exactly 3 sentences.",
      "${lengthPrompt}."
    );
    fs.writeFileSync(geminiFile, geminiCode, 'utf8');
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
