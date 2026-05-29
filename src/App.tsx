import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Film, 
  Calendar, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Award, 
  Users, 
  ChevronRight, 
  RefreshCw, 
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  Flame,
  X
} from "lucide-react";
import { BoxOfficeItem } from "./types";
import MovieDetailModal from "./components/MovieDetailModal";

// Helper to calculate yesterday's date
const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function App() {
  const yesterdayDateStr = useMemo(() => getYesterdayString(), []);
  
  // States
  const [selectedDate, setSelectedDate] = useState<string>(yesterdayDateStr);
  const [boxOfficeList, setBoxOfficeList] = useState<BoxOfficeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("rank"); // rank | audiCnt | audiAcc | salesAmt
  
  // Modal State
  const [detailMovieCd, setDetailMovieCd] = useState<string | null>(null);
  const [detailMovieNm, setDetailMovieNm] = useState<string>("");

  // Fetch data on date changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function fetchBoxOffice() {
      try {
        const targetDt = selectedDate.replace(/-/g, "");
        if (!/^\d{8}$/.test(targetDt)) {
          throw new Error("올바른 날짜 형식이 아닙니다.");
        }

        const res = await fetch(`/api/boxoffice?date=${targetDt}`);
        if (!res.ok) {
          throw new Error("서버 응답이 원활하지 않습니다.");
        }
        
        const data = await res.json();
        if (data.faultInfo) {
          throw new Error(data.faultInfo.message);
        }

        if (data.boxOfficeResult?.dailyBoxOfficeList) {
          if (isMounted) {
            setBoxOfficeList(data.boxOfficeResult.dailyBoxOfficeList);
          }
        } else {
          if (isMounted) {
            setBoxOfficeList([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "데이터 조회 실패");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBoxOffice();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Adjust Date by Days
  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    
    const maxD = new Date(yesterdayDateStr);
    
    if (d > maxD) {
      alert("데이터는 어제 날짜까지 조회가 가능합니다.");
      return;
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Convert "2026-05-28" to readable Korean phrase "2026년 5월 28일"
  const getReadableKoreanDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    
    // Get day of week
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const d = new Date(dateStr);
    const dayOfWeek = weekdayNames[d.getDay() || 0];

    return `${parts[0]}년 ${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일 (${dayOfWeek}요일)`;
  };

  // Stats calculation
  const totalAudienceTop10 = useMemo(() => {
    return boxOfficeList.reduce((acc, item) => acc + parseInt(item.audiCnt || "0", 10), 0);
  }, [boxOfficeList]);

  const topMovie = useMemo(() => {
    return boxOfficeList.find(m => m.rank === "1") || null;
  }, [boxOfficeList]);

  // Filter & Sort
  const processedList = useMemo(() => {
    let list = [...boxOfficeList];

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(item => item.movieNm.toLowerCase().includes(query));
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "audiCnt") {
        return parseInt(b.audiCnt || "0", 10) - parseInt(a.audiCnt || "0", 10);
      }
      if (sortBy === "audiAcc") {
        return parseInt(b.audiAcc || "0", 10) - parseInt(a.audiAcc || "0", 10);
      }
      if (sortBy === "salesAmt") {
        return parseInt(b.salesAmt || "0", 10) - parseInt(a.salesAmt || "0", 10);
      }
      // default: sort by rank ascending
      return parseInt(a.rank || "0", 10) - parseInt(b.rank || "0", 10);
    });

    return list;
  }, [boxOfficeList, searchQuery, sortBy]);

  // Format Helper
  const formatNumber = (numStr: string) => {
    const val = parseInt(numStr, 10);
    if (isNaN(val)) return "0";
    return val.toLocaleString();
  };

  // Audi limit format (K-style)
  const formatAudiAcc = (numStr: string) => {
    const val = parseInt(numStr, 10);
    if (isNaN(val)) return "0명";
    if (val >= 10000000) {
      return `${(val / 10000000).toFixed(1)}천만 명`;
    }
    if (val >= 10000) {
      return `${(val / 10000).toFixed(1)}만 명`;
    }
    return `${val.toLocaleString()}명`;
  };

  // Convert Sales into Korean currency scales
  const formatSalesAmt = (numStr: string) => {
    const val = parseInt(numStr, 10);
    if (isNaN(val)) return "0원";
    if (val >= 100000000) {
      return `${(val / 100000000).toFixed(1)}억 원`;
    }
    if (val >= 10000) {
      return `${(val / 10000).toFixed(0)}만 원`;
    }
    return `${val.toLocaleString()}원`;
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans antialiased pb-16 relative overflow-hidden">
      
      {/* Background Ambient Glow Elements */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-[#ff4e00]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#050505]/75 backdrop-blur-md border-b border-white/10 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-end justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ff4e00] block mb-1">
              Daily Cinema Pulse
            </span>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
              박스오피스 <span className="font-serif italic text-white/50">Box Office</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-white/40 font-mono tracking-wider hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-[#ff4e00] animate-pulse"></span>
            <span>Real-time Data Sourced from KOBIS</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        
        {/* Top Control Block (Date Picker & Presets) */}
        <section id="date-selection-section" className="bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#ff4e00]">
                <Calendar size={14} className="text-[#ff4e00]" />
                <span className="text-[10px] uppercase tracking-widest text-[#ff4e00] font-black">
                  Selected Target Date
                </span>
              </div>
              <h2 className="text-xl font-light tracking-tight text-white">
                {getReadableKoreanDate(selectedDate)}
              </h2>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Day Adjustment Buttons */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1">
                <button
                  id="prev-date-btn"
                  onClick={() => adjustDate(-1)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all duration-150"
                  title="하루 전"
                >
                  하루 전
                </button>
                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                <button
                  id="next-date-btn"
                  onClick={() => adjustDate(1)}
                  disabled={selectedDate === yesterdayDateStr}
                  className="px-4 py-1.5 text-xs font-semibold rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-white/70 hover:text-white transition-all duration-150"
                  title="하루 후"
                >
                  하루 후
                </button>
              </div>

              {/* Native Date Input with Max Yesterday restriction */}
              <div className="relative">
                <input
                  id="date-native-input"
                  type="date"
                  value={selectedDate}
                  max={yesterdayDateStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-white/5 border border-white/10 text-white rounded-full focus:outline-none focus:border-[#ff4e00] focus:ring-1 focus:ring-[#ff4e00] transition-all cursor-pointer"
                />
              </div>

              {/* Reset to Yesterday */}
              {selectedDate !== yesterdayDateStr && (
                <button
                  id="reset-date-btn"
                  onClick={() => setSelectedDate(yesterdayDateStr)}
                  className="p-2 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all"
                  title="어제 날짜로 원래대로"
                >
                  <RefreshCw size={14} className="text-white/60 hover:text-white" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Dynamic Bento Highlights/Statistics (Spotlight of Day) */}
        {!isLoading && !error && boxOfficeList.length > 0 && (
          <div id="stats-dashboard-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box Office Top Spotlight */}
            {topMovie && (
              <div 
                onClick={() => {
                  setDetailMovieCd(topMovie.movieCd);
                  setDetailMovieNm(topMovie.movieNm);
                }}
                className="md:col-span-2 relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.05] text-white rounded-2xl border border-white/10 p-6 flex flex-col justify-between group cursor-pointer shadow-2xl hover:border-[#ff4e00]/50 transition-all duration-300 min-h-[190px]"
              >
                {/* Cinema style vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-transparent to-transparent z-0 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050505]/40 z-0 pointer-events-none" />
                
                {/* Background effect */}
                <div className="absolute top-0 right-0 w-[45%] h-[150%] bg-gradient-to-l from-[#ff4e00]/15 via-red-900/5 to-transparent blur-3xl pointer-events-none transform rotate-12 transition-all duration-500 group-hover:scale-110" />

                <div className="space-y-1.5 relative z-10">
                  <div className="inline-block bg-[#ff4e00] text-black text-[10px] font-black px-2.5 py-0.5 mb-2 rounded-sm uppercase tracking-tighter">
                    Spotlight No.1
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-white group-hover:text-[#ff4e00] transition-colors duration-200">
                    {topMovie.movieNm}
                  </h3>
                  <p className="text-xs text-white/50 font-medium">개봉일: {topMovie.openDt || "정보 없음"}</p>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-4 mt-6 relative z-10 border-t border-white/10 pt-4">
                  <div className="space-y-1">
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">당일 관객수</div>
                    <div className="text-lg font-mono font-semibold text-white">
                      {formatNumber(topMovie.audiCnt)} <span className="text-xs font-normal text-white/60">명</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-8 bg-white/10 hidden sm:block" />
                  
                  <div className="space-y-1">
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">누적 관객수</div>
                    <div className="text-lg font-mono font-semibold text-white">
                      {formatAudiAcc(topMovie.audiAcc)}
                    </div>
                  </div>
                  
                  <div className="w-px h-8 bg-white/10 hidden sm:block" />
                  
                  <div className="space-y-1">
                    <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">상영작 점유율</div>
                    <div className="text-lg font-mono font-semibold text-[#ff4e00]">
                      {topMovie.salesShare}%
                    </div>
                  </div>
                  
                  <span className="text-xs text-[#ff4e00] font-semibold group-hover:translate-x-1.5 transition-transform duration-200 inline-flex items-center gap-1 self-center">
                    상세 정보 <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            )}

            {/* Aggregate Summary Box */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-2xl min-h-[190px]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#ff4e00] font-semibold text-[10px] uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full animate-ping mr-1"></span>
                  Daily Stat Pulse
                </div>
                <h3 className="text-lg font-bold text-white mt-1">상위 10개작 통합 통계</h3>
                <p className="text-xs text-white/40">주요 10대 영화 일일 총 관객 집계</p>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">일일 관객 합계</div>
                  <div className="text-2xl font-mono font-light text-white mt-0.5">
                    {formatNumber(totalAudienceTop10.toString())} <span className="text-xs text-white/50">명</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs font-semibold text-center">
                  오늘 {boxOfficeList.length}개 상영
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Primary Filter & Grid List Section */}
        <section id="movie-list-explorer-section" className="space-y-5">
          
          {/* List Toolbar (Search Queries, Sorting Selection) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-xl shadow-xl">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Search size={15} />
              </span>
              <input
                id="search-movie-name-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목으로 영화 검색..."
                className="w-full pl-10 pr-9 py-2 text-xs bg-white/5 border border-white/10 rounded-xl focus:border-[#ff4e00] focus:ring-1 focus:ring-[#ff4e00] text-white outline-none transition-all placeholder:text-white/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white"
                  title="검색어 지우기"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile indicator showing number of movies filtered */}
            {searchQuery && (
              <span className="text-[10px] self-center text-[#ff4e00] bg-[#ff4e00]/10 border border-[#ff4e00]/20 px-2.5 py-1 rounded-md font-bold tracking-widest uppercase">
                검색 결과 {processedList.length}건
              </span>
            )}

            {/* Sorting controls */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 font-semibold tracking-wider">정렬 기준</span>
              <div className="flex bg-white/5 border border-white/10 p-1 rounded-lg">
                <button
                  onClick={() => setSortBy("rank")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    sortBy === "rank" 
                      ? "bg-white/10 text-[#ff4e00] shadow-sm border border-white/5" 
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  순위
                </button>
                <button
                  onClick={() => setSortBy("audiCnt")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    sortBy === "audiCnt"
                      ? "bg-white/10 text-[#ff4e00] shadow-sm border border-white/5"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  일일관객
                </button>
                <button
                  onClick={() => setSortBy("audiAcc")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    sortBy === "audiAcc"
                      ? "bg-white/10 text-[#ff4e00] shadow-sm border border-white/5"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  누적관객
                </button>
              </div>
            </div>
          </div>

          {/* Loader, Empty and Error states */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-24 text-center flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-10 h-10 border-4 border-[#ff4e00] border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white/80">
                    영화진흥위원회 데이터를 실시간으로 수신 중입니다...
                  </p>
                  <p className="text-xs text-[#ff4e00] font-mono tracking-widest uppercase">Loading Box Office Records</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center bg-red-950/20 border border-red-900/30 rounded-2xl max-w-2xl mx-auto p-6 space-y-4"
              >
                <HelpCircle size={40} className="mx-auto text-[#ff4e00]" />
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-red-400">데이터 조회오류</h3>
                  <p className="text-sm text-red-300/80">{error}</p>
                  <p className="text-[11px] text-white/30">
                    API 제한량이 소진되거나 네트워크 연결 오류일 수 있습니다. 날짜와 환경설정을 다시 점검해주세요.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const temp = selectedDate;
                    setSelectedDate("");
                    setTimeout(() => setSelectedDate(temp), 50);
                  }}
                  className="px-5 py-2.5 bg-[#ff4e00] hover:bg-[#e04500] text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all"
                >
                  재시도 RETRY
                </button>
              </motion.div>
            ) : processedList.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center bg-white/[0.02] border border-white/10 rounded-2xl px-6"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/10">
                  <Layers size={18} className="text-white/40" />
                </div>
                <h4 className="font-semibold text-white">조회된 영화가 없습니다</h4>
                <p className="text-xs text-white/40 mt-1">
                  {searchQuery ? "검색조건을 다르게 입력해보세요." : "선택하신 날짜의 박스오피스 정보가 존재하지 않습니다."}
                </p>
              </motion.div>
            ) : (
              /* Core Box Office Listings Grid */
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {processedList.map((item) => {
                  const rankNum = parseInt(item.rank, 10);
                  const isTop3 = rankNum <= 3;
                  
                  // Rank status badge rendering
                  const rankIntenNum = parseInt(item.rankInten || "0", 10);
                  const isNew = item.rankOldAndNew === "NEW";

                  return (
                    <motion.div
                      key={item.movieCd}
                      layoutId={`movie-${item.movieCd}`}
                      onClick={() => {
                        setDetailMovieCd(item.movieCd);
                        setDetailMovieNm(item.movieNm);
                      }}
                      className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 p-5 rounded-2xl cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between h-[165px] overflow-hidden"
                    >
                      {/* Decorative item left accent line for top rankings */}
                      {isTop3 && (
                        <div className={`absolute top-0 bottom-0 left-0 w-[3px] h-full ${
                          rankNum === 1 ? "bg-[#ff4e00]" : rankNum === 2 ? "bg-white/60" : "bg-red-900"
                        }`} />
                      )}

                      {/* Top Header Card Area */}
                      <div className="flex items-start gap-4">
                        
                        {/* Rank Badge Serif/Italic Style representing the theme */}
                        <div className="relative w-12 flex flex-col items-center justify-center shrink-0">
                          <span className={`text-[3.2rem] font-serif italic font-extrabold leading-none ${
                            rankNum === 1 
                              ? "text-[#ff4e00]" 
                              : rankNum === 2 
                              ? "text-white" 
                              : rankNum === 3 
                              ? "text-white/60"
                              : "text-white/20"
                          }`}>
                            {item.rank}
                          </span>
                        </div>

                        {/* Title and date */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-base text-white group-hover:text-[#ff4e00] transition-colors duration-200 truncate" title={item.movieNm}>
                              {item.movieNm}
                            </h4>
                            
                            {/* New Mark sticker */}
                            {isNew && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-black tracking-widest uppercase text-[#ff4e00] bg-[#ff4e00]/10 border border-[#ff4e00]/30 rounded-sm">
                                NEW
                              </span>
                            )}
                          </div>
                          
                          {/* Rank Shift Indicator */}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/40">
                            <span>개봉수: {item.openDt}</span>
                            <span className="text-white/10">|</span>
                            {/* Rank Shift badge */}
                            <span className="inline-flex items-center font-bold">
                              {isNew ? (
                                <span className="text-amber-500 font-extrabold text-[9px] uppercase tracking-wide">NEW RECORD</span>
                              ) : rankIntenNum > 0 ? (
                                <span className="text-emerald-500 inline-flex items-center gap-0.5 font-bold">
                                  <TrendingUp size={11} /> ▲{rankIntenNum}
                                </span>
                              ) : rankIntenNum < 0 ? (
                                <span className="text-rose-550 text-red-500 inline-flex items-center gap-0.5 font-bold">
                                  <TrendingDown size={11} /> ▼{Math.abs(rankIntenNum)}
                                </span>
                              ) : (
                                <span className="text-white/30 inline-flex items-center gap-0.5 font-normal">
                                  -
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom stats row */}
                      <div className="border-t border-white/5 pt-3.5 flex items-center justify-between gap-4 mt-3">
                        <div className="space-y-0.5">
                          <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">일일 관객</div>
                          <div className="text-xs font-mono font-semibold text-white/90">
                            {formatNumber(item.audiCnt)} 명
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">누적 관객</div>
                          <div className="text-xs font-mono font-semibold text-white/90">
                            {formatAudiAcc(item.audiAcc)}
                          </div>
                        </div>

                        {/* Progress visual feedback */}
                        <div className="space-y-0.5">
                          <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">일일 매출</div>
                          <div className="text-xs font-mono font-semibold text-[#ff4e00]">
                            {formatSalesAmt(item.salesAmt)}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-[#ff4e00] tracking-widest uppercase flex items-center gap-0.5 group-hover:translate-x-1 transition-transform self-center">
                          INFO <ChevronRight size={13} className="shrink-0" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Informative Footer Credits */}
        <footer className="text-center py-8 text-[11px] text-white/30 border-t border-white/10 max-w-2xl mx-auto space-y-1.5 pt-10">
          <p>
            영화 정보 데이터는 <span className="font-semibold text-white/50">영화진흥위원회 KOBISopenapi Portal</span>을 바탕으로 원격 실시간 동기화되어 공급됩니다.
          </p>
          <p className="font-mono text-[9px] tracking-wide text-white/20 uppercase">
            Sourced from KOBIS • Updated in real-time
          </p>
        </footer>

      </main>

      {/* Detail Modal Overlay when active */}
      {detailMovieCd && (
        <MovieDetailModal
          movieCd={detailMovieCd}
          movieNm={detailMovieNm}
          onClose={() => {
            setDetailMovieCd(null);
            setDetailMovieNm("");
          }}
        />
      )}

    </div>
  );
}
