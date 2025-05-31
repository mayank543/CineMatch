import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import axios from 'axios';

const router = express.Router();


// Load .env variables

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Fetch genre IDs for a movie title
const getMovieGenres = async (title) => {
  try {
    const searchRes = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
      },
    });

    const movie = searchRes.data.results[0];
    if (!movie) {
      console.warn(`⚠️ No result found for "${title}"`);
      return [];
    }

    console.log(`🎬 Genres for "${title}":`, movie.genre_ids);
    return movie.genre_ids || [];
  } catch (err) {
    console.error(`❌ Error fetching genre for "${title}":`, err.message);
    return [];
  }
};

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Movies route is working!' });
});

// Main recommendation route
router.post('/recommend', async (req, res) => {
  const { movies } = req.body;

  // Validate input
  if (!movies || !Array.isArray(movies) || movies.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of movie titles' });
  }

  try {
    console.log("📥 Incoming movie titles:", movies);

    // Get genres for each movie
    const genreSets = await Promise.all(
      movies.map(async (title) => {
        const genres = await getMovieGenres(title);
        return genres;
      })
    );

    // Count genres
    const genreCount = {};
    genreSets.flat().forEach((genreId) => {
      genreCount[genreId] = (genreCount[genreId] || 0) + 1;
    });

    console.log("📊 genreCount:", genreCount);

    // Use genres that appear in at least 1 movie
    const commonGenres = Object.entries(genreCount)
      .filter(([_, count]) => count >= 1)
      .map(([genreId]) => Number(genreId));

    console.log("🎯 commonGenres:", commonGenres);

    if (commonGenres.length === 0) {
      console.warn("⚠️ No common genres found.");
      return res.json({ recommendations: [] });
    }

    const genreString = commonGenres.join(',');
    console.log("🔗 genreString for TMDB:", genreString);

    // Fetch recommendations
    const discoverRes = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        with_genres: genreString,
        sort_by: 'popularity.desc',
        page: 1,
      },
    });

    const discovered = discoverRes.data.results;
    console.log("🎥 TMDB Discover Response count:", discovered.length);

    const recommended = discovered.slice(0, 10).map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      overview: movie.overview,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
    }));

    res.json({ recommendations: recommended });
  } catch (err) {
    console.error('❌ Error recommending movies:', err.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;