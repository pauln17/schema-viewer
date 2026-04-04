import "@/styles/globals.css";
import "react-toastify/ReactToastify.css";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { AppProps } from "next/app";
import { Nunito } from "next/font/google";
import { ToastContainer } from "react-toastify";

import { queryPersister } from "@/lib/query-persister";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-nunito",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        closeOnClick
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        theme="dark"
        style={{ zIndex: 99999 }}
      />
      <main className={nunito.className}>
        <Component {...pageProps} />
      </main>
    </PersistQueryClientProvider>
  );
}
