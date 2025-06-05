import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import MovieInputForm from './components/MovieInputForm';
import backgroundImage from './assets/n6.png';

function App() {
  const { isSignedIn } = useUser();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start text-white relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-70 z-0" />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Cinematic Navigation Bar */}
        <div className="w-full bg-black/40 backdrop-blur-sm shadow-lg shadow-red-900/10">
          <div className="w-full px-6 py-2">
            <div className="flex items-center justify-between">
              {/* Cinematic Brand - Left Aligned */}
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-white tracking-wider font-serif">CineMatch</h1>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-0.5 bg-red-600"></div>
                  <span className="text-xs text-red-400 font-medium uppercase tracking-wide">Movie Discovery</span>
                </div>
              </div>

              {/* Auth Section */}
              <div className="flex items-center space-x-4">
                {isSignedIn ? (
                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-red-900/30 border border-red-700/50 rounded">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-red-300 font-medium uppercase tracking-wide">Online</span>
                    </div>
                    <UserButton />
                  </div>
                ) : (
                  <>
                    <SignInButton mode="modal">
                      <button className="px-5 py-2 text-sm font-medium text-white border border-red-600/60 hover:border-red-500 hover:bg-red-900/20 rounded transition-all duration-300 uppercase tracking-wide">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-5 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded shadow-lg hover:shadow-red-900/30 transition-all duration-300 uppercase tracking-wide border border-red-500">
                        Join Now
                      </button>
                    </SignUpButton>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl text-violet-400 font-bold mb-6 mt-16">
          {/* Optional Title */}
        </h1>

        {/* Movie Input - Always accessible */}
        <MovieInputForm />
      </div>
    </div>
  );
}

export default App;