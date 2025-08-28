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

    // ✅ Normalize category to avoid plural/variant issues
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
    } catch (err) {
      console.error("Gemini API error:", err);
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
