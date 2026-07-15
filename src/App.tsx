import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Menu, X, Search } from 'lucide-react';
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
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
                    <span className="text-left">{topic.title}</span>
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
        
        <div className="p-6 border-t border-slate-800 mt-auto shrink-0">
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-800 line-clamp-1">
                {showTips ? "Interview Tips" : activeTopic.title}
              </h1>
              <p className="text-xs text-slate-500 line-clamp-1">
                {showTips ? "Key strategies to keep in mind during your coding loop." : `Category: ${activeTopic.category}`}
              </p>
            </div>
            {/* Mobile Title */}
            <div className="sm:hidden text-sm font-bold text-slate-800 line-clamp-1">
              {showTips ? "Tips" : activeTopic.title}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!showTips && <span className="hidden sm:inline-flex text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase tracking-tight">Senior-Level Pattern</span>}
            <button 
              onClick={handleNext}
              className="bg-slate-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Next
            </button>
          </div>
        </header>

        {/* View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {showTips ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Study Tips</h2>
              {tipsData.map((tip, idx) => (
                <section key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {tip.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">{tip.description}</p>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">
              {/* Code Block Column */}
              <div className="xl:col-span-8 flex flex-col h-full min-h-[500px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Python Snippet</span>
                  <span className="text-xs text-slate-400">main.py</span>
                </div>
                <div className="flex-1 bg-slate-950 rounded-xl font-mono text-[13px] leading-relaxed text-slate-300 shadow-2xl relative border border-slate-800 overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-4 text-slate-600 z-10 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </div>
                  <div className="flex-1 overflow-auto p-4 md:p-6">
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
                </div>
              </div>

              {/* Insight Panel Column */}
              <div className="xl:col-span-4 flex flex-col space-y-6">
                <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM16.121 17.243L19 20l-1.243 1.243-2.879-2.879 1.243-1.243zM7.172 16.121L4.293 19 3.05 17.757l2.879-2.879 1.243 1.243z"></path></svg>
                    Senior Insight
                  </h3>
                  <ul className="space-y-4">
                    {activeTopic.seniorSignal.split('. ').map((point, i) => point.trim() ? (
                      <li key={i} className="flex gap-3">
                        <div className="mt-1 w-4 h-4 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          {point.trim() + (point.endsWith('.') ? '' : '.')}
                        </p>
                      </li>
                    ) : null)}
                  </ul>
                </section>

                <section className="bg-indigo-900 rounded-xl p-5 text-indigo-50 shadow-lg mt-auto">
                  <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-3">Self-Check Question</h3>
                  <p className="text-sm italic font-medium leading-snug">
                    {activeTopic.id === 'api-pulling' 
                      ? "\"What happens if the API times out mid-pull after successfully pulling 50% of the records?\"" 
                      : "\"How would you test this component in isolation without relying on the actual external service?\""}
                  </p>
                  <div className="mt-4 pt-4 border-t border-indigo-800">
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      Focus on <span className="underline decoration-indigo-400">resilience</span> and testability. Make sure to clearly state your assumptions.
                    </p>
                  </div>
                </section>

                <div className="mt-6 flex gap-2">
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <span className="block text-lg font-bold text-slate-800">{studyGuideData.findIndex(t => t.id === activeTopic.id) + 1}/{studyGuideData.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Progress</span>
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-center">
                    <span className="block text-lg font-bold text-emerald-600">Ready</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Status</span>
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

