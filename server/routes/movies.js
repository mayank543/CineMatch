import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import axios from 'axios';
import https from 'https';
import dns from 'dns';

const router = express.Router();

// --- CUSTOM DNS SETUP START ---
// Force usage of Google DNS (8.8.8.8) and Cloudflare DNS (1.1.1.1)
// This bypasses ISP DNS blocking/poisoning
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log("✅ Custom DNS servers set: 8.8.8.8, 1.1.1.1");
} catch (e) {
  console.error("⚠️ Failed to set custom DNS servers:", e.message);
}

const customLookup = (hostname, options, callback) => {
  // dns.resolve4 respects the servers set by dns.setServers
  dns.resolve4(hostname, (err, addresses) => {
    if (err) {
      console.error(`❌ DNS Resolution failed for ${hostname}:`, err.message);
      return callback(err);
    }
    const address = addresses[0];
    console.log(`🔍 DNS Lookup for ${hostname} resolved to: ${address}`);
    callback(null, address, 4);
  });
};

const httpsAgent = new https.Agent({
  lookup: customLookup,
  family: 4, // Force IPv4
  keepAlive: true,
});

const axiosInstance = axios.create({
  httpsAgent: httpsAgent,
  timeout: 10000, // 10 seconds timeout
});
// --- CUSTOM DNS SETUP END ---

// Load .env variables
const TMDB_API_KEY = process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.trim() : "";

if (!TMDB_API_KEY) {
  console.error("❌ FATAL: TMDB_API_KEY is missing in process.env!");
} else {
  console.log(`✅ TMDB_API_KEY is loaded. Length: ${TMDB_API_KEY.length}`);
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Fetch genre IDs for a movie title
const getMovieGenres = async (title) => {
  try {
    const searchRes = await axiosInstance.get(`${TMDB_BASE_URL}/search/movie`, {
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
    console.error(`❌ Error fetching genre for "${title}":`);
    console.error(`   Message: ${err.message}`);
    if (err.code) console.error(`   Code: ${err.code}`);
    return [];
  }
};

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Movies route is working!' });
});

// Proxy route for searching movies
router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    console.log(`🔎 Searching for: ${query}`);
    const response = await axiosInstance.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        include_adult: false,
      },
    });
    console.log(`✅ Search successful. Found ${response.data.results.length} results.`);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error searching movies:", error.message);
    if (error.code) console.error("   Code:", error.code);
    res.status(500).json({ error: "Failed to search movies", details: error.message });
  }
});

// Proxy route for movie cast
router.get("/:id/cast", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axiosInstance.get(`${TMDB_BASE_URL}/movie/${id}/credits`, {
      params: { api_key: TMDB_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching cast for movie ${id}:`, error.message);
    res.status(500).json({ error: "Failed to fetch cast" });
  }
});

// Proxy route for movie videos (trailers)
router.get("/:id/videos", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axiosInstance.get(`${TMDB_BASE_URL}/movie/${id}/videos`, {
      params: { api_key: TMDB_API_KEY },
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching videos for movie ${id}:`, error.message);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
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

    // Use genres that appear in at least 1 movier
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
    const discoverRes = await axiosInstance.get(`${TMDB_BASE_URL}/discover/movie`, {
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