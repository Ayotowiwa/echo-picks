import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { category, title } = await req.json();

    if (!category || !title) {
      return NextResponse.json(
        { error: "Category and title are required" },
        { status: 400 }
      );
    }

    
    let cat = category.toLowerCase().trim();
    if (["movies", "film", "films"].includes(cat)) cat = "movie";
    if (["tv show", "shows", "series"].includes(cat)) cat = "tv";
    if (["books", "novel", "novels"].includes(cat)) cat = "book";
    if (["games", "video game", "video games"].includes(cat)) cat = "game";
    if (["animes", "manga"].includes(cat)) cat = "anime";

    // ✅ Setup Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `User likes "${title}". Suggest 5 similar ${cat}s with short explanations of why each is similar.
Respond ONLY in valid JSON array with objects: { "title": string, "reason": string }.
Do not include Markdown formatting.`;

    let rawText: string;
    try {
      const result = await model.generateContent([prompt]);
      rawText = result.response.text();
      console.log("Gemini raw response:", rawText);
    } catch (err) {
      console.error("Gemini API error:", err);
      // Fallback: use API searches (TMDb, Google Books, RAWG, AniList) to produce recommendations
      async function fallbackSearch(cat: string, query: string) {
        const out: any[] = [];
        try {
          if (cat === "movie" || cat === "tv") {
            const TMDB_API_KEY = process.env.TMDB_API_KEY;
            if (!TMDB_API_KEY) return out;
            // search for the title to get an ID, then fetch similar
            const searchUrl = `https://api.themoviedb.org/3/search/${cat === "tv" ? "tv" : "movie"}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
              query
            )}`;
            const sres = await fetch(searchUrl);
            const sdata = await sres.json();
            if (sdata.results?.length > 0) {
              const id = sdata.results[0].id;
              const similarUrl = `https://api.themoviedb.org/3/${cat === "tv" ? "tv" : "movie"}/${id}/similar?api_key=${TMDB_API_KEY}`;
              const simRes = await fetch(similarUrl);
              const simData = await simRes.json();
              const picks = (simData.results || []).slice(0, 5);
              for (const item of picks) {
                out.push({
                  title: item.title || item.name,
                  reason: `Matches by genre and audience (TMDb)`,
                  poster: item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : null,
                  year: (item.release_date || item.first_air_date || "").slice(0, 4),
                  rating: item.vote_average,
                  description: item.overview,
                });
              }
            }
          } else if (cat === "book") {
            const gbRes = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
                query
              )}`
            );
            const gbData = await gbRes.json();
            const items = (gbData.items || []).slice(0, 5);
            for (const it of items) {
              const v = it.volumeInfo;
              out.push({
                title: v.title,
                reason: `Similar topic/author (Google Books)`,
                poster: v.imageLinks?.thumbnail || null,
                year: v.publishedDate?.slice(0, 4) || null,
                rating: v.averageRating || null,
                description: v.description || null,
              });
            }
          } else if (cat === "game") {
            const RAWG_API_KEY = process.env.RAWG_API_KEY;
            const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}`;
            const rres = await fetch(url);
            const rdata = await rres.json();
            const items = (rdata.results || []).slice(0, 5);
            for (const item of items) {
              out.push({
                title: item.name,
                reason: `Similar gameplay/genre (RAWG)`,
                poster: item.background_image || null,
                year: item.released?.slice(0, 4) || null,
                rating: item.rating || null,
                description: null,
              });
            }
          } else if (cat === "anime") {
            const queryGql = `
              query ($search: String) {
                Media(search: $search, type: ANIME) {
                  id
                  title { romaji }
                  coverImage { large }
                  startDate { year }
                  averageScore
                  description
                }
              }`;
            const variables = { search: query };
            const anires = await fetch("https://graphql.anilist.co", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: queryGql, variables }),
            });
            const aniData = await anires.json();
            if (aniData.data?.Media) {
              // fetch related via search for genres not directly available; instead, return top search results
              out.push({
                title: aniData.data.Media.title?.romaji || query,
                reason: `Matched via AniList search`,
                poster: aniData.data.Media.coverImage?.large || null,
                year: aniData.data.Media.startDate?.year?.toString() || null,
                rating: aniData.data.Media.averageScore
                  ? (aniData.data.Media.averageScore / 10).toFixed(1)
                  : null,
                  description: aniData.data.Media.description?.replace(/<br\s*\/?>/g, " ") || null,
              });
            }
          }
        } catch (e) {
          console.error("Fallback search error:", e);
        }
        return out;
      }

      const fallbackRecommendations = await fallbackSearch(cat, title);
      if (fallbackRecommendations && fallbackRecommendations.length > 0) {
        // Return enriched-like structure directly
        return NextResponse.json({ recommendations: fallbackRecommendations, raw: String(err) });
      }

      return NextResponse.json(
        { error: "Gemini API error", raw: String(err) },
        { status: 500 }
      );
    }

    // ✅ Clean Markdown fences
    rawText = rawText.replace(/```json|```/g, "").trim();

    let recommendations: { title: string; reason: string }[] = [];
    try {
      recommendations = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse Gemini response:", rawText);
      return NextResponse.json(
        { error: "Failed to parse model response", raw: rawText },
        { status: 500 }
      );
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return NextResponse.json(
        { error: "Gemini returned empty or invalid recommendations", raw: rawText },
        { status: 500 }
      );
    }

    // ---------- Enrichment Layer ----------
    let enriched: any[] = [];

    if (cat === "movie" || cat === "tv") {
      const TMDB_API_KEY = process.env.TMDB_API_KEY;
      if (!TMDB_API_KEY) {
        console.error("TMDb API key is missing! Set TMDB_API_KEY in env.");
      }
      for (const rec of recommendations) {
        let meta = null;
        try {
          const url = `https://api.themoviedb.org/3/search/${
            cat === "tv" ? "tv" : "movie"
          }?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(rec.title)}`;

          const tmdbRes = await fetch(url);
          const tmdbData = await tmdbRes.json();

          if (tmdbData.results?.length > 0) {
            const item = tmdbData.results[0];
            meta = {
              poster: item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : null,
              year: (item.release_date || item.first_air_date || "").slice(0, 4),
              rating: item.vote_average,
              description: item.overview,
            };
            console.log(`TMDb found for ${rec.title}:`, meta);
          } else {
            console.warn(`TMDb NO RESULTS for ${rec.title}`);
          }
        } catch (err) {
          console.error("TMDb fetch error for", rec.title, err);
        }
        enriched.push({ ...rec, ...meta });
      }
    } else if (cat === "book") {
      for (const rec of recommendations) {
        let meta = null;
        try {
          
          const gbRes = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
              rec.title
            )}`
          );
          const gbData = await gbRes.json();
          if (gbData.items?.length > 0) {
            const item = gbData.items[0].volumeInfo;
            meta = {
              poster: item.imageLinks?.thumbnail || null,
              year: item.publishedDate?.slice(0, 4) || null,
              rating: item.averageRating || null,
              description: item.description || null,
            };
          }
        } catch (err) {
          console.error("Google Books fetch error for", rec.title, err);
        }
        enriched.push({ ...rec, ...meta });
      }
    } else if (cat === "game") {
      const RAWG_API_KEY = process.env.RAWG_API_KEY;
      for (const rec of recommendations) {
        let meta = null;
        try {
          const rawgRes = await fetch(
            `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
              rec.title
            )}`
          );
          const rawgData = await rawgRes.json();
          if (rawgData.results?.length > 0) {
            const item = rawgData.results[0];
            meta = {
              poster: item.background_image || null,
              year: item.released?.slice(0, 4) || null,
              rating: item.rating || null,
              description: item.description_raw || null,
            };
          }
        } catch (err) {
          console.error("RAWG fetch error for", rec.title, err);
        }
        enriched.push({ ...rec, ...meta });
      }
    } else if (cat === "anime") {
      for (const rec of recommendations) {
        let meta = null;
        try {
          const query = `
            query ($search: String) {
              Media(search: $search, type: ANIME) {
                title { romaji }
                coverImage { large }
                startDate { year }
                averageScore
                description
              }
            }`;
          const variables = { search: rec.title };
          const anilistRes = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
          });
          const anilistData = await anilistRes.json();
          if (anilistData.data?.Media) {
            const item = anilistData.data.Media;
            meta = {
              poster: item.coverImage?.large || null,
              year: item.startDate?.year?.toString() || null,
              rating: item.averageScore
                ? (item.averageScore / 10).toFixed(1)
                : null,
              description: item.description?.replace(/<br\s*\/?>/g, " ") || null,
            };
          }
        } catch (err) {
          console.error("AniList fetch error for", rec.title, err);
        }
        enriched.push({ ...rec, ...meta });
      }
    } else {
      // fallback
      enriched = recommendations;
    }

    // ---------- Final Response ----------
    return NextResponse.json({ recommendations: enriched, raw: rawText });
  } catch (error) {
    console.error("Error in recommendations API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
