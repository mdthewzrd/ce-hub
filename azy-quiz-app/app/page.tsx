'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleStartQuiz = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmContent = urlParams.get('utm_content');

    if (utmSource || utmCampaign || utmContent) {
      sessionStorage.setItem('utmParams', JSON.stringify({
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
      }));
    }

    router.push('/quiz');
  };

  return (
    <main className="min-h-screen bg-azyr-warm-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center animate-fadeIn">
          {/* Logo */}
          <h1 className="text-7xl md:text-9xl font-serif font-bold text-azyr-black mb-4 tracking-tight">
            AZYR
          </h1>
          <p className="text-xl md:text-2xl font-sans font-light text-azyr-charcoal mb-2 tracking-wide">
            SPECS
          </p>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-serif font-semibold text-azyr-black mb-6 mt-12 leading-tight">
            Your Perfect Vintage Frame,
            <br />
            <span className="text-azyr-charcoal italic">Thoughtfully Curated</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-azyr-charcoal mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Discover handpicked vintage eyewear from the 1950s–2000s,
            reimagined with modern lenses for timeless style.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleStartQuiz}
            className="group relative px-10 py-4 bg-azyr-black text-white text-lg font-sans font-light tracking-wide rounded-sm hover:bg-azyr-charcoal transition-all duration-300"
          >
            <span className="relative z-10">Find Your Vintage Frame</span>
            <div className="absolute inset-0 bg-azyr-charcoal opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-azyr-taupe font-sans">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-azyr-gold rounded-full"></div>
              <span>Handpicked Vintage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-azyr-gold rounded-full"></div>
              <span>Sustainable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-azyr-gold rounded-full"></div>
              <span>One-of-a-Kind</span>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-azyr-cream p-10 rounded-sm">
            <div className="text-4xl mb-4">✦</div>
            <h3 className="text-xl font-serif font-semibold mb-3 text-azyr-black">
              Vintage Curation
            </h3>
            <p className="text-azyr-charcoal font-light leading-relaxed">
              Each frame handpicked globally from the 1950s through 2000s,
              with our heart in the iconic styles of the 1960s
            </p>
          </div>

          <div className="bg-azyr-cream p-10 rounded-sm">
            <div className="text-4xl mb-4">◇</div>
            <h3 className="text-xl font-serif font-semibold mb-3 text-azyr-black">
              Modern Revival
            </h3>
            <p className="text-azyr-charcoal font-light leading-relaxed">
              Pre-loved frames transformed with premium lenses—
              prescription, polarized, or tinted—for today's wearer
            </p>
          </div>

          <div className="bg-azyr-cream p-10 rounded-sm">
            <div className="text-4xl mb-4">○</div>
            <h3 className="text-xl font-serif font-semibold mb-3 text-azyr-black">
              Sustainability
            </h3>
            <p className="text-azyr-charcoal font-light leading-relaxed">
              Giving new life to timeless design—
              where sustainability meets distinctive style
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24 text-center">
          <h3 className="text-3xl font-serif font-semibold mb-12 text-azyr-black">
            How It Works
          </h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-azyr-black text-white rounded-sm flex items-center justify-center text-xl font-serif">
                1
              </div>
              <div className="text-left">
                <p className="font-serif font-medium text-azyr-black">Share Your Style</p>
                <p className="text-sm text-azyr-taupe font-light">Face shape, era, vibe</p>
              </div>
            </div>

            <div className="hidden md:block text-azyr-taupe text-2xl font-light">—</div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-azyr-charcoal text-white rounded-sm flex items-center justify-center text-xl font-serif">
                2
              </div>
              <div className="text-left">
                <p className="font-serif font-medium text-azyr-black">We Curate</p>
                <p className="text-sm text-azyr-taupe font-light">10 vintage picks matched to you</p>
              </div>
            </div>

            <div className="hidden md:block text-azyr-taupe text-2xl font-light">—</div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-azyr-black text-white rounded-sm flex items-center justify-center text-xl font-serif">
                3
              </div>
              <div className="text-left">
                <p className="font-serif font-medium text-azyr-black">Shop Unique</p>
                <p className="text-sm text-azyr-taupe font-light">One-of-a-kind frames, modernized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vintage Eras Showcase */}
        <div className="mt-24 text-center">
          <h3 className="text-3xl font-serif font-semibold mb-8 text-azyr-black">
            The Eras We Love
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {['1950s', '1960s', '1970s', '1980s', '1990s'].map((era) => (
              <div
                key={era}
                className="bg-azyr-cream p-6 rounded-sm hover:bg-azyr-taupe hover:text-white transition-all duration-300 cursor-pointer"
              >
                <span className="font-serif text-lg">{era}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-azyr-taupe font-light">
            Specializing in iconic 1960s cat-eye & aviator styles
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-24 py-12 border-t border-azyr-cream">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-azyr-taupe font-sans">
            © 2025 AZYR Specs. Sustainable Vintage Eyewear.
          </p>
          <p className="text-xs text-azyr-taupe mt-2 font-light">
            New York • Worldwide Shipping
          </p>
        </div>
      </footer>
    </main>
  );
}
