import '../styles/globals.css';
import { AppProvider } from '../contexts/AppProvider';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </ErrorBoundary>
  );
}

