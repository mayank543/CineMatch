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
  const handleOpenCalendar = (movie) => {
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

  const openModal = (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setShowModal(false);
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
                className="group border rounded-lg overflow-hidden bg-white shadow hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-in-out transform"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
              >
                <div onClick={() => openModal(movie)} className="cursor-pointer">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-auto object-cover transition duration-300 hover:brightness-110"
                    />
                  ) : (
                    <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center text-gray-600">
                      No image
                    </div>
                  )}

                  <div className="p-3">
                    <h4 className="font-semibold text-black text-sm transition-colors duration-300 group-hover:text-blue-600 line-clamp-2">
                      {movie.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Calendar Button */}
                <div className="px-3 pb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCalendar(movie);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-md transition-all duration-200 hover:scale-105 shadow-sm flex items-center justify-center gap-1"
                  >
                    📅 Add to Calendar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedMovie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
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
              className="absolute top-4 right-4 z-10 text-gray-800 dark:text-gray-200 hover:text-red-600 text-2xl font-bold bg-white dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ✖
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Left side - Movie Poster */}
              <div className="md:w-1/3 flex-shrink-0">
                {selectedMovie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                    alt={selectedMovie.title}
                    className="w-full h-auto object-cover rounded-l-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-600 rounded-l-lg">
                    No image available
                  </div>
                )}
              </div>

              {/* Right side - Movie Details */}
              <div className="md:w-2/3 p-6">
                <h2 className="text-2xl font-bold mb-2 text-black dark:text-white pr-8">
                  {selectedMovie.title}
                </h2>
                
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : 'Release year unknown'}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < Math.round(selectedMovie.vote_average / 2)
                            ? 'text-yellow-500 text-xl'
                            : 'text-gray-300 text-xl'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {selectedMovie.vote_average.toFixed(1)}/10
                  </span>
                </div>

                {/* Release Date */}
                {selectedMovie.release_date && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      Release Date
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Overview
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedMovie.overview || 'No overview available.'}
                  </p>
                </div>

                {/* Calendar Button in Modal */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleOpenCalendar(selectedMovie)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-md flex items-center gap-2"
                  >
                    📅 Schedule Movie Night
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MovieInputForm;