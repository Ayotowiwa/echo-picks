"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const BG_IMAGES = [
    "/pictures/pic1.jpg",
    "/pictures/Pic2.jpg",
    "/pictures/pic3.jpg",
    "/pictures/pic4.jpg",
    "/pictures/pic5.jpg",
    "/pictures/pic6.jpg",
    "/pictures/pic7.jpg",
    "/pictures/pic8.jpg",
    "/pictures/pic9.jpg",
    "/pictures/pic10.jpg",
    "/pictures/pic11.jpg",
    "/pictures/pic12.jpg",
    "/pictures/pic13.jpg",
    "/pictures/pic14.jpg",
    "/pictures/pic15.jpg",
    "/pictures/pic16.jpg",
    "/pictures/pic17.jpg",
    "/pictures/pic18.jpg",
    "/pictures/pic19.jpg",
    "/pictures/pic20.jpg",
    "/pictures/pic21.jpg",
    "/pictures/pic22.jpg",
    "/pictures/pic23.jpg",
    "/pictures/pic24.jpg",
    "/pictures/pic25.jpg",
    "/pictures/pic26.jpg",
    "/pictures/pic27.jpg",
    "/pictures/pic28.jpg",
    "/pictures/pic29.jpg",
    "/pictures/pic30.jpg",
    "/pictures/pic31.jpg",
    "/pictures/pic32.jpg",
    "/pictures/pic33.jpg",
    "/pictures/pic34.jpg",
    "/pictures/pic35.jpeg",
    "/pictures/pic36.png",
    "/pictures/pic37.jpg",
    "/pictures/pic38.jpg",
    "/pictures/pic39.jpg",
    "/pictures/pic40.jpg",
    "/pictures/pic41.jpg",
    "/pictures/pic42.jpg",
    "/pictures/pic43.jpg",
    "/pictures/pic44.jpg",
    "/pictures/pic45.jpg",
    "/pictures/pic46.jpg",
    "/pictures/pic47.jpg",
    "/pictures/pic48.jpg",
  ];

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("book");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        setVisibleCount(5);
      } else {
        setError(data.error || "Unknown error");
        if (data.raw) setRaw(data.raw);
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handle = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % BG_IMAGES.length);
    }, 5000);

    return () => clearInterval(handle);
  }, [BG_IMAGES.length]);

  return (
    <main className="relative min-h-screen w-full text-white font-sans overflow-hidden">
      {/* Background slideshow */}
      <div className="bg-slideshow" aria-hidden>
        {BG_IMAGES.map((src, i) => (
          <div
            key={src}
            className={`bg-slide ${i === currentIndex ? "show" : ""}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold">Echopicks</h1>
        <ul className="hidden md:flex gap-6 text-sm">
          <li>Home</li>
          <li>About</li>
          <li>Library</li>
          <li>Case Studies</li>
        </ul>
        <div className="flex gap-4 text-sm">
          <button>Sign In</button>
          <button className="bg-button px-4 py-1 rounded">Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-20 max-w-7xl mx-auto">
        <div className="w-full max-w-3xl text-center hero-panel p-8 rounded-xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Find Your <br /> Next Favorite
          </h1>

          <p className="text-sm md:text-base text-paragraph">
            Enter a title of something you already like and get recommendations.
          </p>

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

            <div className="flex">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title..."
                className="flex-1 px-3 py-3 bg-[#042c54] rounded-l"
              />
              <button
                onClick={getRecommendations}
                disabled={!title.trim() || loading}
                className="px-6 py-3 rounded-r bg-button disabled:bg-gray-500"
              >
                {loading ? "Loading..." : "Get Recommendations"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section id="results-section" className="max-w-7xl mx-auto px-6 pb-16">
        {recommendations.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.slice(0, visibleCount).map((rec, idx) => (
                <div key={idx} className="flex bg-[#042c54] rounded overflow-hidden">
                  <div className="w-24 h-32 bg-gray-800 flex items-center justify-center">
                    {rec.poster ? (
                      <Image
                        src={rec.poster}
                        alt={rec.title}
                        width={96}
                        height={128}
                      />
                    ) : (
                      <span className="text-xs">No Image</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{rec.title}</h3>
                    <p className="text-sm text-gray-300">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>

            {recommendations.length > visibleCount && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisibleCount((v) => Math.min(v + 5, recommendations.length))}
                  className="px-4 py-2 bg-button text-white rounded"
                >
                  View more
                </button>
              </div>
            )}
          </>
        )}

        {error && <p className="text-red-400 mt-6">{error}</p>}
      </section>
    </main>
  );
}
