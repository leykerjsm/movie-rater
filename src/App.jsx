import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Film,
  Search,
  Heart,
  Star,
  Clock,
  Loader,
  ArrowLeft,
} from 'lucide-react';
import { fetchMovies } from './utils/fetchMovies';
import StarRating from './components/StarRating';

function App() {
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const storedFavorites = localStorage.getItem('favorites');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  });

  const { data, isLoading } = useQuery({
    queryKey: ['movies', search],
    queryFn: fetchMovies,
    enabled: search.length >= 3,
  });

  useEffect(() => {
    if (data) {
      setMovies(data);
    }
  }, [data]);

  useEffect(() => {
    window.addEventListener('keydown', handleReset);
    return () => {
      window.removeEventListener('keydown', handleReset);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleReset = e => {
    if (e.key === 'Escape') {
      setSearch('');
      setMovies([]);
    }
  };

  const handleSelectId = id => {
    setSelectedId(curId => (curId === id ? null : id));
    setSearch('');
  };

  const handleAddFavorite = newFavorite => {
    if (favorites.some(movie => movie.imdbID === newFavorite.imdbID)) {
      setFavorites(curFavorites =>
        curFavorites.filter(movie => movie.imdbID !== newFavorite.imdbID)
      );
      return;
    }

    setFavorites(curFavorites => [...curFavorites, newFavorite]);
    handleSelectId(null);
  };

  const calculateStats = () => {
    if (favorites.length === 0) {
      return {
        count: 0,
        avgRating: 0,
        avgUserRating: 0,
        totalMinutes: 0,
      };
    }

    const totalRating = favorites.reduce((sum, movie) => sum + movie.rating, 0);
    const totalUserRating = favorites.reduce(
      (sum, movie) => sum + movie.userRating,
      0
    );
    const totalMinutes = favorites.reduce(
      (sum, movie) => sum + movie.runtime,
      0
    );

    return {
      count: favorites.length,
      avgRating: (totalRating / favorites.length).toFixed(1),
      avgUserRating: (totalUserRating / favorites.length).toFixed(1),
      totalMinutes,
    };
  };

  const stats = calculateStats();

  return (
    <div className="app-container">
      <Navbar>
        <SearchBar search={search} setSearch={setSearch} />
        <FavoritesBadge favorites={favorites} />
      </Navbar>

      <Main>
        <MovieListContainer movies={movies}>
          {isLoading && <Loading />}
          {!isLoading && (
            <MovieList
              movies={movies}
              onSelectId={handleSelectId}
              favorites={favorites}
            />
          )}
        </MovieListContainer>
        <FavoritesListContainer stats={stats}>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              favorites={favorites}
              onAddFavorite={handleAddFavorite}
              setSelectedId={setSelectedId}
            />
          ) : (
            <FavoritesMovieList
              favorites={favorites}
              onSelectId={handleSelectId}
            />
          )}
        </FavoritesListContainer>
      </Main>
    </div>
  );
}

export default App;

function Loading() {
  return (
    <div className="loading-container">
      <Loader size={48} />
    </div>
  );
}

function Navbar({ children }) {
  return (
    <header className="floating-navbar">
      <div className="navbar-content">
        <div className="logo-container">
          <Film className="logo-icon" />
          <h1 className="logo-text">MovieRater</h1>
        </div>

        <nav className="nav-links">
          <a href="#" className="nav-link active">
            Movies
          </a>
          <a href="#" className="nav-link">
            Favorites
          </a>
          <a href="#" className="nav-link">
            About
          </a>
        </nav>

        <div className="navbar-actions">{children}</div>
      </div>
    </header>
  );
}

function FavoritesBadge({ favorites }) {
  return (
    <Badge className="favorites-badge">
      <Heart
        className="heart-icon"
        fill={favorites.length > 0 ? 'currentColor' : 'none'}
      />
      <span>{favorites ? favorites.length : 0}</span>
    </Badge>
  );
}

function SearchBar({ search, setSearch }) {
  return (
    <div className="search-container">
      <Search className="search-icon" />
      <Input
        type="search"
        placeholder="Search..."
        className="search-input"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
  );
}

function Main({ children }) {
  return (
    <main className="main-content">
      <div className="movie-grid">{children}</div>
    </main>
  );
}

function MovieListContainer({ movies, children }) {
  return (
    <div className="movie-list-container">
      <div className="list-header">
        <h2 className="list-title">All Movies</h2>
        <p className="list-subtitle">
          {movies ? movies.length : '0'} movies found
        </p>
      </div>

      {children}
    </div>
  );
}

function MovieList({ movies, onSelectId, favorites }) {
  return (
    <ScrollArea className="movies-scroll-area">
      <div className="movie-list">
        {movies?.map(movie => (
          <MovieCard
            movie={movie}
            key={movie.imdbID}
            onSelectId={onSelectId}
            favorites={favorites}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function FavoritesMovieList({ favorites, onSelectId }) {
  return (
    <ScrollArea className="movies-scroll-area">
      <div className="movie-list">
        {favorites?.map(movie => (
          <FavoriteCard
            movie={movie}
            onSelectId={onSelectId}
            key={movie.imdbID}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function FavoritesListContainer({ children, stats }) {
  return (
    <div className="movie-list-container">
      <div className="favorites-header">
        <h2 className="list-title">My Favorites</h2>
      </div>

      <div className="stats-summary">
        <div className="stat-item">
          <div className="stat-icon">
            <Film />
          </div>
          <div className="stat-value">{stats.count}</div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Star />
          </div>
          <div className="stat-value">{stats.avgRating}</div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Star fill="currentColor" />
          </div>
          <div className="stat-value">{stats.avgUserRating}</div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-value">{stats.totalMinutes}</div>
        </div>
      </div>

      <ScrollArea className="movies-scroll-area">
        <div className="movie-list">{children}</div>
      </ScrollArea>
    </div>
  );
}

function FavoriteCard({ onSelectId, movie }) {
  const { poster, title, year } = movie;

  console.log(movie);

  return (
    <div className="movie-card" onClick={() => onSelectId(movie.imdbID)}>
      <img src={poster} alt={`${title} poster`} className="movie-poster" />

      <div className="movie-details">
        <div className="movie-header">
          <div>
            <h3 className="movie-title">{title}</h3>
            <p className="movie-year">{year}</p>
          </div>
        </div>

        <div className="movie-actions">
          <Button variant="ghost" size="sm" className="rate-button">
            Rate
          </Button>
        </div>
      </div>
    </div>
  );
}

function MovieCard({ movie, onSelectId, favorites }) {
  const { Poster: poster, Title: title, Year: year } = movie;

  const isFavorite = favorites.some(fav => fav.imdbID === movie.imdbID);

  return (
    <div className="movie-card" onClick={() => onSelectId(movie.imdbID)}>
      <img
        src={poster || '/placeholder.svg'}
        alt={`${title} poster`}
        className="movie-poster"
      />

      <div className="movie-details">
        <div className="movie-header">
          <div>
            <h3 className="movie-title">{title}</h3>
            <p className="movie-year">{year}</p>
          </div>
        </div>

        <div className="movie-actions">
          <Button variant="ghost" size="sm" className="rate-button">
            Rate
          </Button>

          <Button variant="ghost" size="icon" className="favorite-button">
            <Heart
              className="favorite-icon"
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MovieDetails({ selectedId, favorites, onAddFavorite, setSelectedId }) {
  const [movieDetail, setMovieDetail] = useState(null);
  const [userRating, setUserRating] = useState(0);

  const fetchMovieDetails = async id => {
    const res = await fetch(`http://www.omdbapi.com/?apikey=43bf3a93&i=${id}`);
    return await res.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['movie', selectedId],
    queryFn: () => fetchMovieDetails(selectedId),
  });

  useEffect(() => {
    setMovieDetail(data);
    setUserRating(
      favorites.find(fav => fav.imdbID === selectedId)?.userRating || 0
    );
  }, [data, favorites, selectedId]);

  useEffect(() => {
    document.title = `MovieRater | ${movieDetail?.Title}`;

    return () => (document.title = 'MovieRater');
  }, [movieDetail]);

  if (isLoading) {
    return <Loading />;
  }

  if (!movieDetail) {
    return null;
  }

  const isFavorite = favorites?.some(fav => fav.imdbID === movieDetail.imdbID);

  const handleBack = () => {
    setSelectedId(null);
  };

  const {
    Title: title,
    Poster: poster,
    Year: year,
    Runtime: runtime,
    Genre: genres,
    imdbRating: rating,
    Plot: overview,
    imdbID,
  } = movieDetail;

  const handleFavMovie = () => {
    const newFavorite = {
      title,
      poster,
      year,
      runtime: Number(runtime.split(' ').at(0)),
      genres,
      rating: Number(rating),
      overview,
      imdbID,
      userRating,
    };

    onAddFavorite(newFavorite);
    handleBack();
  };

  return (
    <div className="favorite-movie-card">
      <Button
        variant="ghost"
        size="icon"
        className="back-button"
        onClick={handleBack}
        aria-label="Back to favorites list"
      >
        <ArrowLeft className="back-icon" />
      </Button>
      <div className="favorite-movie-top">
        <img
          src={poster || '/placeholder.svg'}
          alt={`${title} poster`}
          className="favorite-movie-poster"
        />

        <div className="favorite-movie-info">
          <h3 className="favorite-movie-title">{title}</h3>
          <p className="favorite-movie-year">
            {year} • {runtime}
          </p>

          <div className="favorite-movie-genres">
            {genres?.split(',').map((genre, index) => (
              <Badge key={index} variant="outline" className="genre-badge">
                {genre}
              </Badge>
            ))}
          </div>

          <Badge variant="secondary" className="favorite-movie-rating">
            ★ {rating}
          </Badge>
        </div>
      </div>

      <div className="favorite-movie-overview">
        <p>{overview}</p>
        <div className="rating-container">
          <p className="rating-label">Rating:</p>
          {userRating > 0 ? (
            <p className="user-rating-display">
              You rated this movie:{' '}
              <span className="rating-value">{userRating}</span>
            </p>
          ) : (
            <StarRating
              count={10}
              onRate={setUserRating}
              initialRate={userRating}
            />
          )}
        </div>
      </div>

      <div className="favorite-movie-actions">
        <Button variant="ghost" size="sm" className="rate-button">
          Rate
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={handleFavMovie}
          aria-label={isFavorite ? 'Remove' : 'Add to favorites'}
        >
          <Heart className="favorite-icon" />
          {isFavorite ? 'Remove' : 'Add to favorites'}
        </Button>
      </div>
    </div>
  );
}

function ScrollArea({ className, children }) {
  return <div className={className}>{children}</div>;
}

function Input({ type, placeholder, className, value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <input
      type={type}
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={onChange}
      ref={inputRef}
    />
  );
}

function Button({ className, children, onClick }) {
  return (
    <button
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Badge({ className, children }) {
  return <div className={className}>{children}</div>;
}
