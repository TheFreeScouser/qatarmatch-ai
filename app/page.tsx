"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Property = {
  id?: number;
  title: string;
  area: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  furnished: string;
  description: string;
  near_schools?: string;
  image_url?: string;
};

type Filters = {
  area?: string;
  bedrooms?: number;
  maxPrice?: number;
  furnished?: string;
  nearSchools?: boolean;
};

type RankedProperty = Property & {
  score: number;
  matchPercent: number;
  reason: string;
};

export default function QatarMatchV1() {
  const WHATSAPP_NUMBER = "97471074505"; // Add number later, e.g. "974XXXXXXXX"

  const [properties, setProperties] = useState<Property[]>([]);
  const [query, setQuery] = useState("2-bed in Lusail under 9k near schools furnished");
  const [results, setResults] = useState<RankedProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<RankedProperty | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [moveTimeframe, setMoveTimeframe] = useState("Within 30 days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function parseQuery(input: string): Filters {
    const q = input.toLowerCase();
    const filters: Filters = {};

    if (q.includes("lusail")) filters.area = "Lusail";

    const bedMatch = q.match(/(\d+)\s*[- ]?bed/) || q.match(/(\d+)\s*br/);
    if (bedMatch) filters.bedrooms = Number(bedMatch[1]);

    const priceMatch =
      q.match(/under\s*(\d+(?:\.\d+)?)\s*k/) ||
      q.match(/below\s*(\d+(?:\.\d+)?)\s*k/) ||
      q.match(/under\s*(\d{4,5})/);

    if (priceMatch) {
      const value = Number(priceMatch[1]);
      filters.maxPrice = value < 100 ? value * 1000 : value;
    }

    if (q.includes("unfurnished")) filters.furnished = "No";
    else if (q.includes("furnished")) filters.furnished = "Yes";

    if (q.includes("school") || q.includes("family")) filters.nearSchools = true;

    return filters;
  }

  function rankProperties(list: Property[], filters: Filters): RankedProperty[] {
    return list
      .map((property) => {
        let score = 0;
        let maxScore = 0;
        const reasons: string[] = [];

        if (filters.area) {
          maxScore += 3;
          if (property.area?.toLowerCase() === filters.area.toLowerCase()) {
            score += 3;
            reasons.push(`located in ${property.area}`);
          }
        }

        if (filters.bedrooms) {
          maxScore += 3;
          if (Number(property.bedrooms) === filters.bedrooms) {
            score += 3;
            reasons.push(`${property.bedrooms}-bed match`);
          }
        }

        if (filters.maxPrice) {
          maxScore += 3;
          if (Number(property.price) <= filters.maxPrice) {
            score += 3;
            reasons.push(`within budget at ${Number(property.price).toLocaleString()} QAR`);
          }
        }

        if (filters.furnished) {
          maxScore += 2;
          if (property.furnished?.toLowerCase() === filters.furnished.toLowerCase()) {
            score += 2;
            reasons.push(filters.furnished === "Yes" ? "furnished" : "unfurnished");
          }
        }

        if (filters.nearSchools) {
          maxScore += 2;
          if (property.near_schools?.toLowerCase() === "yes") {
            score += 2;
            reasons.push("near schools");
          }
        }

        const matchPercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 75;

        let reason = "Recommend as a possible match based on available listing date"

          if (property.title.toLowerCase().includes("family")) {
    reason =
      "Strong family option because it combines the requested bedroom count with school proximity and a practical layout.";
  } else if (property.title.toLowerCase().includes("marina")) {
    reason =
      "Best lifestyle match for someone wanting Lusail access with a more premium marina-style location.";
  } else if (Number(property.price) <= 8000) {
    reason =
      "Best budget-conscious option because it keeps the user well under budget while still matching the core location request.";
  } else if (property.near_schools?.toLowerCase() === "yes") {
    reason =
      "Good fit for school-focused search because it prioritises family convenience and nearby education access.";
  } else if (property.furnished?.toLowerCase() === "yes") {
    reason =
      "Good move-in-ready option because it is furnished and matches the main property requirements.";
  } else if (reasons.length > 0) {
    reason = `Good overall match because it is ${reasons.join(", ")}.`;
  }

  return {
    ...property,
    score,
    matchPercent,
    reason,
  };
      })
      .sort((a, b) => b.score - a.score || a.price - b.price)
      .slice(0, 3);
  }

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase.from("properties").select("*");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const cleaned = (data || []).map((item: any) => ({
        ...item,
        price: Number(item.price),
        bedrooms: Number(item.bedrooms),
        bathrooms: Number(item.bathrooms),
      }));

      setProperties(cleaned);
      setResults(rankProperties(cleaned, parseQuery(query)));
      setLoading(false);
    }

    loadProperties();
  }, []);

  function handleSearch() {
    const filters = parseQuery(query);
    setResults(rankProperties(properties, filters));
    setSelectedProperty(null);
  }

  const isQualifiedLead = useMemo(() => {
    const filters = parseQuery(query);

    return Boolean(
      filters.area &&
        filters.maxPrice &&
        moveTimeframe === "Within 30 days" &&
        selectedProperty &&
        leadName &&
        leadPhone
    );
  }, [query, moveTimeframe, selectedProperty, leadName, leadPhone]);

  function buildWhatsAppLink() {
    if (!selectedProperty) return "#";

  const message = `
  New QatarMatch Viewing Request

  Customer name: ${leadName || "Not provided"}
 Customer phone: ${leadPhone ? `+974 ${leadPhone}` : "Not provided"}
  Move timeframe: ${moveTimeframe}
  Lead quality: ${isQualifiedLead ? "Qualified lead" : "Needs follow-up"}

User request:
${query}

Selected property:
${selectedProperty.title}
${selectedProperty.area}
${selectedProperty.price.toLocaleString()} QAR
${selectedProperty.bedrooms} bed / ${selectedProperty.bathrooms} bath
Furnished: ${selectedProperty.furnished}
Near schools: ${selectedProperty.near_schools || "No"}

Why QatarMatch chose this:
${selectedProperty.reason}
`.trim();

    const encoded = encodeURIComponent(message);

    if (WHATSAPP_NUMBER) {
      return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    }

    return `https://wa.me/?text=${encoded}`;
  }

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#1f1a12]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="border-b border-[#eadfca] pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#8b6f2e]">
            QatarMatch AI
          </p>

        <p className="mt-2 inline-flex rounded-full bg-[#fbf3da] px-3 py-1 text-xs font-semibold text-[#8b6f2e]">
          Live V1 demo · AI-powered real estate lead conversion
        </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Zero-browsing property decisions.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f5442]">
            Users ask for what they want. QatarMatch returns the best matches instantly,
            captures the lead, and pushes the viewing request to WhatsApp.
          </p>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="rounded-3xl border border-[#eadfca] bg-white p-6 shadow-sm">
              <label className="text-sm font-semibold text-[#3d3428]">
                Ask anything about renting in Qatar
              </label>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="mt-3 w-full rounded-2xl border border-[#ddcfab] bg-[#fffdf9] p-4 text-base outline-none focus:border-[#c9a227]"
                placeholder="2-bed in Lusail under 9k near schools furnished"
              />

              <button
                onClick={handleSearch}
                className="mt-4 w-full rounded-2xl bg-[#c9a227] px-6 py-4 font-semibold text-white hover:bg-[#af8b1f]"
              >
                Get instant matches
              </button>

              
            </div>

            {selectedProperty && (
              <div className="mt-6 rounded-3xl border border-[#eadfca] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight">Book viewing</h2>
                <p className="mt-2 text-sm text-[#5f5442]">
                  Your details go directly to the agent for this property only.
                </p>

                <div className="mt-5 grid gap-4">
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="rounded-2xl border border-[#ddcfab] bg-[#fffdf9] p-4 outline-none focus:border-[#c9a227]"
                    placeholder="Name"
                  />

                  <div className="flex overflow-hidden rounded-2xl border border-[#ddcfab] bg-[#fffdf9] focus-within:border-[#c9a227]">
                    <div className="flex items-center border-r border-[#ddcfab] bg-[#fbf3da] px-4 text-sm font-semibold text-[#8b6f2e]">
                      +974
                    </div>
                    <input
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full bg-transparent p-4 outline-none"
                      placeholder="WhatsApp number"
                    />
                  </div>

                  <p className="text-xs leading-5 text-[#6b604d]">
                    We only share your details with the agent for this property.
                  </p>

                  <select
                    value={moveTimeframe}
                    onChange={(e) => setMoveTimeframe(e.target.value)}
                    className="rounded-2xl border border-[#ddcfab] bg-[#fffdf9] p-4 outline-none focus:border-[#c9a227]"
                  >
                    <option>Within 30 days</option>
                    <option>1–3 months</option>
                    <option>Just researching</option>
                  </select>

                  <a
                  href={buildWhatsAppLink()}
                  target="_blank"
                  className="rounded-2xl bg-[#BA7517] px-6 py-4 text-center font-semibold text-white transition hover:bg-[#9f6112]"
                >
                  Send viewing request
                </a>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#eadfca] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b6f2e]">
                  Instant shortlist
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Top 3 matches
                </h2>
                <p className="mt-2 text-sm text-[#6b604d]">
                  {properties.length} properties searched. {results.length} best matches found.
                </p>
              </div>
              <span className="rounded-full bg-[#fbf3da] px-3 py-1 text-sm font-semibold text-[#8b6f2e]">
                Fast response
              </span>
            </div>

            {loading && <p className="text-[#5f5442]">Loading properties...</p>}

            {error && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <p className="text-[#5f5442]">No matches found.</p>
            )}

            <div className="space-y-4">
            {results.map((property, index) => (
              <article
                key={`${property.title}-${index}`}
                className={`rounded-3xl border p-5 transition ${
                  selectedProperty?.title === property.title
                    ? "border-[#c9a227] bg-[#fff9e8]"
                    : "border-[#efe4cf] bg-[#fffdf9]"
                }`}
              >
                <div className="mb-5 overflow-hidden rounded-2xl bg-[#f4efe3]">
                  <img
                    src={
                      property.image_url ||
                      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop"
                    }
                    alt={property.title}
                    className="h-52 w-full object-cover"
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#8b6f2e]">
                      Rank #{index + 1} · QatarMatch Score™ {property.matchPercent}%
                    </p>

                    <h3 className="mt-2 text-xl font-semibold">
                      {property.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#5f5442]">
                      {property.description}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#fbf3da] px-4 py-3 text-right">
                    <p className="text-lg font-semibold text-[#8b6f2e]">
                      {property.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-[#6e624d]">QAR / month</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-[#5f5442] sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3">
                    {property.area}
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    {property.bedrooms} bed
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    {property.bathrooms} bath
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    {property.near_schools?.toLowerCase() === "yes"
                      ? "5 min drive to nearby schools"
                      : "School distance not listed"}
                  </div>
                </div>

                <p className="mt-4 rounded-2xl bg-[#fcfaf6] p-4 text-sm leading-6 text-[#5f5442]">
                  <span className="font-semibold text-[#8b6f2e]">
                    Why QatarMatch chose this:{" "}
                  </span>
                  {property.reason}
                </p>

                <button
                  onClick={() => setSelectedProperty(property)}
                  className="mt-4 w-full rounded-2xl border border-[#BA7517] px-5 py-3 font-semibold text-[#BA7517] hover:bg-[#fbf3da]"
                >
                  Book viewing
                </button>
              </article>
            ))}
          </div>
          </div>
        </section>
      </div>
    </main>
  );
}