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
      <div className="relative z-10 w-full flex flex-col items-center p-4">
        {/* Top Bar */}
        <div className="w-full h-12 flex items-center justify-between px-4 border-b border-gray-700">
          <span className="text-sm font-semibold text-white">CineMatch</span>

          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-3 py-1 rounded shadow">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded shadow">
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            )}
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