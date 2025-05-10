import MovieInputForm from './components/MovieInputForm';



function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl text-violet-600 font-bold mb-4">Watch Together Finder 🎬</h1>
      {/* Your form and UI will go here */}
      <MovieInputForm/>
    </div>
  );
}

export default App;