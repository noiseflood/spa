import '@/styles/main.css';
import type { AppProps } from 'next/app';
import { SoundProvider } from '../contexts/SoundContext';
import ErrorBoundary from '../components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <SoundProvider>
        <Component {...pageProps} />
      </SoundProvider>
    </ErrorBoundary>
  );
}
