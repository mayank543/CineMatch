import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useDebounce } from 'use-debounce';
import api from '../services/api'; 

// IMPORTANT: Make sure this exact environment variable name matches what's in your .env file
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const MovieInputForm = () => {
  const [userMovies, setUserMovies] = useState(['']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [debouncedLastInput] = useDebounce(userMovies[userMovies.length - 1], 300); 

  useEffect(() => {
    const fetchSuggestions = async () => {
      const query = debouncedLastInput?.trim();
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
  }, [debouncedLastInput]);

  const handleChange = (index, value) => {
    const updated = [...userMovies];
    updated[index] = value;
    setUserMovies(updated);
  };

  const handleAddMovie = () => {
    setUserMovies([...userMovies, '']);
    setSuggestions([]); // Clear suggestions when new input added
  };

  const handleRemoveMovie = (index) => {
    if (userMovies.length > 1) {
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

  const openModal = (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedMovie(null);
    setShowModal(false);
  };

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold">Enter Movies You Like</h2>

        {error && (
          <div className="p-2 text-red-700 bg-red-100 rounded">{error}</div>
        )}

        {userMovies.map((movie, index) => (
          <div key={index} className="relative flex gap-2 items-start">
            <div className="w-full relative">
              <input
                type="text"
                value={movie}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={`Movie ${index + 1}`}
                className="w-full px-4 py-2 border rounded text-black dark:text-white dark:bg-gray-800"
                required
              />

              {index === userMovies.length - 1 && suggestions.length > 0 && (
                <ul className="absolute z-20 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded shadow w-full mt-1 max-h-40 overflow-auto text-black dark:text-white">
                  {suggestions.map((title, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-700 cursor-pointer"
                      onClick={() => {
                        handleChange(index, title);
                        setSuggestions([]);
                      }}
                    >
                      {title}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Show remove button if there's more than one field */}
            {userMovies.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveMovie(index)}
                className="mt-1 text-red-600 hover:text-red-800 font-bold px-2"
                title="Remove this movie input"
              >
                ✖
              </button>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddMovie}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            + Add Another
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Find Matches'}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Recommendations:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((movie, index) => (
              <motion.div
                key={movie.id}
                onClick={() => openModal(movie)}
                className="group border rounded p-2 bg-white shadow hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-in-out transform cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full rounded mb-2 transition duration-300 hover:brightness-110"
                  />
                ) : (
                  <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center text-gray-600">
                    No image
                  </div>
                )}

                <h4 className="font-semibold text-black text-md transition-colors duration-300 group-hover:text-blue-600">
                  {movie.title}
                </h4>
                <p className="text-sm text-gray-600">{movie.release_date}</p>

                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < Math.round(movie.vote_average / 2)
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                      }
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-gray-600 ml-1">
                    ({movie.vote_average})
                  </span>
                </div>

                <p className="text-xs text-gray-700 mt-1 line-clamp-3">{movie.overview}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedMovie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={closeModal}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-[90%] p-4 relative shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-800 dark:text-gray-200 hover:text-red-600 text-2xl font-bold"
              aria-label="Close"
            >
              ✖
            </button>

            {selectedMovie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                className="w-full h-auto rounded mb-4"
              />
            )}

            <h2 className="text-xl font-bold mb-2 text-black dark:text-white">{selectedMovie.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedMovie.release_date}</p>

            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < Math.round(selectedMovie.vote_average / 2)
                      ? 'text-yellow-500'
                      : 'text-gray-300'
                  }
                >
                  ★
                </span>
              ))}
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                ({selectedMovie.vote_average})
              </span>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300">{selectedMovie.overview}</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MovieInputForm;