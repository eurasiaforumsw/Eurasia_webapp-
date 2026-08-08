'use client';

import { useState } from 'react';

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface SocialAuthButtonsProps {
  onGoogleLogin?: () => Promise<void>;
  onFacebookLogin?: () => Promise<void>;
  onGithubLogin?: () => Promise<void>;
  isLoading?: boolean;
  showDivider?: boolean;
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M19.8 10.2273C19.8 9.51818 19.7364 8.83636 19.6182 8.18182H10.2V12.05H15.5818C15.3364 13.3 14.5909 14.3591 13.4727 15.0682V17.5773H16.7727C18.6727 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
    <path d="M10.2 20C12.9 20 15.1727 19.1045 16.7727 17.5773L13.4727 15.0682C12.5273 15.6682 11.3182 16.0227 10.2 16.0227C7.59091 16.0227 5.37273 14.2636 4.54091 11.9H1.13636V14.4909C2.72727 17.7591 6.20909 20 10.2 20Z" fill="#34A853"/>
    <path d="M4.54091 11.9C4.33636 11.3 4.22727 10.6591 4.22727 10C4.22727 9.34091 4.34091 8.7 4.54091 8.1V5.50909H1.13636C0.459091 6.85909 0.0909091 8.38636 0.0909091 10C0.0909091 11.6136 0.459091 13.1409 1.13636 14.4909L4.54091 11.9Z" fill="#FBBC05"/>
    <path d="M10.2 3.97727C11.4182 3.97727 12.5091 4.38182 13.3727 5.20455L16.3 2.27727C15.1682 1.22727 12.8955 0.5 10.2 0.5C6.20909 0.5 2.72727 2.74091 1.13636 6.00909L4.54091 8.6C5.37273 6.23636 7.59091 3.97727 10.2 3.97727Z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M20 10C20 4.47715 15.5229 0 10 0C4.47715 0 0 4.47715 0 10C0 14.9912 3.65684 19.1283 8.4375 19.8785V12.8906H5.89844V10H8.4375V7.79688C8.4375 5.29063 9.93047 3.90625 12.2146 3.90625C13.3084 3.90625 14.4531 4.10156 14.4531 4.10156V6.5625H13.1922C11.95 6.5625 11.5625 7.3334 11.5625 8.125V10H14.3359L13.8926 12.8906H11.5625V19.8785C16.3432 19.1283 20 14.9912 20 10Z" fill="#1877F2"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.475 0 0 4.475 0 10C0 14.425 2.8625 18.1625 6.8375 19.4875C7.3375 19.575 7.525 19.275 7.525 19.0125C7.525 18.775 7.5125 17.9875 7.5125 17.15C5 17.6125 4.35 16.5375 4.15 15.975C4.0375 15.6875 3.55 14.8 3.125 14.5625C2.775 14.375 2.275 13.9125 3.1125 13.9C3.9 13.8875 4.4625 14.625 4.65 14.925C5.55 16.4375 6.9875 16.0125 7.5625 15.75C7.65 15.1 7.9125 14.6625 8.2 14.4125C5.975 14.1625 3.65 13.3 3.65 9.475C3.65 8.3875 4.0375 7.4875 4.675 6.7875C4.575 6.5375 4.225 5.5125 4.775 4.1375C4.775 4.1375 5.6125 3.875 7.525 5.1625C8.325 4.9375 9.175 4.825 10.025 4.825C10.875 4.825 11.725 4.9375 12.525 5.1625C14.4375 3.8625 15.275 4.1375 15.275 4.1375C15.825 5.5125 15.475 6.5375 15.375 6.7875C16.0125 7.4875 16.4 8.375 16.4 9.475C16.4 13.3125 14.0625 14.1625 11.8375 14.4125C12.2 14.725 12.5125 15.325 12.5125 16.2625C12.5125 17.6 12.5 18.675 12.5 19.0125C12.5 19.275 12.6875 19.5875 13.1875 19.4875C17.1375 18.1625 20 14.4125 20 10C20 4.475 15.525 0 10 0Z"/>
  </svg>
);

export function SocialAuthButtons({
  onGoogleLogin,
  onFacebookLogin,
  onGithubLogin,
  isLoading = false,
  showDivider = true
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const providers: SocialProvider[] = [
    {
      id: 'google',
      name: 'Continue with Google',
      icon: <GoogleIcon />,
      color: '#4285F4'
    },
    {
      id: 'facebook',
      name: 'Continue with Facebook',
      icon: <FacebookIcon />,
      color: '#1877F2'
    },
    {
      id: 'github',
      name: 'Continue with GitHub',
      icon: <GithubIcon />,
      color: '#24292e'
    }
  ];

  const handleProviderClick = async (providerId: string) => {
    setLoadingProvider(providerId);

    try {
      if (providerId === 'google' && onGoogleLogin) {
        await onGoogleLogin();
      } else if (providerId === 'facebook' && onFacebookLogin) {
        await onFacebookLogin();
      } else if (providerId === 'github' && onGithubLogin) {
        await onGithubLogin();
      }
    } catch (error) {
      console.error(`${providerId} login failed:`, error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const availableProviders = providers.filter(provider => {
    if (provider.id === 'google') return !!onGoogleLogin;
    if (provider.id === 'facebook') return !!onFacebookLogin;
    if (provider.id === 'github') return !!onGithubLogin;
    return false;
  });

  if (availableProviders.length === 0) return null;

  return (
    <>
      <style jsx>{`
        .social-auth {
          --surface-2: #0F131C;
          --surface-3: #161D2B;
          --surface-4: #1E2636;
          --text-primary: #F8FAFC;
          --text-secondary: #CBD5E1;
          --text-muted: #64748B;
          --radius-full: 999px;
          --spacing-3: 0.75rem;
          --spacing-4: 1rem;
          --spacing-6: 1.5rem;
        }

        .social-auth {
          display: grid;
          gap: var(--spacing-4);
        }

        .social-auth__divider {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: var(--spacing-4);
          margin: var(--spacing-6) 0;
        }

        .social-auth__divider-line {
          height: 1px;
          background: var(--surface-4);
        }

        .social-auth__divider-text {
          font-size: clamp(0.75rem, 1.5vw, 0.875rem);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .social-auth__buttons {
          display: grid;
          gap: var(--spacing-3);
        }

        .social-auth__button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3) var(--spacing-6);
          background: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .social-auth__button:hover:not(:disabled) {
          background: var(--surface-4);
          transform: translateY(-1px);
        }

        .social-auth__button:active:not(:disabled) {
          transform: translateY(0);
        }

        .social-auth__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .social-auth__button:focus-visible {
          outline: 2px solid var(--text-muted);
          outline-offset: 2px;
        }

        .social-auth__button-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          transition: opacity 0.2s ease;
        }

        .social-auth__button--loading .social-auth__button-content {
          opacity: 0;
        }

        .social-auth__spinner {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }

        .social-auth__spinner-svg {
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="social-auth">
        {showDivider && (
          <div className="social-auth__divider">
            <div className="social-auth__divider-line" />
            <span className="social-auth__divider-text">Or continue with</span>
            <div className="social-auth__divider-line" />
          </div>
        )}

        <div className="social-auth__buttons">
          {availableProviders.map(provider => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderClick(provider.id)}
              disabled={isLoading || loadingProvider !== null}
              className={`social-auth__button ${
                loadingProvider === provider.id ? 'social-auth__button--loading' : ''
              }`}
              aria-label={provider.name}
            >
              <div className="social-auth__button-content">
                {provider.icon}
                <span>{provider.name}</span>
              </div>

              {loadingProvider === provider.id && (
                <div className="social-auth__spinner" aria-hidden="true">
                  <svg className="social-auth__spinner-svg" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="60"
                      strokeDashoffset="20"
                      opacity="0.3"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
