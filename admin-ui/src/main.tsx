import { createTheme, MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import '@mantine/core/styles.css'

/** Slightly richer than default Mantine gray — aligned with TADOR teal. */
const theme = createTheme({
  primaryColor: 'teal',
  fontFamily:
    'Manrope, "Segoe UI", system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily:
      'Manrope, "Segoe UI", system-ui, -apple-system, sans-serif',
    fontWeight: '650',
  },
  defaultRadius: 'md',
  colors: {
    // Darker neutrals so admin chrome is less washed-out
    gray: [
      '#f4f2ef',
      '#e8e4df',
      '#d4cfc8',
      '#bdb6ad',
      '#9e968c',
      '#7a736b',
      '#5c564f',
      '#403c38',
      '#2a2724',
      '#1a1816',
    ],
  },
  other: {
    pageBg: '#ebe6e0',
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
