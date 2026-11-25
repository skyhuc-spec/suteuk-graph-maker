import { RegionMapping, ConfidenceLevel } from '../types';

export interface StandardRegionDef {
  code: string;
  standardName: string;
  aliases: string[];
  regionType: 'korea_sido' | 'korea_sigungu' | 'world_country' | 'continent';
}

export const KOREA_SIDO_LIST: StandardRegionDef[] = [
  { code: '11', standardName: '서울특별시', aliases: ['서울', '서울시', '수도서울'], regionType: 'korea_sido' },
  { code: '26', standardName: '부산광역시', aliases: ['부산', '부산시'], regionType: 'korea_sido' },
  { code: '27', standardName: '대구광역시', aliases: ['대구', '대구시'], regionType: 'korea_sido' },
  { code: '28', standardName: '인천광역시', aliases: ['인천', '인천시'], regionType: 'korea_sido' },
  { code: '29', standardName: '광주광역시', aliases: ['광주', '광주시'], regionType: 'korea_sido' },
  { code: '30', standardName: '대전광역시', aliases: ['대전', '대전시'], regionType: 'korea_sido' },
  { code: '31', standardName: '울산광역시', aliases: ['울산', '울산시'], regionType: 'korea_sido' },
  { code: '36', standardName: '세종특별자치시', aliases: ['세종', '세종시'], regionType: 'korea_sido' },
  { code: '41', standardName: '경기도', aliases: ['경기'], regionType: 'korea_sido' },
  { code: '51', standardName: '강원특별자치도', aliases: ['강원', '강원도'], regionType: 'korea_sido' },
  { code: '43', standardName: '충청북도', aliases: ['충북'], regionType: 'korea_sido' },
  { code: '44', standardName: '충청남도', aliases: ['충남'], regionType: 'korea_sido' },
  { code: '52', standardName: '전북특별자치도', aliases: ['전북', '전라북도'], regionType: 'korea_sido' },
  { code: '46', standardName: '전라남도', aliases: ['전남'], regionType: 'korea_sido' },
  { code: '47', standardName: '경상북도', aliases: ['경북'], regionType: 'korea_sido' },
  { code: '48', standardName: '경상남도', aliases: ['경남'], regionType: 'korea_sido' },
  { code: '50', standardName: '제주특별자치도', aliases: ['제주', '제주도'], regionType: 'korea_sido' },
];

export const KOREA_SIGUNGU_LIST: StandardRegionDef[] = [
  { code: '41110', standardName: '수원시', aliases: ['수원'], regionType: 'korea_sigungu' },
  { code: '41130', standardName: '성남시', aliases: ['성남', '분당'], regionType: 'korea_sigungu' },
  { code: '41280', standardName: '고양시', aliases: ['고양', '일산'], regionType: 'korea_sigungu' },
  { code: '41460', standardName: '용인시', aliases: ['용인'], regionType: 'korea_sigungu' },
  { code: '48120', standardName: '창원시', aliases: ['창원', '마산', '진해'], regionType: 'korea_sigungu' },
  { code: '43110', standardName: '청주시', aliases: ['청주'], regionType: 'korea_sigungu' },
  { code: '52110', standardName: '전주시', aliases: ['전주'], regionType: 'korea_sigungu' },
  { code: '44130', standardName: '천안시', aliases: ['천안'], regionType: 'korea_sigungu' },
  { code: '47110', standardName: '포항시', aliases: ['포항'], regionType: 'korea_sigungu' },
  { code: '48250', standardName: '김해시', aliases: ['김해'], regionType: 'korea_sigungu' },
  { code: '47190', standardName: '구미시', aliases: ['구미'], regionType: 'korea_sigungu' },
  { code: '48310', standardName: '거제시', aliases: ['거제'], regionType: 'korea_sigungu' },
  { code: '46130', standardName: '여수시', aliases: ['여수'], regionType: 'korea_sigungu' },
  { code: '46150', standardName: '순천시', aliases: ['순천'], regionType: 'korea_sigungu' },
  { code: '51110', standardName: '춘천시', aliases: ['춘천'], regionType: 'korea_sigungu' },
  { code: '51130', standardName: '원주시', aliases: ['원주'], regionType: 'korea_sigungu' },
  { code: '51150', standardName: '강릉시', aliases: ['강릉'], regionType: 'korea_sigungu' },
];

export const WORLD_COUNTRIES_LIST: StandardRegionDef[] = [
  { code: 'KOR', standardName: '대한민국', aliases: ['한국', '남한', 'Korea', 'South Korea'], regionType: 'world_country' },
  { code: 'USA', standardName: '미국', aliases: ['미합중국', '미국(USA)', 'United States', 'US'], regionType: 'world_country' },
  { code: 'CHN', standardName: '중국', aliases: ['중화인민공화국', '중국(PRC)', 'China'], regionType: 'world_country' },
  { code: 'JPN', standardName: '일본', aliases: ['Japan'], regionType: 'world_country' },
  { code: 'DEU', standardName: '독일', aliases: ['Germany', '독일연방'], regionType: 'world_country' },
  { code: 'GBR', standardName: '영국', aliases: ['United Kingdom', 'UK', '잉글랜드'], regionType: 'world_country' },
  { code: 'FRA', standardName: '프랑스', aliases: ['France'], regionType: 'world_country' },
  { code: 'RUS', standardName: '러시아', aliases: ['러시아연방', 'Russia', '소련'], regionType: 'world_country' },
  { code: 'IND', standardName: '인도', aliases: ['India'], regionType: 'world_country' },
  { code: 'BRA', standardName: '브라질', aliases: ['Brazil'], regionType: 'world_country' },
  { code: 'CAN', standardName: '캐나다', aliases: ['Canada'], regionType: 'world_country' },
  { code: 'AUS', standardName: '오스트레일리아', aliases: ['호주', 'Australia'], regionType: 'world_country' },
  { code: 'ITA', standardName: '이탈리아', aliases: ['Italy'], regionType: 'world_country' },
  { code: 'VNM', standardName: '베트남', aliases: ['Vietnam'], regionType: 'world_country' },
  { code: 'IDN', standardName: '인도네시아', aliases: ['Indonesia'], regionType: 'world_country' },
  { code: 'SAU', standardName: '사우디아라비아', aliases: ['사우디', 'Saudi Arabia'], regionType: 'world_country' },
  { code: 'ZAF', standardName: '남아프리카공화국', aliases: ['남아공', 'South Africa'], regionType: 'world_country' },
  { code: 'MEX', standardName: '멕시코', aliases: ['Mexico'], regionType: 'world_country' },
  { code: 'TUR', standardName: '튀르키예', aliases: ['터키', 'Turkey'], regionType: 'world_country' },
  { code: 'EGY', standardName: '이집트', aliases: ['Egypt'], regionType: 'world_country' },
  { code: 'NGA', standardName: '나이지리아', aliases: ['Nigeria'], regionType: 'world_country' },
  { code: 'ARG', standardName: '아르헨티나', aliases: ['Argentina'], regionType: 'world_country' },
];

export const CONTINENTS_LIST: StandardRegionDef[] = [
  { code: 'ASIA', standardName: '아시아', aliases: ['아시아 대륙', 'Asia'], regionType: 'continent' },
  { code: 'EUROPE', standardName: '유럽', aliases: ['유럽 대륙', 'Europe'], regionType: 'continent' },
  { code: 'AFRICA', standardName: '아프리카', aliases: ['아프리카 대륙', 'Africa'], regionType: 'continent' },
  { code: 'NAMERICA', standardName: '북아메리카', aliases: ['북미', 'North America'], regionType: 'continent' },
  { code: 'SAMERICA', standardName: '남아메리카', aliases: ['남미', 'South America'], regionType: 'continent' },
  { code: 'OCEANIA', standardName: '오세아니아', aliases: ['대양주', 'Oceania'], regionType: 'continent' },
];

export const ALL_STANDARD_REGIONS: StandardRegionDef[] = [
  ...KOREA_SIDO_LIST,
  ...KOREA_SIGUNGU_LIST,
  ...WORLD_COUNTRIES_LIST,
  ...CONTINENTS_LIST,
];

/**
 * Normalizes an informal/textbook region name to official standard name and code
 */
export function normalizeRegionName(rawName: string): RegionMapping {
  const trimmed = rawName.trim();
  const clean = trimmed.replace(/[\(\)\[\]\s]/g, '').toLowerCase();

  // 1. Exact match with standardName
  for (const reg of ALL_STANDARD_REGIONS) {
    if (reg.standardName === trimmed || reg.standardName.toLowerCase() === clean) {
      return {
        originalName: rawName,
        standardName: reg.standardName,
        code: reg.code,
        regionType: reg.regionType,
        confidence: 'high',
        isVerified: true
      };
    }
  }

  // 2. Alias match
  for (const reg of ALL_STANDARD_REGIONS) {
    for (const alias of reg.aliases) {
      const cleanAlias = alias.replace(/[\(\)\[\]\s]/g, '').toLowerCase();
      if (clean === cleanAlias || clean.includes(cleanAlias) || cleanAlias.includes(clean)) {
        return {
          originalName: rawName,
          standardName: reg.standardName,
          code: reg.code,
          regionType: reg.regionType,
          confidence: clean === cleanAlias ? 'high' : 'medium',
          isVerified: false
        };
      }
    }
  }

  // 3. Unknown or unclassified
  return {
    originalName: rawName,
    standardName: rawName,
    code: 'UNKNOWN',
    regionType: 'unknown',
    confidence: 'manual',
    isVerified: false
  };
}

/**
 * Batch normalize all categories
 */
export function batchNormalizeRegions(categories: string[]): Record<string, RegionMapping> {
  const mappings: Record<string, RegionMapping> = {};
  for (const cat of categories) {
    mappings[cat] = normalizeRegionName(cat);
  }
  return mappings;
}
