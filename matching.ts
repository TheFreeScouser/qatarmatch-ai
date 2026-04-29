export type Property = {
  id?: number;
  title: string;
  area: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  furnished: string;
  lat?: number;
  lng?: number;
  description: string;
  near_schools?: string;
};

export type SearchFilters = {
  area?: string;
  bedrooms?: number;
  maxPrice?: number;
  furnished?: "Yes" | "No";
  nearSchools?: boolean;
};

export type RankedProperty = Property & {
  score: number;
  matchPercentage: number;
  explanation: string;
};

function normalise(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function parseSearchQuery(query: string): SearchFilters {
  const q = query.toLowerCase();
  const filters: SearchFilters = {};

  if (q.includes("lusail")) filters.area = "Lusail";

  const bedroomMatch =
    q.match(/(\d+)\s*[- ]?bed/) ||
    q.match(/(\d+)\s*bedroom/) ||
    q.match(/(\d+)\s*br/);

  if (bedroomMatch) filters.bedrooms = Number(bedroomMatch[1]);

  const priceMatch =
    q.match(/under\s*(\d+(?:\.\d+)?)\s*k/) ||
    q.match(/below\s*(\d+(?:\.\d+)?)\s*k/) ||
    q.match(/max\s*(\d+(?:\.\d+)?)\s*k/) ||
    q.match(/under\s*(\d{4,5})/) ||
    q.match(/below\s*(\d{4,5})/);

  if (priceMatch) {
    const value = Number(priceMatch[1]);
    filters.maxPrice = value < 100 ? value * 1000 : value;
  }

  if (q.includes("unfurnished")) filters.furnished = "No";
  else if (q.includes("furnished")) filters.furnished = "Yes";

  if (q.includes("school") || q.includes("schools") || q.includes("family")) {
    filters.nearSchools = true;
  }

  return filters;
}

export function rankProperties(
  properties: Property[],
  filters: SearchFilters,
  originalQuery: string
): RankedProperty[] {
  const ranked = properties.map((property) => {
    let score = 0;
    const reasons: string[] = [];

    if (filters.area && normalise(property.area) === normalise(filters.area)) {
      score += 3;
      reasons.push(`located in ${property.area}`);
    }

    if (filters.bedrooms && Number(property.bedrooms) === filters.bedrooms) {
      score += 3;
      reasons.push(`${property.bedrooms}-bed match`);
    }

    if (filters.maxPrice && Number(property.price) <= filters.maxPrice) {
      score += 3;
      reasons.push(`within budget at ${Number(property.price).toLocaleString()} QAR`);
    }

    if (filters.furnished && normalise(property.furnished) === normalise(filters.furnished)) {
      score += 2;
      reasons.push(filters.furnished === "Yes" ? "furnished" : "unfurnished");
    }

    if (filters.nearSchools && normalise(property.near_schools) === "yes") {
      score += 2;
      reasons.push("near schools");
    }

    const maxScore =
      (filters.area ? 3 : 0) +
      (filters.bedrooms ? 3 : 0) +
      (filters.maxPrice ? 3 : 0) +
      (filters.furnished ? 2 : 0) +
      (filters.nearSchools ? 2 : 0);

    const matchPercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 75;

    const explanation =
      reasons.length > 0
        ? `Good match because it is ${reasons.join(", ")}.`
        : `Potential match for: "${originalQuery}".`;

    return { ...property, score, matchPercentage, explanation };
  });

  return ranked.sort((a, b) => b.score - a.score || a.price - b.price).slice(0, 5);
}
