import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { CartSheet } from "@/components/CartSheet";
import { Toaster } from "@/components/ui/sonner";
import { captureReferral } from "@/lib/referral";
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page isn't on our shelves.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Back to the store
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Learnova Books Store" },
      { name: "description", content: "Afghan online bookstore — hard copies delivered across Afghanistan and instant PDF soft copies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600&family=Vazirmatn:wght@400;600&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
useEffect(() => { captureReferral(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Header />
        <main className="min-h-[70vh]">
          <Outlet />
        </main>
        <footer className="mt-16 border-t bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-display text-lg">Learnova Books</p>
              <p className="mt-2 text-muted-foreground">Hard copies delivered across Afghanistan, PDFs worldwide.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-muted-foreground hover:text-foreground">Books · کتابونه</Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground">About · زموږ په اړه</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact · اړیکه</Link>
            </div>
            <div className="text-muted-foreground">
              <p>WhatsApp: 0765 238 918</p>
              <p>Kabul, Afghanistan</p>
            </div>
          </div>
          <p className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Learnova Books Store</p>
        </footer>
        <CartSheet />
        <Toaster position="top-center" />
      </StoreProvider>
    </QueryClientProvider>
  );
}
