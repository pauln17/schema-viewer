import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Nunito } from 'next/font/google';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-nunito",
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <main className={nunito.className}>
        <Component {...pageProps} />
      </main>
    </QueryClientProvider>
  );
}
