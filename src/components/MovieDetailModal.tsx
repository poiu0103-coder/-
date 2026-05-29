import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Film, 
  Clock, 
  Calendar, 
  Globe, 
  Users, 
  Award, 
  Building, 
  Sparkles,
  Link2,
  Quote,
  Clipboard,
  Check,
  MessageSquare,
  Loader2
} from "lucide-react";
import { MovieInfo, MovieInfoResponse } from "../types";

interface MovieDetailModalProps {
  movieCd: string;
  movieNm: string;
  onClose: () => void;
}

export default function MovieDetailModal({ movieCd, movieNm, onClose }: MovieDetailModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);

  // States for AI review maker
  const [briefReview, setBriefReview] = useState<string>("");
  const [generatedReview, setGeneratedReview] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Handle generation of deep review from short opinion using Gemini 3.5
  const handleGenerateReview = async () => {
    if (!briefReview.trim() || !movieInfo) return;
    
    setGenerating(true);
    setGenerationError(null);
    setGeneratedReview("");
    setCopied(false);

    try {
      const genresStr = movieInfo.genres.map(g => g.genreNm).join(", ");
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          briefReview: briefReview.trim(),
          movieNm: movieInfo.movieNm,
          genres: genresStr,
        }),
      });

      if (!response.ok) {
        throw new Error("상세 감상평 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedReview(data.result);
    } catch (err: any) {
      setGenerationError(err.message || "오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedReview) return;
    navigator.clipboard.writeText(generatedReview)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchMovieDetail() {
      try {
        const response = await fetch(`/api/movie-info?movieCd=${movieCd}`);
        if (!response.ok) {
          throw new Error("영화 정보를 불러오는데 실패했습니다.");
        }
        const data: MovieInfoResponse = await response.json();
        
        if (data.faultInfo) {
          throw new Error(data.faultInfo.message);
        }

        if (data.movieInfoResult?.movieInfo) {
          if (isMounted) {
            setMovieInfo(data.movieInfoResult.movieInfo);
          }
        } else {
          throw new Error("영화 상세 정보 노출 오류가 발생했습니다.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "정보를 가져오는 중 실패했습니다.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (movieCd) {
      fetchMovieDetail();
    }

    return () => {
      isMounted = false;
    };
  }, [movieCd]);

  // Format release date YYYY-MM-DD
  const formatReleaseDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 8) return dateStr || "정보 없음";
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  };

  return (
    <AnimatePresence>
      <div 
        id="modal-container"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop overlay */}
        <motion.div
          id="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md"
        />

        {/* Modal Sheet */}
        <motion.div
          id="modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[85vh] z-10"
        >
          {/* Header styling */}
          <div className="p-6 bg-gradient-to-r from-[#0d0d0d] via-[#121212] to-[#0d0d0d] border-b border-white/10 text-white flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#ff4e00]/10 text-[#ff4e00] border border-[#ff4e00]/20 uppercase tracking-widest">
                <Film size={11} /> Movie Code {movieCd}
              </span>
              <h3 className="text-xl md:text-2xl font-light tracking-tight mt-2 text-white">{movieNm}</h3>
              {movieInfo?.movieNmEn && (
                <p className="text-sm text-white/50 font-medium tracking-normal">
                  {movieInfo.movieNmEn} {movieInfo.openDt && `(${movieInfo.openDt.substring(0, 4)})`}
                </p>
              )}
            </div>
            <button
              id="close-modal-button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors duration-150 outline-none focus:ring-1 focus:ring-[#ff4e00]"
              aria-label="모달 닫기"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#ff4e00] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs tracking-wider uppercase font-bold text-[#ff4e00]">
                  Loading Metadata Securely...
                </p>
              </div>
            ) : error ? (
              <div className="py-12 px-4 rounded-xl bg-red-950/20 text-red-400 border border-red-900/30 flex flex-col items-center justify-center text-center space-y-3">
                <p className="font-semibold text-lg">오류가 발생했습니다</p>
                <p className="text-sm text-red-300/80">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 text-xs font-semibold bg-red-900/35 hover:bg-red-900/50 rounded-lg transition-colors"
                >
                  돌아가기
                </button>
              </div>
            ) : movieInfo ? (
              <div className="space-y-6 text-[#e0e0e0]">
                {/* Meta Summary Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-3">
                    <Clock className="text-[#ff4e00] shrink-0" size={16} />
                    <div>
                      <div className="text-[9px] text-[#ff4e00] font-bold uppercase tracking-widest">상영 시간</div>
                      <div className="text-sm font-semibold text-white">{movieInfo.showTm ? `${movieInfo.showTm}분` : "정보 없음"}</div>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-3">
                    <Calendar className="text-[#ff4e00] shrink-0" size={16} />
                    <div>
                      <div className="text-[9px] text-[#ff4e00] font-bold uppercase tracking-widest">개봉일</div>
                      <div className="text-sm font-semibold text-white">{formatReleaseDate(movieInfo.openDt)}</div>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-3">
                    <Globe className="text-[#ff4e00] shrink-0" size={16} />
                    <div>
                      <div className="text-[9px] text-[#ff4e00] font-bold uppercase tracking-widest">제작 국가</div>
                      <div className="text-sm font-semibold text-white truncate max-w-[100px]" title={movieInfo.nations.map(n => n.nationNm).join(", ")}>
                        {movieInfo.nations.map(n => n.nationNm).join(", ") || "정보 없음"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center gap-3">
                    <Award className="text-[#ff4e00] shrink-0" size={16} />
                    <div>
                      <div className="text-[9px] text-[#ff4e00] font-bold uppercase tracking-widest">관람 등급</div>
                      <div className="text-sm font-semibold text-white truncate max-w-[100px]" title={movieInfo.audits.map(a => a.watchGradeNm).join(", ")}>
                        {movieInfo.audits.map(a => a.watchGradeNm).join(", ") || "정보 없음"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Genres & Types Info */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">장르 및 영화 유형</div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 text-white/70">
                      유형: {movieInfo.typeNm || "장편"}
                    </span>
                    {movieInfo.genres.map((g, index) => (
                      <span 
                        key={index} 
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#ff4e00]/10 text-[#ff4e00] border-l-2 border-[#ff4e00]/30"
                      >
                        {g.genreNm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Directors */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#ff4e00]" /> 감독
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {movieInfo.directors.length > 0 ? (
                      movieInfo.directors.map((d, index) => (
                        <div key={index} className="flex flex-col p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <span className="font-semibold text-sm text-white">{d.peopleNm}</span>
                          {d.peopleNmEn && <span className="text-xs text-white/40 mt-0.5">{d.peopleNmEn}</span>}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/40">등록된 감독 정보가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* Cast / Actors */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={12} className="text-[#ff4e00]" /> 출연진
                  </div>
                  {movieInfo.actors.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {movieInfo.actors.slice(0, 12).map((actor, index) => (
                        <div 
                          key={index} 
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between"
                        >
                          <span className="text-sm font-semibold text-white">{actor.peopleNm}</span>
                          {actor.cast ? (
                            <span className="text-[11px] text-[#ff4e00] font-bold mt-1 truncate">
                              역: {actor.cast}
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/30 mt-1 italic">출연</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/40">배우 정보가 제공되지 않습니다.</p>
                  )}
                  {movieInfo.actors.length > 12 && (
                    <p className="text-[10px] text-right text-white/30">
                      그 외 {movieInfo.actors.length - 12}명의 배우가 더 출연했습니다.
                    </p>
                  )}
                </div>

                {/* Companies & Production/Distribution */}
                {movieInfo.companys && movieInfo.companys.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <Building size={12} className="text-white/40" /> 참여 공사/배급사
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {movieInfo.companys.slice(0, 5).map((comp, index) => (
                        <span 
                          key={index} 
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 text-white/70 border border-white/5"
                        >
                          {comp.companyNm} <span className="text-[10px] text-white/40 font-normal">({comp.companyPartNm})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Review Maker */}
                <div id="ai-review-maker-container" className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 shadow-inner mt-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#ff4e00]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">AI 감상평 메이커</span>
                    </div>
                    <span className="text-[9px] text-[#ff4e00]/80 font-bold bg-[#ff4e00]/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Gemini PRO
                    </span>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed">
                    이 영화에 대한 짧은 평(예: "웅장한 스케일에 압도되었다")을 남겨주시면, AI가 이를 바탕으로 100자 가량의 정돈되고 깊이 있는 상세 평론 구절을 완성해 드립니다.
                  </p>

                  <div className="space-y-2.5">
                    <textarea
                      id="brief-review-input"
                      value={briefReview}
                      onChange={(e) => setBriefReview(e.target.value)}
                      placeholder="영화에 대한 간단한 생각이나 느낌을 적어보세요..."
                      maxLength={150}
                      disabled={generating}
                      className="w-full h-18 bg-white/[0.01] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-[#ff4e00]/50 focus:ring-1 focus:ring-[#ff4e00]/30 outline-none resize-none transition-all duration-200"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/20 font-mono">
                        {briefReview.length} / 150자
                      </span>
                      <button
                        id="generate-review-button"
                        onClick={handleGenerateReview}
                        disabled={generating || !briefReview.trim()}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 shadow-md ${
                          generating || !briefReview.trim()
                            ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                            : "bg-[#ff4e00] hover:bg-[#e04500] text-black hover:shadow-lg active:scale-95"
                        }`}
                      >
                        {generating ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-black" />
                            감상평 다듬는 중...
                          </>
                        ) : (
                          <>
                            <MessageSquare size={13} />
                            상세 감상평 작성
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {generationError && (
                    <p className="text-xs text-red-400/90 font-medium bg-red-950/10 p-2.5 rounded-lg border border-red-900/20">
                      {generationError}
                    </p>
                  )}

                  {generatedReview && (
                    <motion.div 
                      id="generated-review-box"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative p-4 rounded-xl bg-[#ff4e00]/5 border-l-2 border-[#ff4e00] space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <Quote size={14} className="text-[#ff4e00] mt-0.5 shrink-0 opacity-60" />
                        <p className="text-xs text-white/90 leading-relaxed font-semibold select-all">
                          {generatedReview}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-1">
                        <span className="text-[10px] text-[#ff4e00]/70 font-mono">
                          공백 포함 {generatedReview.length}자 (100자 미만)
                        </span>
                        <button
                          id="copy-review-button"
                          onClick={handleCopy}
                          className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-white hover:text-[#ff4e00] hover:bg-white/5 rounded transition-all duration-150"
                        >
                          {copied ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-400">복사 완료</span>
                            </>
                          ) : (
                            <>
                              <Clipboard size={11} />
                              <span>복사하기</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-white/30 text-sm">정보를 불어오는데 실패했습니다.</div>
            )}
          </div>

          {/* Footer controls */}
          <div className="p-4 bg-[#0d0d0d] border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between items-center">
            <span className="text-[10px] text-white/30 font-mono">
              Korean Film Council Portal API Source Info
            </span>
            <div className="flex gap-2">
              <a
                href={`https://search.naver.com/search.naver?query=영화 ${encodeURIComponent(movieNm)}`}
                target="_blank"
                rel="noreferrer"
                id="search-portal-button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#ff4e00] hover:bg-[#ff4e00]/10 rounded-lg border border-[#ff4e00]/20 transition-all duration-150"
              >
                네이버 검색 피드 <Link2 size={13} />
              </a>
              <button
                id="modal-close-button-bottom"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold bg-[#ff4e00] hover:bg-[#e04500] text-black rounded-lg transition-colors shadow-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
