import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "cfe93e051d504a34955f265d86a3692b";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // API: Get Daily Box Office
  app.get("/api/boxoffice", async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date || !/^\d{8}$/.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Expected YYYYMMDD." });
      }

      const url = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${date}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/boxoffice:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API: Get Movie Details
  app.get("/api/movie-info", async (req, res) => {
    try {
      const movieCd = req.query.movieCd as string;
      if (!movieCd) {
        return res.status(400).json({ error: "movieCd is required" });
      }

      const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`KOBIS API for movie info returned status ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/movie-info:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API: Generate Detailed Review using Gemini (under 100 Korean characters)
  app.post("/api/generate-review", async (req, res) => {
    try {
      const { briefReview, movieNm, genres } = req.body;
      if (!briefReview || !movieNm) {
        return res.status(400).json({ error: "briefReview and movieNm are required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(401).json({ 
          error: "Gemini API 키가 설정되지 않았습니다. AI Studio 우측 상단의 'Settings > Secrets' 메뉴에서 GEMINI_API_KEY 항목에 유효한 API 키를 추가해 주세요." 
        });
      }

      // Lazy initialization of GoogleGenAI
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `영화 정보와 관객의 간단한 한 줄 감상평을 바탕으로, 100자 미만(공백 포함)의 정돈되고 완성도 높은 한국어 상세 감상평(평론 또는 전문적인 리뷰)을 작성해 주세요.
사용자가 입력한 감상평의 긍정과 부정 뉘앙스를 확실히 담아 영화의 테마와 엮어 하나의 통일성 있고 설득력 있는 문장 혹은 두 문장으로 완성해야 합니다.
반드시 마침표를 찍고 완전한 문장으로 마무리해야 합니다.
출력할 시 부연설명이나 따옴표, 감상평 접두사 ("감상평:", 등) 일절 없이 오로지 완성된 본문만 직접 돌려주세요. 글자 수가 공백을 포함해 무조건 100자 미만인지 엄격히 확인하세요.

영화 제목: ${movieNm}
장르: ${genres || "알 수 없음"}
관객의 간단한 감상평: "${briefReview}"`;

      // Try to generate content with fallback
      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
      } catch (geminiError: any) {
        const errorMsg = geminiError.message || "";
        const errorStr = (errorMsg + " " + (geminiError.status || "") + " " + JSON.stringify(geminiError)).toLowerCase();
        
        // If the error indicates transient/503/high demand/unavailable status
        if (
          errorStr.includes("503") || 
          errorStr.includes("unavailable") || 
          errorStr.includes("demand") || 
          errorStr.includes("overloaded") ||
          errorStr.includes("limit")
        ) {
          console.warn("gemini-3.5-flash is under heavy demand, falling back to gemini-3.1-flash-lite: ", geminiError);
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: prompt,
            });
          } catch (fallbackError: any) {
            console.error("Fallback to gemini-3.1-flash-lite also failed: ", fallbackError);
            throw new Error("현재 영화 상세 평론 생성 서버에 과부하가 걸렸습니다. 잠시 후 다시 시도해 주세요.");
          }
        } else {
          throw geminiError;
        }
      }

      const generatedText = response.text?.trim() || "";
      res.json({ result: generatedText });
    } catch (error: any) {
      console.error("Error in /api/generate-review:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI review" });
    }
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || "development"})`);
  });
}

startServer().catch((err) => {
  console.error("Server startup failed:", err);
});
