import { resolveMediaUrl } from '../../lib/api';
import { Sparkles, Lightbulb, Rocket, Leaf, ShieldCheck, Globe2, HandHeart } from 'lucide-react';
import { useManagedSectionContent } from '../../hooks/useManagedSectionContent';
import { IMG } from '../../lib/imageSizes';

const mainContentHeaderColor = '#4A352F';
const mainContentIconBg = '#F3EDDC';
const mainContentBulletColor = '#4A352F';

const bulletIcon = (
  <span
    className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
    style={{ backgroundColor: mainContentBulletColor }}
    aria-hidden
  />
);

const listItemClass = 'flex gap-2 text-xs sm:text-sm leading-relaxed';
const iconBoxClass = 'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center';
const sectionHeadingClass = 'text-sm sm:text-base font-bold';

const aboutFallback = {
  heading: 'ABOUT US',
  subheading: 'Premium Sustainable Tote Bags',
  description:
    'We craft premium cotton tote bags in India for businesses, exporters, and corporates worldwide. Every piece is ethically sourced, GOTS certified, and built to meet the highest global standards for export-ready programmes—without compromising on quality or sustainability.',
  image_left: '/images/aboutus/about2.png',
  image_right: '/images/aboutus/about1.png',
};

const missionFallback = {
  content:
    'Deliver premium, sustainable tote bags that meet the highest global standards.',
};

const storyFallback = {
  content:
    'Born from a passion for sustainability and global commerce, Cottonunique blends natural materials with modern branding to serve clients across continents.',
};

export default function About() {
  const { content: aboutContent } = useManagedSectionContent('about', aboutFallback);
  const { content: missionContent } = useManagedSectionContent('about_mission', missionFallback);
  const { content: storyContent } = useManagedSectionContent('about_story', storyFallback);

  return (
    <section id="about" className="pt-8 sm:pt-10 md:pt-14 pb-16 bg-white">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-10">
          <h2
            className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-3"
            style={{ color: '#1a1a1a', fontFamily: 'var(--heading-font)' }}
          >
            {String(aboutContent.heading || aboutFallback.heading)}
          </h2>
          <p
            className="text-xl sm:text-2xl font-semibold mb-4"
            style={{ color: '#1a1a1a', fontFamily: 'var(--heading-font)' }}
          >
            {String(aboutContent.subheading || aboutFallback.subheading)}
          </p>
          <p
            className="text-sm sm:text-base leading-relaxed max-w-2xl"
            style={{ color: '#2d2d2d', fontFamily: 'var(--body-font)' }}
          >
            {String(aboutContent.description || aboutFallback.description)}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-start min-w-0">
          {/* Left column - single image */}
          <div className="min-w-0">
            <img
              src={resolveMediaUrl(String(aboutContent.image_left || aboutFallback.image_left))}
              alt="Cottonunique organic cotton tote bags with GOTS certification"
              className="w-full h-72 md:h-80 object-contain object-center -ml-4 lg:-ml-6"
              width={IMG.about.width}
              height={IMG.about.height}
              loading="lazy"
            />
          </div>

          {/* Right column - image above Modern Elegance, then Philosophy, Mission */}
          <div className="space-y-6 lg:-mt-72 min-w-0">
            <img
              src={resolveMediaUrl(String(aboutContent.image_right || aboutFallback.image_right))}
              alt="Cottonunique sustainable tote bags and certifications"
              className="w-full h-80 md:h-96 object-cover object-center scale-95 -mt-8 lg:-mt-14"
              width={IMG.about.width}
              height={IMG.about.height}
              loading="lazy"
            />
            <div>
              {/* Modern Elegance */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={iconBoxClass} style={{ backgroundColor: mainContentIconBg }}>
                    <Sparkles size={16} style={{ color: mainContentHeaderColor }} />
                  </div>
                  <h4 className={sectionHeadingClass} style={{ color: mainContentHeaderColor, fontFamily: 'var(--heading-font)' }}>
                    Modern Elegance
                  </h4>
                </div>
                <p className="text-xs sm:text-sm leading-snug" style={{ fontFamily: 'var(--body-font)', color: '#2d2d2d' }}>
                  {String(storyContent.content || storyFallback.content)}
                </p>
              </div>

              <div className="h-px w-full mb-4" style={{ backgroundColor: '#e5e0d8' }} />

              {/* Our Philosophy */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={iconBoxClass} style={{ backgroundColor: mainContentIconBg }}>
                    <Lightbulb size={16} style={{ color: mainContentHeaderColor }} />
                  </div>
                  <h4 className={sectionHeadingClass} style={{ color: mainContentHeaderColor, fontFamily: 'var(--heading-font)' }}>
                    Our Philosophy
                  </h4>
                </div>
                <ul className="space-y-2 pl-10 list-none text-xs sm:text-sm" style={{ fontFamily: 'var(--body-font)', color: '#2d2d2d' }}>
                  <li className={listItemClass}>
                    {bulletIcon}
                    <span>{String(storyContent.content || storyFallback.content)}</span>
                  </li>
                  <li className={listItemClass}>
                    {bulletIcon}
                    <span>Every tote bag is designed with care and attention to detail.</span>
                  </li>
                </ul>
              </div>

              <div className="h-px w-full mb-4" style={{ backgroundColor: '#e5e0d8' }} />

              {/* Our Mission */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={iconBoxClass} style={{ backgroundColor: mainContentIconBg }}>
                    <Rocket size={16} style={{ color: mainContentHeaderColor }} />
                  </div>
                  <h4 className={sectionHeadingClass} style={{ color: mainContentHeaderColor, fontFamily: 'var(--heading-font)' }}>
                    Our Mission
                  </h4>
                </div>
                <ul className="space-y-2 pl-10 list-none text-xs sm:text-sm" style={{ fontFamily: 'var(--body-font)', color: '#2d2d2d' }}>
                  <li className={listItemClass}>
                    {bulletIcon}
                    <span>{String(missionContent.content || missionFallback.content)}</span>
                  </li>
                  <li className={listItemClass}>
                    {bulletIcon}
                    <span>Ethically sourced, intelligently designed, and export-ready products.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Our Values - four cards in one row on large screens */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10 items-stretch">
          {/* Sustainability card */}
          <div
            className="rounded-lg px-4 py-3 flex flex-col items-center justify-center text-center min-h-[150px]"
            style={{ backgroundColor: '#FFF9F0' }}
          >
            <div className="flex justify-center mb-1.5">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                style={{ backgroundColor: '#F3EDDC' }}
              >
                <Leaf size={16} style={{ color: mainContentHeaderColor }} />
              </span>
            </div>
            <h3
              className="text-lg sm:text-xl font-bold mb-1 leading-tight"
              style={{ color: mainContentHeaderColor, fontFamily: 'var(--heading-font)' }}
            >
              Sustainability First
            </h3>
            <p
              className="text-xs sm:text-sm max-w-[240px] mx-auto leading-snug"
              style={{ color: '#4A352F', fontFamily: 'var(--body-font)' }}
            >
              100% organic cotton with GOTS certification.
            </p>
          </div>

          {/* Quality card */}
          <div
            className="rounded-lg px-4 py-3 flex flex-col items-center justify-center text-center min-h-[150px]"
            style={{ backgroundColor: '#FFF9F0' }}
          >
            <div className="flex justify-center mb-1.5">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                style={{ backgroundColor: '#F3EDDC' }}
              >
                <ShieldCheck size={16} style={{ color: mainContentHeaderColor }} />
              </span>
            </div>
            <h3
              className="text-lg sm:text-xl font-bold mb-1 leading-tight"
              style={{ color: mainContentHeaderColor, fontFamily: 'var(--heading-font)' }}
            >
              Quality Excellence
            </h3>
            <p
              className="text-xs sm:text-sm max-w-[240px] mx-auto leading-snug"
              style={{ color: '#4A352F', fontFamily: 'var(--body-font)' }}
            >
              Premium materials and craftsmanship in every product.
            </p>
          </div>

          {/* Export-ready card */}
          <div
            className="rounded-lg px-4 py-3 flex flex-col items-center justify-center text-center min-h-[150px]"
            style={{ backgroundColor: '#FFF9F0' }}
          >
            <div className="flex justify-center mb-1.5">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                style={{ backgroundColor: '#F3EDDC' }}
              >
                <Globe2 size={16} style={{ color: mainContentHeaderColor }} />
              </span>
            </div>
            <h3
              className="text-lg sm:text-xl font-bold mb-1 leading-tight"
              style={{ color: mainContentHeaderColor, fontFamily: 'var(--heading-font)' }}
            >
              Export Ready
            </h3>
            <p
              className="text-xs sm:text-sm max-w-[240px] mx-auto leading-snug"
              style={{ color: '#4A352F', fontFamily: 'var(--body-font)' }}
            >
              Designed for international markets with consistent quality control.
            </p>
          </div>

          {/* Ethical sourcing card */}
          <div
            className="rounded-lg px-4 py-3 flex flex-col items-center justify-center text-center min-h-[150px]"
            style={{ backgroundColor: '#FFF9F0' }}
          >
            <div className="flex justify-center mb-1.5">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                style={{ backgroundColor: '#F3EDDC' }}
              >
                <HandHeart size={16} style={{ color: mainContentHeaderColor }} />
              </span>
            </div>
            <h3
              className="text-lg sm:text-xl font-bold mb-1 leading-tight"
              style={{ color: mainContentHeaderColor, fontFamily: 'var(--heading-font)' }}
            >
              Ethical Sourcing
            </h3>
            <p
              className="text-xs sm:text-sm max-w-[240px] mx-auto leading-snug"
              style={{ color: '#4A352F', fontFamily: 'var(--body-font)' }}
            >
              Fair, transparent supply chains from farm to finished tote.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
