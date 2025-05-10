import { useState } from 'react';
import axios from 'axios';
import api from '../services/api';
import { motion } from 'framer-motion';

const MovieInputForm = () => {
  const [userMovies, setUserMovies] = useState(['']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (index, value) => {
    const updated = [...userMovies];
    updated[index] = value;
    setUserMovies(updated);
  };

  const handleAddMovie = () => {
    setUserMovies([...userMovies, '']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const filteredMovies = userMovies.filter(movie => movie.trim() !== '');

    if (filteredMovies.length === 0) {
      setError('Please enter at least one movie title');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5050/api/movies/recommend', {
        movies: filteredMovies
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false
      });

      if (res.data && res.data.recommendations) {
        setResults(res.data.recommendations);
      } else if (res.data && Array.isArray(res.data)) {
        setResults(res.data);
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
          <input
            key={index}
            type="text"
            value={movie}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`Movie ${index + 1}`}
            className="w-full px-4 py-2 border rounded"
            required
          />
        ))}

        <div className="flex gap-2">
          <button type="button" onClick={handleAddMovie} className="px-4 py-2 bg-blue-500 text-white rounded">
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

                <h4 className="font-semibold text-md transition-colors duration-300 group-hover:text-blue-600">
                  {movie.title}
                </h4>
                <p className="text-sm text-gray-600">{movie.release_date}</p>

                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < Math.round(movie.vote_average / 2) ? 'text-yellow-500' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-gray-600 ml-1">({movie.vote_average})</span>
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
    onClick={closeModal} // click outside closes modal
  >
    <motion.div
      className="bg-white rounded-lg max-w-md w-[90%] p-4 relative shadow-lg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
      <button
        onClick={closeModal}
        className="absolute top-2 right-3 text-gray-800 hover:text-red-600 text-2xl font-bold"
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

      <h2 className="text-xl font-bold mb-2">{selectedMovie.title}</h2>
      <p className="text-sm text-gray-600 mb-2">{selectedMovie.release_date}</p>

      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < Math.round(selectedMovie.vote_average / 2) ? 'text-yellow-500' : 'text-gray-300'}>
            ★
          </span>
        ))}
        <span className="text-xs text-gray-600 ml-1">({selectedMovie.vote_average})</span>
      </div>

      <p className="text-sm text-gray-700">{selectedMovie.overview}</p>
    </motion.div>
  </div>
)}
    </div>
  );
};

export default MovieInputForm;