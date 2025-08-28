"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("book");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [raw, setRaw] = useState<any>(null);


 async function getRecommendations() {
  setLoading(true);
  setRecommendations([]);
  setError(null);
  setRaw(null);

  try {
    const res = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title }),
    });

    const data = await res.json();

    if (res.ok && data.recommendations) {
      setRecommendations(data.recommendations);
    } else {
      setError(data.error || "Unknown error");
      if (data.raw) setRaw(data.raw); // store raw model output
    }
  } catch (err: any) {
    console.error("Error fetching recommendations:", err);
    setError("Network error");
  } finally {
    setLoading(false);
  }
}


  return (
    <main className="min-h-screen w-full bg-background text-white font-sans">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4">
        <div className="text-2xl font-bold">
          <h1>Echopicks</h1>
        </div>
        <ul className="hidden md:flex gap-6 text-sm">
          <li><a href="#" className="hover:underline">Home</a></li>
          <li><a href="#" className="hover:underline">About</a></li>
          <li><a href="#" className="hover:underline">Library</a></li>
          <li><a href="#" className="hover:underline">Case Studies</a></li>
        </ul>
        <div className="flex gap-4 text-sm">
          <button className="px-4 py-1">Sign In</button>
          <button className="bg-button text-white px-4 py-1 rounded">Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between px-6 py-20 max-w-7xl mx-auto gap-10">
        {/* Text Content */}
        <div className="w-full md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Find Your <br /> Next Favorite
          </h1>
          <p className="text-sm text-paragraph md:text-base">
            Enter a title of something you already like and get recommendations for similar books, movies, anime, and more.
          </p>

          {/* Form Controls */}
          <div className="flex flex-col gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 text-gray-400 border border-[#042c54] rounded"
            >
              <option value="book">Book</option>
              <option value="movie">Movie</option>
              <option value="anime">Anime</option>
              <option value="game">Game</option>
              <option value="tv">TV Show</option>
            </select>

            <div className="flex w-full">
              <input
                type="text"
                placeholder="Enter a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 bg-[#042c54] text-gray-200 rounded-l focus:outline-none"
              />
              <button
                disabled={!title.trim() || loading}
                onClick={getRecommendations}
                className={`px-4 py-2 rounded-r ${
                  !title.trim() || loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-button text-white hover:bg-orange-600"
                }`}
              >
                {loading ? "Loading..." : "Get Recommendations"}
              </button>
            </div>
          </div>

          {/* Results and Error Display */}
          <div className="mt-6 space-y-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex bg-[#042c54] rounded shadow overflow-hidden" style={{ minHeight: 120 }}>
                <div className="flex-shrink-0 w-24 h-32 bg-gray-800 flex items-center justify-center">
                  {rec.poster ? (
                    <Image
                      src={rec.poster}
                      alt={rec.title}
                      width={96}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No Image</span>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{rec.title} {rec.year && <span className="text-gray-400 font-normal">({rec.year})</span>}</h3>
                    {rec.rating && (
                      <div className="text-yellow-400 text-xs mb-1">⭐ {rec.rating}</div>
                    )}
                    <p className="text-sm text-gray-300 mb-2">{rec.reason || rec.description}</p>
                  </div>
                  {rec.description && rec.reason && (
                    <div className="text-xs text-gray-400 mt-2">{rec.description}</div>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div className="p-4 bg-red-900 text-red-200 rounded">
                <p className="font-bold">Error: {error}</p>
                {raw && (
                  <pre className="mt-2 text-xs whitespace-pre-wrap">
                    {typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hero Image */}
        <div className="w-full md:w-1/2">
          <Image
            src="/hero.png"
            alt="Hero"
            width={600}
            height={400}
            className="w-full h-auto object-contain"
          />
        </div>
      </section>


    </main>
  );
}
