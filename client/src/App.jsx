import MovieInputForm from './components/MovieInputForm';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-black dark:text-white p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <h1 className="text-3xl text-violet-600 dark:text-violet-300 font-bold mb-4">
        Watch Together Finder 🎬
      </h1>
      <MovieInputForm />
    </div>
  );
}

export default App;