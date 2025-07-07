import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import stylesheet from "./tailwind.css?url";
import Navigation, { ThemeProvider } from "./components/Navigation";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* MathJax for equation rendering */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true,
                  processEnvironments: true,
                  processRefs: true,
                  tags: 'none',
                  tagSide: 'right',
                  tagIndent: '.8em',
                  multlineWidth: '85%',
                  macros: {}
                },
                options: {
                  skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
                  ignoreHtmlClass: 'tex2jax_ignore',
                  processHtmlClass: 'tex2jax_process'
                },
                chtml: {
                  scale: 1,
                  minScale: 0.5,
                  matchFontHeight: false,
                  displayAlign: 'center',
                  displayIndent: '0'
                },
                startup: {
                  ready: function() {
                    console.log('MathJax startup ready function called');
                    MathJax.startup.defaultReady();
                    // Mark MathJax as ready
                    window.MathJaxReady = true;
                    console.log('MathJax marked as ready');
                    // Initial render
                    setTimeout(() => {
                      if (MathJax.typesetPromise) {
                        console.log('Initial MathJax render');
                        MathJax.typesetPromise();
                      }
                    }, 100);
                  }
                }
              };
            `
          }}
        />
        <script
          type="text/javascript"
          id="MathJax-script"
          async
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        />
      </head>
      <body className="engineering-bg" style={{ fontFamily: "'Trebuchet MS', 'Segoe UI', Arial, sans-serif" }}>
        <ThemeProvider>
          <Navigation />
          <main className="min-h-screen">
            <Outlet />
          </main>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
