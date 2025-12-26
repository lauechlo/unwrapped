export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Branding */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Unwrapped
            </h3>
            <p className="text-sm text-gray-500">
              Built with 💜 at Princeton
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
            <a
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="https://developer.spotify.com/documentation/web-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Powered by Spotify
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="mailto:unwrapped@princeton.edu"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500 text-center md:text-right">
            © {new Date().getFullYear()} Unwrapped
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-8 border-t border-zinc-800">
          <p className="text-xs text-gray-600 text-center max-w-3xl mx-auto leading-relaxed">
            This is an independent project and is not affiliated with, endorsed by, or connected to Spotify AB or any of its affiliates.
            Spotify is a registered trademark of Spotify AB. All insights are generated for entertainment purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
