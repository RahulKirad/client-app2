import { Briefcase, Users, Building2, Heart, Calendar, FileCheck } from 'lucide-react';
import { useManagedSectionContent } from '../../hooks/useManagedSectionContent';
import Banner from './Banner';

const corporateFallback = {
  heading: 'Smart Branding for Global Teams',
  subheading:
    'Transform your corporate gifting with sustainable, custom-branded solutions. Get custom printed cotton tote bags with your logo, colours, and branding — perfect for gifting, retail, and events. We fulfil bulk orders with fast turnaround times and export-ready packaging — minimum order quantities available for all business sizes.',
  cta: 'Book a Consultation',
  image: '/images/corporate/image2.png',
};

export default function Corporate() {
  const { content: corporateContent } = useManagedSectionContent('corporate', corporateFallback);
  const services = [
    {
      icon: Briefcase,
      title: 'Custom Logo Printing',
      description: 'High-quality, eco-friendly printing with your brand identity',
    },
    {
      icon: Users,
      title: 'Co-branded Gifting Programs',
      description: 'Collaborative designs that elevate your brand story',
    },
    {
      icon: Building2,
      title: 'White-label Export Support',
      description: 'Complete documentation and compliance for global delivery',
    },
    {
      icon: FileCheck,
      title: 'ESG Sustainability Reports',
      description: 'Detailed impact reports for your corporate sustainability goals',
    },
  ];

  const industries = [
    {
      icon: Building2,
      name: 'Retail & Fashion',
      description: 'Branded bags for stores, events, and customer appreciation',
    },
    {
      icon: Calendar,
      name: 'Hospitality & Events',
      description: 'Premium welcome gifts and conference merchandise',
    },
    {
      icon: Briefcase,
      name: 'Tech & Startups',
      description: 'Modern designs for onboarding kits and swag boxes',
    },
    {
      icon: Heart,
      name: 'NGOs & CSR Programs',
      description: 'Ethical products that align with social impact initiatives',
    },
  ];

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="corporate"
      className="py-20 paper-texture"
      style={{ background: 'linear-gradient(to right, #F0EBE3, #FFFBF7)' }}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-h2 mb-4 uppercase tracking-tight" style={{color: 'var(--heading-color)'}}>
            {String(corporateContent.heading || corporateFallback.heading)}
          </h2>
          <p className="body-text-lg max-w-3xl mx-auto" style={{color: 'var(--heading-color)'}}>
            {String(corporateContent.subheading || corporateFallback.subheading)}
          </p>
        </div>

        {/* Corporate Banner */}
        <div className="mb-12">
          <Banner
            bannerKey="corporate_banner"
            fallback={{
              title: 'Corporate Solutions',
              subtitle: 'Custom branding for global teams',
              image: '/images/corporate/image2.png',
            }}
            className="soft-shadow-lg"
          />
        </div>

        <div className="mb-20">
          <h3 className="text-3xl font-black text-[#78350F] text-center mb-12 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>What We Offer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--beige-200)] group"
                style={{backgroundColor: 'white'}}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-xl mb-4 transition-all duration-300 group-hover:scale-110" style={{backgroundColor: 'var(--beige-200)'}}>
                    <service.icon size={32} style={{color: 'var(--beige-700)'}} />
                  </div>
                  <div className="w-full">
                    <h4 className="text-lg font-bold mb-3 leading-tight" style={{color: 'var(--heading-color)', fontFamily: 'var(--heading-font)'}}>{service.title}</h4>
                    <p className="text-sm leading-relaxed" style={{color: 'var(--text-primary)', fontFamily: 'var(--body-font)'}}>{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-3xl font-black text-[#78350F] text-center mb-12 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>Industries We Serve</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--beige-300)] group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-4 rounded-xl flex-shrink-0 transition-all duration-300 group-hover:scale-110" style={{backgroundColor: 'var(--beige-400)'}}>
                    <industry.icon size={32} style={{color: 'var(--beige-700)'}} />
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-lg font-bold text-[#78350F] mb-2 uppercase tracking-wide leading-tight" style={{fontFamily: 'var(--heading-font)'}}>{industry.name}</h4>
                    <p className="text-sm text-[#5a4a3a] leading-relaxed" style={{fontFamily: 'var(--body-font)'}}>{industry.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-8 sm:p-12 soft-shadow-lg beige-border" style={{backgroundColor: 'var(--beige-300)'}}>
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Ready to Elevate Your Brand?</h3>
            <p className="text-lg mb-8 font-normal" style={{color: '#5a4a3a', fontFamily: 'var(--body-font)'}}>
              Let's create sustainable, custom-branded solutions that reflect your company's values
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={scrollToContact}
                className="btn-cta-primary"
                style={{backgroundColor: 'var(--beige-700)', color: 'white'}}
                aria-label="Book a Consultation"
              >
                {String(corporateContent.cta || corporateFallback.cta)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
