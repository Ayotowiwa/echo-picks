import Image from 'next/image';


export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-white font-sans">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4">

        <div className="text-2xl font-bold"><h1>Echopicks</h1></div>
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
            <select className="w-full p-2 text-gray-400 border border-[#042c54] rounded">
              <option value="book">Book</option>
              <option value="movie">Movie</option>
              <option value="anime">Anime</option>
              <option value="game">Game</option>
              <option value="tv">TV Show</option>
              <option value="music">Music</option>
              <option value="any">Any</option>
            </select>

            <div className="flex w-full">
              <input
                type="text"
                placeholder="Enter a title..."
                className="w-full p-2 bg-[#042c54] text-gray-400 rounded-l"
              />
              <button className="px-4 py-2 bg-button text-white rounded-r">
                Get Recommendations
              </button>
            </div>
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

