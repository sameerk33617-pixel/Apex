
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, Category, AIRecommendation } from './types';
import { APPS, CATEGORIES } from './constants';
import { getSmartRecommendations } from './services/geminiService';
import { soundService } from './services/soundService';

const firebaseConfig = {
  apiKey: "AIzaSyDShgjzNXfxSMPQVBQhcIDwgOwZcVpzyfQ",
  authDomain: "manga-app-cb4f2.firebaseapp.com",
  projectId: "manga-app-cb4f2",
  storageBucket: "manga-app-cb4f2.firebasestorage.app",
  messagingSenderId: "375648758885",
  appId: "1:375648758885:web:37d18686c2bbbb17fcea8c",
  measurementId: "G-H33T9W2Y71"
};

type NavTab = 'games' | 'apps' | 'offers' | 'books';
type SubTab = 'For you' | 'Top charts' | 'Categories' | 'Premium';

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [splashPhase, setSplashPhase] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<Category>('All');
  const [activeTab, setActiveTab] = useState<NavTab>('games');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('For you');
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adTimer, setAdTimer] = useState(10);
  const [pendingApp, setPendingApp] = useState<AppData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [downloadedItems, setDownloadedItems] = useState<AppData[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [aiRecs, setAiRecs] = useState<AIRecommendation[]>([]);
  const [toast, setToast] = useState<{message: string} | null>(null);

  const featuredRef = useRef<HTMLDivElement>(null);

  // Resume Audio on first touch
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundService.resume();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
  }, []);

  // Cinematic Splash Sequence
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setSplashPhase(1);
      soundService.playStartup();
    }, 600);
    const timer2 = setTimeout(() => setSplashPhase(2), 1300);
    const timer3 = setTimeout(() => setIsLoaded(true), 3400);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    let scrollInterval: any;
    if (featuredRef.current && isLoaded) {
      scrollInterval = setInterval(() => {
        if (!featuredRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = featuredRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          featuredRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          featuredRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }, 5000);
    }
    return () => clearInterval(scrollInterval);
  }, [isLoaded]);

  const showToast = (message: string) => {
    soundService.playNotify();
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAppClick = (app: AppData) => {
    soundService.playPop();
    setPendingApp(app);
    setAdTimer(10);
    setShowAd(true);
  };

  useEffect(() => {
    let interval: any;
    if (showAd && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showAd, adTimer]);

  const closeAd = () => {
    if (adTimer > 0) return;
    soundService.playTick();
    setShowAd(false);
    if (pendingApp) {
      initiateApexCloudDownload(pendingApp);
    }
  };

  const initiateApexCloudDownload = (app: AppData) => {
    soundService.playSuccess();
    setIsDownloading(true);
    setDownloadProgress(0);
    setInstallingId(app.id);

    const isBook = app.cat === 'Books';
    const duration = 4500;
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);

    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          finalizeDirectDownload(app, isBook);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);
  };

  const finalizeDirectDownload = (app: AppData, isBook: boolean) => {
    setIsDownloading(false);
    setInstallingId(null);
    setDownloadedItems(prev => [...prev, app]);
    showToast(`${app.name} ${isBook ? 'Book' : 'App'} Extracted!`);
    soundService.playSuccess();

    const fileExt = isBook ? 'pdf' : 'apk';
    const link = document.createElement('a');
    link.href = app.link;
    link.setAttribute('download', `${app.name.replace(/\s+/g, '_')}_Apex.${fileExt}`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 3) {
        const recs = await getSmartRecommendations(query);
        if (recs) setAiRecs(recs);
      } else {
        setAiRecs([]);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredApps = useMemo(() => {
    let list = APPS.filter(app => {
      const matchesCat = selectedCat === 'All' || app.cat === selectedCat;
      const matchesQuery = !query || app.name.toLowerCase().includes(query.toLowerCase());
      const matchesTab = (activeTab === 'games' && app.cat === 'Games') ||
                         (activeTab === 'apps' && app.cat !== 'Games' && app.cat !== 'Books') ||
                         (activeTab === 'books' && app.cat === 'Books') ||
                         (activeTab === 'offers' && app.price === 0);
      return matchesCat && matchesQuery && matchesTab;
    });
    if (activeSubTab === 'Top charts') return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [selectedCat, query, activeTab, activeSubTab]);

  const trendingApps = useMemo(() => filteredApps.filter(a => a.trending), [filteredApps]);
  const otherApps = useMemo(() => filteredApps.filter(a => !a.trending || trendingApps.length === 0), [filteredApps, trendingApps]);

  const closeAll = () => {
    soundService.playTick();
    setShowMenu(false);
    setShowProfile(false);
  };

  return (
    <div className="min-h-screen pb-24 bg-[#080808] text-[#e3e3e3] font-sans selection:bg-[#00ffaa]/20 overflow-x-hidden">
      
      {/* 🎬 CINEMATIC SPLASH SCREEN */}
      <div className={`fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center transition-all duration-1000 ${isLoaded ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center">
          <div className={`w-20 h-20 bg-[#00ffaa] rounded-[1.8rem] flex items-center justify-center text-4xl font-black text-black shadow-[0_0_60px_rgba(0,255,170,0.3)] transition-all duration-700 ${splashPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            A
          </div>
          <div className={`flex items-center overflow-hidden transition-all duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1) ${splashPhase >= 2 ? 'max-w-xs opacity-100 ml-4' : 'max-w-0 opacity-0 ml-0'}`}>
            <span className="text-4xl font-black italic tracking-tighter text-white mr-1">P</span>
            <span className="text-4xl font-black italic tracking-tighter text-white mr-1">E</span>
            <span className="text-4xl font-black italic tracking-tighter text-white">X</span>
          </div>
        </div>
        <div className={`absolute inset-0 bg-[#00ffaa] blur-[120px] opacity-10 transition-opacity duration-1000 ${splashPhase >= 1 ? 'opacity-20' : 'opacity-0'}`}></div>
        <div className={`absolute bottom-20 w-40 h-0.5 bg-white/5 rounded-full overflow-hidden transition-opacity duration-500 ${splashPhase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-full bg-[#00ffaa] animate-loading"></div>
        </div>
      </div>

      {/* 📥 DOWNLOAD OVERLAY */}
      {isDownloading && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="relative w-40 h-40 mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#00ffaa" strokeWidth="4" 
                strokeDasharray="283" strokeDashoffset={283 - (283 * downloadProgress) / 100}
                strokeLinecap="round" className="transition-all duration-200 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{Math.round(downloadProgress)}%</span>
            </div>
          </div>
          <h2 className="text-lg font-black text-white mb-2">{pendingApp?.cat === 'Books' ? 'Saving E-Book' : 'Direct Extraction'}</h2>
          <p className="text-white/30 text-[10px] text-center max-w-[220px]">Syncing with Apex Premium Nodes...</p>
        </div>
      )}

      {/* 📺 AD OVERLAY */}
      {showAd && (
        <div className="fixed inset-0 z-[1000] ad-gradient flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
           <div className="absolute top-10 right-8">
              <button 
                onClick={closeAd}
                disabled={adTimer > 0}
                className={`px-6 py-2 rounded-full font-black text-[11px] transition-all flex items-center gap-2 ${adTimer > 0 ? 'bg-white/5 text-white/20 border border-white/10' : 'bg-[#00ffaa] text-black shadow-lg active:scale-95'}`}
              >
                {adTimer > 0 ? `Wait ${adTimer}s` : 'SKIP AD'}
              </button>
           </div>
           <div className="text-center w-full max-w-sm">
              <div className="w-full aspect-video bg-white/[0.03] rounded-[2.5rem] border-2 border-white/5 overflow-hidden relative shadow-2xl mb-10">
                 <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-md">
                    <p className="text-[#00ffaa] font-black text-xl tracking-[0.2em] mb-1">APEX PLUS</p>
                    <p className="text-white/20 text-[8px] font-bold uppercase tracking-[0.4em]">Verified Proxy Node</p>
                 </div>
              </div>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest bg-white/5 px-6 py-2 rounded-full border border-white/5">Auto-download starting soon</p>
           </div>
        </div>
      )}

      {/* Side Menu */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#101010] z-[110] transition-transform duration-500 transform ${showMenu ? 'translate-x-0' : '-translate-x-full'} shadow-2xl rounded-r-[2rem] border-r border-white/5`}>
         <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-8 bg-[#00ffaa] rounded-lg flex items-center justify-center font-black text-black text-sm">A</div>
              <h2 className="text-[#00ffaa] text-xl font-black tracking-tighter italic">APEX</h2>
            </div>
            <div className="space-y-2">
               {['My Apps', 'Book Collection', 'Security', 'Settings'].map(item => (
                 <button key={item} onClick={() => { soundService.playTick(); showToast(item); setShowMenu(false); }} 
                   className="w-full text-left px-5 py-3.5 rounded-[1.2rem] text-[12px] font-bold text-white/30 hover:bg-[#00ffaa]/5 hover:text-[#00ffaa] transition-all">
                   {item}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Header */}
      <header className="px-4 py-4 sticky top-0 z-[60] bg-[#080808]/90 backdrop-blur-3xl">
        <div className="flex items-center bg-[#151515] rounded-full px-4 py-2 shadow-xl border border-white/5 transition-all group focus-within:ring-1 focus-within:ring-[#00ffaa]/10">
          <button className="p-2 text-white/20 active:scale-75 transition-transform" onClick={() => { soundService.playWhoosh(); setShowMenu(true); }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <input type="text" placeholder="Direct App Discovery..." value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none px-3 text-[12px] text-white font-medium placeholder:text-white/10" />
          <div className="flex items-center gap-1.5">
             <button onClick={() => { soundService.playNotify(); setIsListening(true); showToast("Apex Listening..."); setTimeout(() => setIsListening(false), 2000); }} 
               className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-[#00ffaa] text-black scale-110' : 'text-white/20 active:scale-75'}`}>
                {isListening ? (
                  <div className="flex gap-0.5">
                    {[1,2,3].map(i => <div key={i} className="w-0.5 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: `${i*0.1}s`}}></div>)}
                  </div>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
                )}
             </button>
             <button onClick={() => { soundService.playWhoosh(); setShowProfile(true); }} 
               className="w-8 h-8 bg-gradient-to-tr from-[#00ffaa] to-emerald-700 rounded-lg flex items-center justify-center text-[10px] font-black text-black shadow-lg active:scale-90 transition-transform">AX</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-8 px-8 overflow-x-auto no-scrollbar bg-[#080808] sticky top-[80px] z-50 border-b border-white/5">
        {(['For you', 'Top charts', 'Categories', 'Premium'] as SubTab[]).map(t => (
          <button key={t} onClick={() => { soundService.playTick(); setActiveSubTab(t); }}
            className={`text-[13px] font-black whitespace-nowrap pb-4 border-b-2 transition-all duration-500 ${activeSubTab === t ? 'border-[#00ffaa] text-[#00ffaa] translate-y-[1px]' : 'border-transparent text-white/20'}`}>
            {t}
          </button>
        ))}
      </div>

      <main className={`mt-6 px-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Featured Section */}
        {trendingApps.length > 0 && activeSubTab === 'For you' && (
          <section className="mb-10">
            <h3 className="px-2 text-sm font-black mb-5 tracking-tight">Apex Selection</h3>
            <div ref={featuredRef} className="flex gap-5 overflow-x-auto no-scrollbar snap-x pb-4">
              {trendingApps.map(app => (
                <div key={app.id} onClick={() => handleAppClick(app)} className="relative min-w-[280px] h-[160px] rounded-[2.2rem] overflow-hidden snap-start cursor-pointer group shadow-xl border border-white/5">
                  <img src={app.banner || app.icon} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-center gap-4">
                    <img src={app.icon} className="w-12 h-12 rounded-[1.2rem] object-cover border border-white/10 shadow-2xl" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-[13px] font-black truncate">{app.name}</h4>
                      <p className="text-white/40 text-[9px] font-bold line-clamp-1">{app.desc}</p>
                    </div>
                    <div className="bg-[#00ffaa] text-black text-[9px] font-black px-4 py-2 rounded-full uppercase shadow-lg">Get</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI Insight */}
        {aiRecs.length > 0 && (
          <div className="mb-10 p-5 bg-[#00ffaa]/5 border border-[#00ffaa]/10 rounded-[2.2rem] shadow-2xl">
            <p className="text-[9px] uppercase font-black text-[#00ffaa] tracking-[0.4em] mb-4 flex items-center gap-3">
              <span className="w-2 h-2 bg-[#00ffaa] rounded-full animate-ping"></span>
              Apex Intelligence
            </p>
            {aiRecs.map((rec, i) => (
              <div key={i} className="mb-3 last:mb-0 bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[11px] text-[#00ffaa] font-black mb-1">{rec.name}</p>
                <p className="text-[10px] text-white/30 font-medium leading-relaxed">{rec.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Categories Chips */}
        {activeSubTab === 'Categories' && (
          <div className="flex flex-wrap gap-3 py-4 mb-4">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => { soundService.playTick(); setSelectedCat(cat); }}
                className={`px-6 py-2 rounded-2xl text-[10px] font-black border transition-all active:scale-90 ${selectedCat === cat ? 'bg-[#00ffaa] border-[#00ffaa] text-black shadow-lg' : 'border-white/5 text-white/20 bg-white/5'}`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Main Grid */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-base font-black tracking-tighter">{activeSubTab === 'Top charts' ? 'Global Ranking' : (activeTab === 'books' ? 'Library Vault' : 'Trending Now')}</h3>
            <button onClick={() => soundService.playTick()} className="text-[10px] font-black text-[#00ffaa] uppercase tracking-[0.2em]">All</button>
          </div>
          <div className="grid grid-cols-3 gap-x-5 gap-y-10">
            {otherApps.map(app => (
              <div key={app.id} onClick={() => handleAppClick(app)} className="flex flex-col group cursor-pointer active:scale-95 transition-all">
                <div className="relative aspect-square mb-3 rounded-[1.8rem] overflow-hidden bg-[#121212] border border-white/5 shadow-xl">
                  <img src={app.icon} className={`w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-110 ${installingId === app.id ? 'blur-2xl opacity-30 scale-75' : ''}`} />
                  {installingId === app.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-3 border-[#00ffaa] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <h4 className="text-[11px] font-black text-white/90 truncate mb-0.5 tracking-tight">{app.name}</h4>
                  <p className="text-[9px] font-bold text-white/10 mb-1.5 uppercase tracking-tighter italic">{app.cat}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Profile Modal */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-sm bg-[#121212] rounded-[3.5rem] z-[120] p-10 shadow-2xl transition-all duration-500 border border-white/10 ${showProfile ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#00ffaa] rounded-[2.2rem] flex items-center justify-center text-3xl font-black mb-5 shadow-2xl text-black rotate-6">AX</div>
          <h2 className="text-xl font-black">Apex Member</h2>
          <p className="text-[9px] font-black text-[#00ffaa] bg-[#00ffaa]/10 px-4 py-1.5 rounded-full mt-2 uppercase tracking-widest">Premium Node</p>
        </div>
        <div className="space-y-2">
          {['Cloud Vault', 'Subscription', 'History'].map(item => (
            <button key={item} onClick={() => { soundService.playTick(); showToast(item); setShowProfile(false); }} className="w-full text-left px-7 py-3.5 rounded-[1.5rem] text-[12px] font-bold text-white/20 hover:text-[#00ffaa] hover:bg-white/5 transition-all">{item}</button>
          ))}
          <button onClick={closeAll} className="w-full bg-[#00ffaa] text-black py-4 rounded-full text-[12px] font-black mt-6 shadow-lg active:scale-95 transition-all">Close</button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#080808]/95 backdrop-blur-3xl border-t border-white/5 px-6 py-6 flex justify-around items-center z-[100] shadow-2xl">
        {[
          { id: 'games', label: 'Play', icon: 'M21.58 7.19c-.23-.15-.59-.19-.89-.13l-4.41.92-2.31-3.85c-.19-.32-.51-.51-.87-.51s-.68.19-.87.51l-2.31 3.85-4.41-.92c-.3-.06-.66-.02-.89.13-.24.15-.36.43-.33.71l1.45 12.11c.04.34.33.6.67.6h11.75c.34 0 .63-.26.67-.6l1.45-12.11c.03-.28-.09-.56-.33-.71z' },
          { id: 'apps', label: 'Apex', icon: 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z' },
          { id: 'offers', label: 'Nodes', icon: 'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z' },
          { id: 'books', label: 'Vault', icon: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z' }
        ].map(tab => (
          <button key={tab.id} onClick={() => { soundService.playTick(); setActiveTab(tab.id as NavTab); }}
            className="flex flex-col items-center gap-1.5 flex-1 relative active:scale-50 transition-all duration-300">
            <div className={`px-7 py-3 rounded-[1.5rem] transition-all duration-500 ${activeTab === tab.id ? 'bg-[#00ffaa]/5' : ''}`}>
              <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current transition-all duration-500 ${activeTab === tab.id ? 'text-[#00ffaa] scale-110' : 'text-white/5'}`}><path d={tab.icon} /></svg>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === tab.id ? 'text-[#00ffaa]' : 'text-white/5'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Persistent Status Toast */}
      {toast && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 px-8 py-4 bg-[#151515] text-white text-[10px] font-black rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 z-[200] border border-white/5 border-t-[#00ffaa]/30 uppercase tracking-[0.2em]">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;
