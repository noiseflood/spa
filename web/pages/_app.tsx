import '@/styles/main.css';
import type { AppProps } from 'next/app';
import { SoundProvider } from '../contexts/SoundContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SoundProvider>
      <Component {...pageProps} />
    </SoundProvider>
  );
}
