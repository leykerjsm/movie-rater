const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.error('API key is not set in environment variables');
}

export async function fetchMovies({ queryKey, signal }) {
  const [_key, search] = queryKey;

  if (!search) {
    return [];
  }

  try {
    const response = await fetch(
      `http://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
        search
      )}`,
      { signal }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.Error || 'Failed to fetch movies');
    }

    const data = await response.json();
    return data.Search || [];
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error fetching movies:', error);
    }
  }
}
