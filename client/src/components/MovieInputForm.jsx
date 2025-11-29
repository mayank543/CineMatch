import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import api from '../services/api';

// IMPORTANT: Make sure this exact environment variable name matches what's in your .env file


const MovieInputForm = () => {
  const [userMovies, setUserMovies] = useState(['', '']); // Start with two empty fields
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [debouncedInputs] = useDebounce(userMovies, 1000);
  const [movieCast, setMovieCast] = useState([]);
  const [movieTrailer, setMovieTrailer] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (activeInputIndex === null) {
        setSuggestions([]);
        return;
      }

      const query = debouncedInputs[activeInputIndex]?.trim();
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        // Use backend proxy for search
        const res = await api.get("/api/movies/search", {
          params: {
            query: query,
          },
        });

        const titles = res.data.results.map((m) => m.title);
        setSuggestions(titles.slice(0, 5));
      } catch (err) {
        console.error('❌ TMDB Suggestion Error:', err.message);
        console.error('Error details:', err.response?.data || 'No response data');
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedInputs, activeInputIndex]);

  const handleChange = (index, value) => {
    const updated = [...userMovies];
    updated[index] = value;
    setUserMovies(updated);
    setActiveInputIndex(index); // Track which input is being typed in
  };

  const handleAddMovie = () => {
    setUserMovies([...userMovies, '']);
    setSuggestions([]); // Clear suggestions when new input added
  };

  const handleRemoveMovie = (index) => {
    if (userMovies.length > 2) { // Keep minimum of 2 fields
      const updated = userMovies.filter((_, i) => i !== index);
      setUserMovies(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const filteredMovies = userMovies.filter((movie) => movie.trim() !== '');

    if (filteredMovies.length === 0) {
      setError('Please enter at least one movie title');
      setLoading(false);
      return;
    }

    try {
      // Use the configured api instance instead of axios directly
      const res = await api.post('/api/movies/recommend', {
        movies: filteredMovies
      });

      if (res.data && res.data.recommendations) {
        setResults(res.data.recommendations);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle Google Calendar scheduling for individual movies
  const handleScheduleMovie = (movie) => {
    const movieTitle = `Watch ${movie.title}`;
    const description = `Let's watch "${movie.title}" together on CineMatch!\n\nOverview: ${movie.overview || 'No description available.'}\n\nRating: ${movie.vote_average}/10\n\nRelease Year: ${movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}`;
    const location = "Home Theater / Cinema";

    // Set event start & end time (default to next Saturday evening)
    const nextSaturday = new Date();
    nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7);
    nextSaturday.setHours(20, 0, 0, 0); // 8 PM

    const start = new Date(nextSaturday);
    const end = new Date(nextSaturday);
    end.setHours(22, 30, 0, 0); // 10:30 PM (2.5 hours duration)

    const formatDate = (date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const startTime = formatDate(start);
    const endTime = formatDate(end);

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      movieTitle
    )}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
      location
    )}&dates=${startTime}/${endTime}`;

    window.open(calendarUrl, "_blank");
  };

  // Function to find streaming platforms for the movie
  const handleFindStreaming = (movie) => {
    const movieTitle = encodeURIComponent(movie.title);
    const searchUrls = [
      `https://www.netflix.com/search?q=${movieTitle}`,
      `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${movieTitle}`,
      `https://www.hulu.com/search?q=${movieTitle}`,
      `https://www.justwatch.com/us/search?q=${movieTitle}`
    ];

    // Open JustWatch as it aggregates multiple streaming services
    window.open(`https://www.justwatch.com/us/search?q=${movieTitle}`, "_blank");
  };

  // Function to fetch movie cast
  const fetchMovieCast = async (movieId) => {
    try {
      const response = await api.get(`/api/movies/${movieId}/cast`);

      // Return top 8 cast members
      return response.data.cast.slice(0, 8);
    } catch (error) {
      console.error('Error fetching cast:', error);
      return [];
    }
  };

  // Function to fetch movie trailer
  const fetchMovieTrailer = async (movieId) => {
    try {
      const response = await api.get(`/api/movies/${movieId}/videos`);

      // Find the first trailer or teaser
      const trailer = response.data.results.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
      ) || response.data.results.find(
        video => video.type === 'Teaser' && video.site === 'YouTube'
      );

      return trailer || null;
    } catch (error) {
      console.error('Error fetching trailer:', error);
      return null;
    }
  };

  const openModal = async (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
    setMovieCast([]); // Reset cast data
    setMovieTrailer(null); // Reset trailer data

    // Fetch cast and trailer data
    const [cast, trailer] = await Promise.all([
      fetchMovieCast(movie.id),
      fetchMovieTrailer(movie.id)
    ]);
    setMovieCast(cast);
    setMovieTrailer(trailer);
  };

  const openTrailerModal = () => {
    setShowTrailerModal(true);
  };

  const closeTrailerModal = () => {
    setShowTrailerModal(false);
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setShowModal(false);
    setMovieCast([]); // Clear cast data when closing modal
    setMovieTrailer(null); // Clear trailer data when closing modal
  };

  return (
    <div className="w-full">
      {/* Input Form Section - Wider to accommodate side-by-side layout */}
      <div className="w-full px-4 max-w-4xl mx-auto mb-8">
        <div className="relative p-8 overflow-hidden" style={{
          background: `
            radial-gradient(ellipse 150% 120% at center, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 25%, rgba(255,255,255,0.015) 15%, rgba(255,255,255,0.005) 65%, transparent 85%)
          `,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>

          {/* CineMatch Heading inside the region */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-wider">
              CineMatch
            </h1>
            <p className="text-white/80 text-lg mb-6">Discover your next favorite movie</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <h2 className="text-xl font-semibold text-white mb-4">Enter Movies You Like</h2>

            {error && (
              <div className="p-3 text-red-100 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg">{error}</div>
            )}

            {/* Grid layout for input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMovies.map((movie, index) => (
                <div key={index} className="relative">
                  <div className="flex gap-2 items-start">
                    <div className="w-full relative">
                      <input
                        type="text"
                        value={movie}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onFocus={() => setActiveInputIndex(index)}
                        onBlur={() => setTimeout(() => setActiveInputIndex(null), 150)} // Small delay to allow click on suggestions
                        placeholder={`Movie ${index + 1}`}
                        className="w-full px-5 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                        required
                      />

                      {activeInputIndex === index && suggestions.length > 0 && (
                        <ul className="absolute z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-white/20 dark:border-gray-600/50 rounded-lg shadow-xl w-full mt-1 max-h-40 overflow-auto text-black dark:text-white">
                          {suggestions.map((title, idx) => (
                            <li
                              key={idx}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                              onClick={() => {
                                handleChange(index, title);
                                setSuggestions([]);
                                setActiveInputIndex(null);
                              }}
                            >
                              {title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Show remove button if there's more than two fields */}
                    {userMovies.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMovie(index)}
                        className="mt-1 text-red-300 hover:text-red-100 font-bold px-2 py-1 rounded-full hover:bg-red-500/20 backdrop-blur-sm transition-all duration-200"
                        title="Remove this movie input"
                      >
                        ✖
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center pt-6">
              <button
                type="button"
                onClick={handleAddMovie}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
              >
                + Add Another
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl border border-red-500/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Find Matches'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section - Full width with padding */}
      {results.length > 0 && (
        <div className="w-full px-4 max-w-7xl mx-auto">
          <h3 className="text-lg font-bold mb-6 text-white">Recommendations:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {results.map((movie, index) => (
              <motion.div
                key={movie.id}
                className="group relative border-0 rounded-2xl overflow-hidden bg-gray-900 shadow-lg hover:shadow-2xl transform transition-all duration-500 ease-out hover:scale-[1.05] hover:-translate-y-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
                onClick={() => openModal(movie)}
              >
                {/* Image container - Full Height */}
                <div className="relative w-full aspect-[2/3] overflow-hidden cursor-pointer">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2 opacity-50">🎬</div>
                        <div className="text-sm">No image</div>
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90 transition-opacity duration-300" />

                  {/* Text Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10 flex flex-col justify-end h-full">
                    <h4 className="font-bold text-white text-lg mb-1 leading-tight line-clamp-2 drop-shadow-md">
                      {movie.title}
                    </h4>

                    <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
                      <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</span>
                      {movie.vote_average > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <span>★</span>
                          <span>{movie.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Always visible or appear on hover depending on preference, keeping them visible for usability */}
                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleMovie(movie);
                        }}
                        className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg transition-all duration-200 font-medium border border-white/10"
                      >
                        Schedule
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFindStreaming(movie);
                        }}
                        className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg transition-all duration-200 font-medium border border-white/10"
                      >
                        Stream
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main Movie Modal */}
      {showModal && selectedMovie && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            className="bg-black rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col md:flex-row border border-white/10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Backdrop Image Background (Blurred) */}
            {selectedMovie.backdrop_path && (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/original${selectedMovie.backdrop_path})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px)'
                }}
              />
            )}

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 backdrop-blur-md border border-white/10"
              aria-label="Close"
            >
              ✖
            </button>

            {/* Left side - Movie Poster */}
            <div className="md:w-2/5 h-[300px] md:h-auto relative flex-shrink-0">
              {selectedMovie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w780${selectedMovie.poster_path}`}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                  <span className="text-6xl">🎬</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-gray-900/50" />
            </div>

            {/* Right side - Movie Details */}
            <div className="md:w-3/5 p-8 flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
              <div className="mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-extrabold mb-2 text-white leading-tight"
                >
                  {selectedMovie.title}
                </motion.h2>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {selectedMovie.release_date && (
                    <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                      {new Date(selectedMovie.release_date).getFullYear()}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-yellow-500">
                    <span>★</span>
                    <span className="text-white font-bold">{selectedMovie.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Overview</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg font-light">
                  {selectedMovie.overview || 'No overview available.'}
                </p>
              </motion.div>

              {/* Cast Section - Horizontal Scroll */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Top Cast</h3>
                {movieCast.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 custom-scrollbar">
                    {movieCast.map((actor) => (
                      <div key={actor.id} className="flex-shrink-0 w-24 text-center group p-2 rounded-lg hover:bg-white/10 transition-colors duration-200">
                        <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white transition-all duration-300 shadow-md">
                          {actor.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name}
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-2xl">👤</div>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Loading cast...</p>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-3"
              >
                <button
                  onClick={() => handleScheduleMovie(selectedMovie)}
                  className="flex-1 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Schedule</span>
                </button>
                <button
                  onClick={() => handleFindStreaming(selectedMovie)}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <span>Stream</span>
                </button>
                {movieTrailer && (
                  <button
                    onClick={openTrailerModal}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <span>Trailer</span>
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Trailer Modal */}
      {showTrailerModal && movieTrailer && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
          onClick={closeTrailerModal}
        >
          <motion.div
            className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeTrailerModal}
              className="absolute top-4 right-4 z-20 text-white hover:text-red-500 bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/10"
            >
              ✖
            </button>

            <iframe
              src={`https://www.youtube.com/embed/${movieTrailer.key}?autoplay=1&rel=0&modestbranding=1`}
              title={`${selectedMovie?.title} Trailer`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MovieInputForm;