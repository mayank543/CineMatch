import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        console.error('No code found in URL');
        return;
      }

      try {
        const token = await getToken();

        await fetch(`http://localhost:5050/api/oauth2callback?code=${code}`, {
  method: 'GET',
});

        if (!response.ok) throw new Error('OAuth callback failed');

        const result = await response.json();
        console.log('Calendar linked successfully:', result);

        // Redirect to home or success page
        navigate('/');
      } catch (err) {
        console.error('OAuth error:', err);
      }
    };

    handleOAuthCallback();
  }, [getToken, navigate, user]);

  return (
    <div className="text-black p-4">
      Linking your Google Calendar...
    </div>
  );
};

export default OAuthCallback;