"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Search, Sparkles, MapPin, BedDouble, Bath, School, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { parseSearchQuery, rankProperties, Property, RankedProperty } from "@/lib/matching";

const exampleQueries = [
  "2-bed in Lusail under 9k near schools furnished",
  "2-bed in Lusail under 8500",
  "family apartment in Lusail near schools",
  "1-bed in Lusail under 7k",
];

export default function QatarMatchPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [query, setQuery] = useState("2-bed in Lusail under 9k near schools furnished");
  const [results, setResults] = useState<RankedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const filters = useMemo(() => parseSearchQuery(query), [query]);

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("price", { ascending: true });

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
      setResults(rankProperties(cleaned, filters, query));
      setLoading(false);
    }

    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch() {
    setSearching(true);
    setTimeout(() => {
      setResults(rankProperties(properties, filters, query));
      setSearching(false);
    }, 250);
  }

  return (
    <main className="min-h-screen bg-[#fcfaf6] text-[#1f1a12]">
      <section className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <header className="flex flex-col gap-5 border-b border-[#eadfca] pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#c9a227] p-3 text-white">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">QatarMatch AI</h1>
              <p className="text-sm text-[#6e624d]">Natural language property matching for Qatar</p>
            </div>
          </div>
          <div className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-sm text-[#6e624d] shadow-sm">
            MVP connected to Supabase
          </div>
        </header>

        <div className="grid gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <section>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-4 py-2 text-sm text-[#6b5730] shadow-sm">
              <Sparkles size={16} />
              AI-powered property shortlist
            </div>

            <h2 className="max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl md:leading-[1.04]">
              Turn property intent into ranked matches.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5442]">
              Type what the buyer actually wants. QatarMatch converts the request into filters,
              searches your property database, ranks the best matches, and explains why.
            </p>

            <div className="mt-8 rounded-3xl border border-[#eadfca] bg-white p-5 shadow-[0_20px_60px_rgba(38,31,18,0.08)]">
              <label className="mb-3 block text-sm font-semibold text-[#3d3428]">
                Buyer request
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b6f2e]" size={20} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSearch();
                    }}
                    className="w-full rounded-2xl border border-[#ddcfab] bg-[#fffdf9] py-4 pl-12 pr-4 text-base outline-none transition focus:border-[#c9a227]"
                    placeholder="2-bed in Lusail under 9k near schools furnished"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || searching}
                  className="rounded-2xl bg-[#c9a227] px-6 py-4 font-semibold text-white shadow-sm transition hover:bg-[#af8b1f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searching ? "Matching..." : "Find matches"}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {exampleQueries.map((example) => (
                  <button
                    key={example}
                    onClick={() => {
                      setQuery(example);
                      setResults(rankProperties(properties, parseSearchQuery(example), example));
                    }}
                    className="rounded-full border border-[#eadfca] bg-[#fcfaf6] px-3 py-2 text-xs font-medium text-[#6e624d] transition hover:border-[#c9a227] hover:text-[#8b6f2e]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-3xl border border-[#eadfca] bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
              <div>
                <div className="font-semibold text-[#8b6f2e]">Parsed filters</div>
                <div className="mt-2 text-[#5f5442]">Area: {filters.area || "Any"}</div>
                <div className="text-[#5f5442]">Bedrooms: {filters.bedrooms || "Any"}</div>
              </div>
              <div>
                <div className="font-semibold text-[#8b6f2e]">Preferences</div>
                <div className="mt-2 text-[#5f5442]">Max price: {filters.maxPrice ? `${filters.maxPrice.toLocaleString()} QAR` : "Any"}</div>
                <div className="text-[#5f5442]">Furnished: {filters.furnished || "Any"}</div>
                <div className="text-[#5f5442]">Near schools: {filters.nearSchools ? "Yes" : "Any"}</div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#eadfca] bg-white p-5 shadow-[0_20px_60px_rgba(38,31,18,0.08)] md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8b6f2e]">
                  Ranked shortlist
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Top 5 matches</h3>
              </div>
              <div className="rounded-full bg-[#fbf3da] px-3 py-1 text-sm font-semibold text-[#8b6f2e]">
                {results.length} results
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 rounded-2xl bg-[#fcfaf6] p-5 text-[#5f5442]">
                <Loader2 className="animate-spin" size={20} />
                Loading properties from Supabase...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <div className="font-semibold">Supabase connection error</div>
                <p className="mt-2">{error}</p>
                <p className="mt-2">Check your `.env.local` values and ensure the `properties` table exists.</p>
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="rounded-2xl bg-[#fcfaf6] p-6 text-[#5f5442]">
                No matches found. Try broadening the request.
              </div>
            )}

            <div className="space-y-4">
              {!loading && !error && results.map((property, index) => (
                <article key={`${property.title}-${index}`} className="rounded-3xl border border-[#efe4cf] bg-[#fffdf9] p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#8b6f2e]">
                        <span>Rank #{index + 1}</span>
                        <span>•</span>
                        <span>{property.matchPercentage}% match</span>
                      </div>
                      <h4 className="mt-2 text-xl font-semibold tracking-tight">{property.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-[#5f5442]">{property.description}</p>
                    </div>
                    <div className="rounded-2xl bg-[#fbf3da] px-4 py-3 text-right">
                      <div className="text-lg font-semibold text-[#8b6f2e]">{Number(property.price).toLocaleString()}</div>
                      <div className="text-xs text-[#6e624d]">QAR / month</div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-[#5f5442] sm:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-2xl bg-white p-3">
                      <MapPin size={16} className="text-[#8b6f2e]" />
                      {property.area}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white p-3">
                      <BedDouble size={16} className="text-[#8b6f2e]" />
                      {property.bedrooms} beds
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white p-3">
                      <Bath size={16} className="text-[#8b6f2e]" />
                      {property.bathrooms} baths
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white p-3">
                      <School size={16} className="text-[#8b6f2e]" />
                      Schools: {property.near_schools || "No"}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#fcfaf6] p-4 text-sm leading-6 text-[#5f5442]">
                    <span className="font-semibold text-[#8b6f2e]">Why this matches: </span>
                    {property.explanation}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
