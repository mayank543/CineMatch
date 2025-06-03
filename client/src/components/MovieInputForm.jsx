import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import api from '../services/api'; 

// IMPORTANT: Make sure this exact environment variable name matches what's in your .env file
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const MovieInputForm = () => {
  const [userMovies, setUserMovies] = useState(['', '']); // Start with two empty fields
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [debouncedInputs] = useDebounce(userMovies, 300);
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
        // Check if API key is available
        if (!TMDB_API_KEY) {
          console.error('❌ TMDB API key is missing. Check your .env file');
          return;
        }

        // Make sure the API key is properly formatted in the request
        const res = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: query,
            include_adult: false
          }
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
      if (!TMDB_API_KEY) {
        console.error('❌ TMDB API key is missing');
        return [];
      }

      const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
        params: {
          api_key: TMDB_API_KEY
        }
      });

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
      if (!TMDB_API_KEY) {
        console.error('❌ TMDB API key is missing');
        return null;
      }

      const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
        params: {
          api_key: TMDB_API_KEY
        }
      });

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
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-500 mb-2 tracking-wider">
              CineMatch🎬
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
                              className="px-4 py-2 hover:bg-blue-100/80 dark:hover:bg-blue-700/80 cursor-pointer transition-colors duration-200"
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
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl border border-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
              >
                + Add Another
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl border border-green-500 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md"
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
                className="group relative border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transform transition-all duration-500 ease-out hover:scale-[1.08] hover:-translate-y-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
                whileHover={{ 
                  rotateY: 2,
                  rotateX: 2,
                  transition: { duration: 0.3 }
                }}
                style={{
                  background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                     style={{
                       background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.05), rgba(147, 51, 234, 0.05))',
                       boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)'
                     }}
                />
                
                <div onClick={() => openModal(movie)} className="cursor-pointer relative">
                  {/* Image container with enhanced hover effects */}
                  <div className="relative overflow-hidden">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-105"
                      />
                    ) : (
                      <div className="w-full h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 group-hover:from-gray-50 group-hover:to-gray-100 transition-all duration-500">
                        <div className="text-center">
                          <div className="text-4xl mb-2 opacity-50">🎬</div>
                          <div className="text-sm">No image</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay gradient that appears on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div className="p-4 relative">
                    <h4 className="font-bold text-gray-800 text-sm mb-1 transition-all duration-300 group-hover:text-indigo-600 group-hover:scale-105 line-clamp-2 transform-gpu">
                      {movie.title}
                    </h4>
                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                    </p>
                    
                    {/* Rating stars that animate on hover */}
                    {movie.vote_average > 0 && (
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <motion.span
                            key={i}
                            className={i < Math.round(movie.vote_average / 2) ? 'text-yellow-400' : 'text-gray-300'}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.3 }}
                          >
                            ⭐
                          </motion.span>
                        ))}
                        <span className="text-xs text-gray-600 ml-1 font-medium">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Two Buttons Side by Side */}
                <div className="px-4 pb-4 flex gap-2">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScheduleMovie(movie);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm">📅</span>
                    <span>Schedule</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFindStreaming(movie);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-1 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm">🎥</span>
                    <span>Stream</span>
                  </motion.button>
                </div>

                {/* Floating heart icon that appears on hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none transform scale-0 group-hover:scale-100 rotate-12 group-hover:rotate-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm shadow-lg animate-pulse">
                    ❤️
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={closeModal}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl bg-gray-100 dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
              aria-label="Close"
            >
              ✖
            </button>

            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* Left side - Movie Poster */}
              <div className="md:w-1/3 flex-shrink-0 flex flex-col">
                {selectedMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                    alt={selectedMovie.title}
                    className="w-full h-full object-cover rounded-l-lg md:rounded-r-none rounded-t-lg md:rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 rounded-l-lg md:rounded-r-none rounded-t-lg md:rounded-t-lg min-h-[400px]">
                    <div className="text-center">
                      <div className="text-6xl mb-2">🎬</div>
                      <p>No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - Movie Details */}
              <div className="md:w-2/3 p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-3 text-black dark:text-white pr-8 leading-tight">
                    {selectedMovie.title}
                  </h2>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4 font-medium">
                    {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : 'Release year unknown'}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < Math.round(selectedMovie.vote_average / 2)
                              ? 'text-yellow-400 text-xl'
                              : 'text-gray-300 dark:text-gray-600 text-xl'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                      {selectedMovie.vote_average.toFixed(1)}/10
                    </span>
                  </div>

                  {/* Release Date */}
                  {selectedMovie.release_date && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
                        Release Date
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date(selectedMovie.release_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Overview */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase tracking-wide">
                      Overview
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      {selectedMovie.overview || 'No overview available.'}
                    </p>
                  </div>

                  {/* Cast */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wide">
                      Cast
                    </h3>
                    {movieCast.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {movieCast.map((actor) => (
                          <div key={actor.id} className="text-center">
                            <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-200 dark:ring-gray-600">
                              {actor.profile_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                  alt={actor.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-2xl">
                                  👤
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1 truncate">
                              {actor.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {actor.character}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Loading cast...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-start border-t dark:border-gray-700 pt-6">
                  <button
                    onClick={() => handleScheduleMovie(selectedMovie)}
                    className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
                  >
                    <span className="text-blue-400">📅</span>
                    Schedule Movie Night
                  </button>
                  <button
                    onClick={() => handleFindStreaming(selectedMovie)}
                    className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
                  >
                    <span className="text-purple-400">🎥</span>
                    Find Streaming
                  </button>
                  {movieTrailer && (
                    <button
                      onClick={openTrailerModal}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium flex items-center gap-2 shadow-sm"
                    >
                      <span>▶️</span>
                      Watch Trailer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Trailer Modal - Higher z-index to appear above main modal */}
      {showTrailerModal && movieTrailer && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={closeTrailerModal}
        >
          <motion.div
            className="relative bg-black rounded-lg overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeTrailerModal}
              className="absolute top-4 right-4 z-20 text-white hover:text-red-500 text-xl font-bold bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
              aria-label="Close Trailer"
            >
              ✖
            </button>
            
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${movieTrailer.key}?autoplay=1&rel=0&modestbranding=1`}
                title={`${selectedMovie?.title} Trailer`}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            
            <div className="p-4 bg-gray-900">
              <h3 className="text-white text-lg font-semibold mb-1">
                {selectedMovie?.title} - {movieTrailer.type}
              </h3>
              <p className="text-gray-400 text-sm">
                {movieTrailer.name}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MovieInputForm;