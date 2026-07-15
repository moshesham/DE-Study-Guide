import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Menu, X, Search, CheckCircle2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { studyGuideData, tipsData, Topic } from './data';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function App() {
  const [activeTopic, setActiveTopic] = useState<Topic>(() => {
    const saved = localStorage.getItem('de-study-guide-active-topic');
    if (saved) {
      const found = studyGuideData.find(t => t.id === saved);
      if (found) return found;
    }
    return studyGuideData[0];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTips, setShowTips] = useState(() => {
    return localStorage.getItem('de-study-guide-show-tips') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [learnedTopics, setLearnedTopics] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('de-study-guide-learned-topics');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set();
      }
    }
    return new Set();
  });
  const [isCodeHidden, setIsCodeHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset active recall state on topic change
  useEffect(() => {
    setIsCodeHidden(false);
  }, [activeTopic]);

  const handleCopyCode = async () => {
    if (!activeTopic.code) return;
    try {
      await navigator.clipboard.writeText(activeTopic.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('de-study-guide-learned-topics', JSON.stringify(Array.from(learnedTopics)));
  }, [learnedTopics]);

  const toggleLearned = (id: string) => {
    setLearnedTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('de-study-guide-active-topic', activeTopic.id);
  }, [activeTopic]);

  useEffect(() => {
    localStorage.setItem('de-study-guide-show-tips', showTips.toString());
  }, [showTips]);

  // Group topics by category
  const filteredData = studyGuideData.filter(topic => 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    topic.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.seniorSignal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = filteredData.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  const handleNext = () => {
    if (showTips) {
      setShowTips(false);
      setActiveTopic(studyGuideData[0]);
    } else {
      const currentIndex = studyGuideData.findIndex(t => t.id === activeTopic.id);
      if (currentIndex < studyGuideData.length - 1) {
        setActiveTopic(studyGuideData[currentIndex + 1]);
      } else {
        setShowTips(true);
      }
    }
  };

  const handlePrev = () => {
    if (showTips) {
      setShowTips(false);
      setActiveTopic(studyGuideData[studyGuideData.length - 1]);
    } else {
      const currentIndex = studyGuideData.findIndex(t => t.id === activeTopic.id);
      if (currentIndex > 0) {
        setActiveTopic(studyGuideData[currentIndex - 1]);
      } else {
        setShowTips(true);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTopic, showTips]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static top-0 left-0 h-full w-64 bg-slate-900 flex flex-col shadow-xl transition-transform duration-300 z-40`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shrink-0">
            <span className="text-white font-bold">DE</span>
          </div>
          <span className="text-slate-100 font-bold tracking-tight text-lg">StudyGuide.py</span>
        </div>

        <div className="px-4 py-4 border-b border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          {Object.entries(categories).map(([category, topics]) => (
            <div key={category} className="mb-6">
              <p className="px-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                {category}
              </p>
              {topics.map(topic => {
                const isActive = !showTips && activeTopic.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setActiveTopic(topic);
                      setShowTips(false);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-indigo-600/10 border-r-4 border-indigo-500'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
                    <div className="text-left flex-1 flex flex-col items-start gap-1">
                      <span>{topic.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        topic.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : 
                        topic.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {topic.difficulty}
                      </span>
                    </div>
                    {learnedTopics.has(topic.id) && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          <div className="mb-6 mt-6">
            <p className="px-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
              Resources
            </p>
            <button
              onClick={() => {
                setShowTips(true);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                showTips
                  ? 'text-white bg-indigo-600/10 border-r-4 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${showTips ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
              Interview Tips
            </button>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-800 mt-auto shrink-0 space-y-4">
          <a 
            href="https://github.com/yourusername/your-repo-name" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Contribute on GitHub
          </a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">ME</div>
            <div>
              <p className="text-xs text-white font-medium">Senior DE Interview</p>
              <p className="text-[10px] text-slate-500">Preparation Mode</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-serif font-bold text-slate-900 line-clamp-1">
                {showTips ? "Interview Tips" : activeTopic.title}
              </h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest line-clamp-1 mt-0.5">
                {showTips ? "Key strategies to keep in mind during your coding loop." : `Category: ${activeTopic.category}`}
              </p>
            </div>
            {/* Mobile Title */}
            <div className="sm:hidden text-sm font-serif font-bold text-slate-900 line-clamp-1">
              {showTips ? "Tips" : activeTopic.title}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!showTips && (
              <label className="hidden sm:inline-flex items-center gap-2 cursor-pointer mr-2">
                <input 
                  type="checkbox" 
                  checked={learnedTopics.has(activeTopic.id)}
                  onChange={() => toggleLearned(activeTopic.id)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Mark as Learned</span>
              </label>
            )}
            {!showTips && <span className="hidden lg:inline-flex text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 border border-slate-200 uppercase tracking-tight">Senior-Level Pattern</span>}
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrev}
                className="bg-white border border-slate-300 text-slate-700 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap shadow-sm"
              >
                Prev
              </button>
              <button 
                onClick={handleNext}
                className="bg-slate-900 border border-slate-900 text-white px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        </header>

        {/* View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F9FAFB]">
          {showTips ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">Study Tips</h2>
              {tipsData.map((tip, idx) => (
                <section key={idx} className="bg-white border border-slate-300 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-slate-600" />
                    {tip.title}
                  </h3>
                  <p className="text-base leading-relaxed text-slate-700 font-serif">{tip.description}</p>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full max-w-7xl mx-auto">
              {/* Code Block Column */}
              <div className="xl:col-span-8 flex flex-col h-full min-h-[500px]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Python Snippet</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsCodeHidden(!isCodeHidden)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      title="Active Recall Mode"
                    >
                      {isCodeHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {isCodeHidden ? 'Show Code' : 'Hide Code'}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? <span className="text-emerald-600">Copied!</span> : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-slate-900 font-mono text-[13px] leading-relaxed text-slate-300 shadow-xl relative border border-slate-800 overflow-hidden flex flex-col group">
                  <div className="absolute top-0 right-0 p-4 text-slate-600 z-10 pointer-events-none opacity-20">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </div>
                  
                  {isCodeHidden ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/80 backdrop-blur-sm relative z-20">
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                        <EyeOff className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h4 className="text-xl font-serif text-slate-200 mb-2">Active Recall Mode</h4>
                      <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 font-sans">
                        Try to recall the structure, patterns, and code implementation for <span className="text-indigo-300 font-medium">"{activeTopic.title}"</span> before revealing the answer.
                      </p>
                      <button 
                        onClick={() => setIsCodeHidden(false)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-medium px-6 py-2.5 rounded shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Reveal Code
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto p-4 md:p-6 transition-opacity duration-300">
                      <SyntaxHighlighter 
                        language="python" 
                        style={oneDark}
                        customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '13px', lineHeight: '1.6' }}
                        showLineNumbers={true}
                        wrapLines={true}
                      >
                        {activeTopic.code}
                      </SyntaxHighlighter>
                    </div>
                  )}
                </div>
              </div>

              {/* Insight Panel Column */}
              <div className="xl:col-span-4 flex flex-col space-y-6">
                <section className="bg-white border border-slate-300 p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.121 17.243L19 20l-1.243 1.243-2.879-2.879 1.243-1.243zM7.172 16.121L4.293 19 3.05 17.757l2.879-2.879 1.243 1.243z"></path></svg>
                    Senior Insight
                  </h3>
                  <ul className="space-y-5">
                    {activeTopic.seniorSignal.split('. ').map((point, i) => point.trim() ? (
                      <li key={i} className="flex gap-4">
                        <div className="mt-1.5 w-1.5 h-1.5 bg-slate-400 flex-shrink-0"></div>
                        <p className="text-[15px] leading-relaxed text-slate-700 font-serif">
                          {point.trim() + (point.endsWith('.') ? '' : '.')}
                        </p>
                      </li>
                    ) : null)}
                  </ul>
                </section>

                <section className="bg-slate-900 p-6 text-slate-100 shadow-lg mt-auto border-t-4 border-slate-700">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Self-Check Question</h3>
                  <p className="text-[15px] font-serif italic leading-snug">
                    {activeTopic.id === 'api-pulling' 
                      ? "\"What happens if the API times out mid-pull after successfully pulling 50% of the records?\"" 
                      : "\"How would you test this component in isolation without relying on the actual external service?\""}
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Focus on <span className="underline decoration-slate-500 underline-offset-2">resilience</span> and testability. Make sure to clearly state your assumptions.
                    </p>
                  </div>
                </section>

                <div className="mt-6 flex gap-3">
                  <div className="flex-1 bg-white border border-slate-300 p-4 text-center shadow-sm">
                    <span className="block text-xl font-serif font-bold text-emerald-600">{learnedTopics.size} <span className="text-slate-400 text-base font-normal">/ {studyGuideData.length}</span></span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1 block">Learned</span>
                  </div>
                  <div className="flex-1 bg-white border border-slate-300 p-4 text-center shadow-sm">
                    <span className="block text-xl font-serif font-bold text-slate-900">{studyGuideData.findIndex(t => t.id === activeTopic.id) + 1} <span className="text-slate-400 text-base font-normal">/ {studyGuideData.length}</span></span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1 block">Progress</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

