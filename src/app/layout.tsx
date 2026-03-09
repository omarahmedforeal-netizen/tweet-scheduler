import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '\u0645\u062C\u062F\u0648\u0644 \u0627\u0644\u062A\u063A\u0631\u064A\u062F\u0627\u062A | Tweet Scheduler',
  description: '\u062C\u062F\u0648\u0644 \u062A\u063A\u0631\u064A\u062F\u0627\u062A\u0643 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0628\u0633\u0647\u0648\u0644\u0629',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">\uD83D\uDC26</text></svg>',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-arabic antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
