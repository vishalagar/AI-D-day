import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import Link from "next/link";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ThemeProvider } from "@/hooks/use-theme";
import { siteOrigin } from "@/lib/config/site";

import "./globals.css";

const DESCRIPTION =
  "A satirical, community-kept map of the world's AI datacenters. Find out how close the nearest one is to you, then argue about the rest.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "AI D-Day — How close is the nearest AI?",
  description: DESCRIPTION,
  openGraph: { title: "How close is the nearest AI?", description: DESCRIPTION, siteName: "AI D-Day" },
  twitter: { card: "summary_large_image", title: "How close is the nearest AI?", description: DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning is required, not cosmetic: the script below
    // rewrites data-theme before React hydrates, so the server's "light" and
    // the client's "dark" legitimately differ on this one element. Without
    // it React logs a hydration error on every dark-mode page load.
    <html
      lang="en"
      data-theme="light"
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        <script
          // Runs before paint so a stored dark-mode preference doesn't flash
          // as light first. Light stays the default when nothing is stored,
          // deliberately ignoring prefers-color-scheme.
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('ai-dday-theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <ThemeProvider>
          <header className="flex items-center justify-between gap-3 border-b-2 border-line bg-panel px-4 py-2.5">
            <Link href="/" className="flex items-baseline gap-2.5">
              <span className="wordmark whitespace-nowrap text-lg leading-none">AI D-DAY</span>
              {/* The house style in four words. Dropped on narrow screens,
                  where the nav needs the room more than the joke does. */}
              <span className="hidden text-xs text-ink-dim sm:inline">
                keeping count, badly
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink href="/queue">Review queue</NavLink>
              <NavLink href="/guide">Field manual</NavLink>
              <ThemeToggle />
            </nav>
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="px-2 py-1 text-sm font-medium hover:underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
