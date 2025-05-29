import MovieInputForm from './components/MovieInputForm';
import backgroundImage from './assets/n6.png'; 

function App() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start text-white relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black opacity-70 z-0" />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center p-4">
        {/* Top Bar */}
        <div className="w-full h-12 flex items-center px-4 border-b border-gray-700">
          <span className="text-sm font-semibold text-white">CineMatch</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl text-violet-400 font-bold mb-6 mt-16">
          
        </h1>

        <MovieInputForm />
      </div>
    </div>
  );
}

export default App;