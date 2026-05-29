export interface BoxOfficeItem {
  rnum: string;
  rank: string;
  rankInten: string;
  rankOldAndNew: "OLD" | "NEW" | string;
  movieCd: string;
  movieNm: string;
  openDt: string;
  salesAmt: string;
  salesShare: string;
  salesInten: string;
  salesChange: string;
  salesAcc: string;
  audiCnt: string;
  audiInten: string;
  audiChange: string;
  audiAcc: string;
  scrnCnt: string;
  showCnt: string;
}

export interface BoxOfficeResult {
  boxofficeType: string;
  showRange: string;
  dailyBoxOfficeList: BoxOfficeItem[];
}

export interface BoxOfficeResponse {
  boxOfficeResult?: BoxOfficeResult;
  faultInfo?: {
    message: string;
    errorCode: string;
  };
}

export interface Nation {
  nationNm: string;
}

export interface Genre {
  genreNm: string;
}

export interface Director {
  peopleNm: string;
  peopleNmEn: string;
}

export interface Actor {
  peopleNm: string;
  peopleNmEn: string;
  cast: string;
  castEn: string;
}

export interface Audit {
  auditNo: string;
  watchGradeNm: string;
}

export interface Company {
  companyCd: string;
  companyNm: string;
  companyNmEn: string;
  companyPartNm: string;
}

export interface MovieInfo {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  movieNmOg?: string;
  showTm: string;
  openDt: string;
  typeNm: string;
  nations: Nation[];
  genres: Genre[];
  directors: Director[];
  actors: Actor[];
  audits: Audit[];
  companys: Company[];
}

export interface MovieInfoResult {
  movieInfo: MovieInfo;
  source: string;
}

export interface MovieInfoResponse {
  movieInfoResult?: MovieInfoResult;
  faultInfo?: {
    message: string;
    errorCode: string;
  };
}
