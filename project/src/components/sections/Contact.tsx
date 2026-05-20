import { useState } from 'react';
import { Mail, Phone, Send, CheckCircle } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useManagedSectionContent } from '../../hooks/useManagedSectionContent';

const contactInfoFallback = {
  heading: 'Get in Touch',
  subheading: "Ready to start your sustainable journey? Let's create something amazing together.",
  email_primary: 'abhishek.deolalikar@gmail.com',
  phone: '+91 7020631149',
  whatsapp_number: '+91 7020631149',
  whatsapp_message: "Hi Cottonunique! I’d like to know more about your tote bags.",
};

export default function Contact() {
  const { content: contactInfo } = useManagedSectionContent('contact', contactInfoFallback);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    region: '',
    order_type: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!formData.message.trim()) {
      setError('Please tell us what you need.');
      return false;
    }
    if (formData.message.trim().length < 10) {
      setError('Please provide more detail in your message (at least 10 characters).');
      return false;
    }
    return true;
  };

  const isEmailValid = emailRegex.test(formData.email.trim());
  const canSubmit =
    !loading &&
    formData.name.trim().length > 0 &&
    isEmailValid &&
    formData.message.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    try {
      await apiClient.submitInquiry(formData);

      setSubmitted(true);
      setFormData({
        name: '',
        company: '',
        email: '',
        region: '',
        order_type: '',
        message: '',
      });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 paper-texture scroll-mt-24 md:scroll-mt-28"
      style={{ background: 'linear-gradient(to top, #EDE4D6, #FDF8F0)' }}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="heading-h2 mb-4 uppercase tracking-tight" style={{color: 'var(--heading-color)'}}>
            {String(contactInfo.heading || contactInfoFallback.heading)}
          </h2>
          <p className="body-text-lg max-w-3xl mx-auto" style={{color: 'var(--heading-color)'}}>
            {String(contactInfo.subheading || contactInfoFallback.subheading)}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="rounded-lg p-8 soft-shadow-lg mb-8 beige-border" style={{backgroundColor: 'var(--beige-200)'}}>
              <h3 className="text-2xl font-bold mb-6" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg beige-border" style={{backgroundColor: 'var(--beige-300)'}}>
                    <Mail size={24} style={{color: '#78350F'}} />
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Email Us</p>
                    <p className="font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>
                      {String(contactInfo.email_primary || contactInfoFallback.email_primary)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg beige-border" style={{backgroundColor: 'var(--beige-300)'}}>
                    <Phone size={24} style={{color: '#78350F'}} />
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wide" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Call Us</p>
                    <p className="font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>
                      {String(contactInfo.phone || contactInfoFallback.phone)}
                    </p>
                    <p className="text-sm font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>Mon-Fri, 9am-6pm IST</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg p-8 soft-shadow-lg beige-border" style={{backgroundColor: 'var(--beige-200)'}}>
              <h4 className="text-2xl font-bold mb-4" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>Why Choose Cottonunique?</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="flex-shrink-0 mt-1" size={20} style={{color: '#78350F'}} />
                  <span className="font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>GOTS & FSC certified sustainable materials</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="flex-shrink-0 mt-1" size={20} style={{color: '#78350F'}} />
                  <span className="font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>Complete export documentation support</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="flex-shrink-0 mt-1" size={20} style={{color: '#78350F'}} />
                  <span className="font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>Custom branding and design services</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="flex-shrink-0 mt-1" size={20} style={{color: '#78350F'}} />
                  <span className="font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>Flexible MOQ for pilot programs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="flex-shrink-0 mt-1" size={20} style={{color: '#78350F'}} />
                  <span className="font-normal" style={{color: '#3a2f1f', fontFamily: 'var(--body-font)'}}>Global delivery to 50+ countries</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg p-8 soft-shadow-lg beige-border" style={{backgroundColor: 'var(--beige-200)'}}>
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-6 beige-border soft-shadow" style={{backgroundColor: 'var(--beige-300)'}}>
                  <CheckCircle size={40} style={{color: 'var(--beige-700)'}} />
                </div>
                <h3 className="text-2xl font-black text-[#78350F] mb-4 uppercase tracking-wide" style={{fontFamily: 'var(--heading-font)'}}>Thank You!</h3>
                <p className="text-[#78350F] font-medium" style={{fontFamily: 'var(--heading-font)'}}>
                  Your inquiry has been received. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold mb-2" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg beige-border transition-all duration-200 font-normal"
                    style={{backgroundColor: 'var(--beige-100)', borderColor: 'var(--beige-300)', color: '#3a2f1f'}}
                    onFocus={(e) => {e.currentTarget.style.borderColor = 'var(--beige-600)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212, 165, 116, 0.2)'}}
                    onBlur={(e) => {e.currentTarget.style.borderColor = 'var(--beige-300)'; e.currentTarget.style.boxShadow = 'none'}}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-bold mb-2" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg beige-border transition-all duration-200 font-normal"
                    style={{backgroundColor: 'var(--beige-100)', borderColor: 'var(--beige-300)', color: '#3a2f1f'}}
                    onFocus={(e) => {e.currentTarget.style.borderColor = 'var(--beige-600)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212, 165, 116, 0.2)'}}
                    onBlur={(e) => {e.currentTarget.style.borderColor = 'var(--beige-300)'; e.currentTarget.style.boxShadow = 'none'}}
                    placeholder="Your Company"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold mb-2" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      if (!emailTouched) setEmailTouched(true);
                      handleChange(e);
                    }}
                    className="w-full px-4 py-3 rounded-lg beige-border transition-all duration-200 font-normal"
                    style={{backgroundColor: 'var(--beige-100)', borderColor: 'var(--beige-300)', color: '#3a2f1f'}}
                    onFocus={(e) => {e.currentTarget.style.borderColor = 'var(--beige-600)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212, 165, 116, 0.2)'}}
                    onBlur={(e) => {
                      setEmailTouched(true);
                      e.currentTarget.style.borderColor = 'var(--beige-300)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    placeholder="john@example.com"
                  />
                  {emailTouched && formData.email.trim() && !isEmailValid ? (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      Please enter a valid email address.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-bold mb-2" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>
                    Region
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg beige-border transition-all duration-200 font-normal"
                    style={{backgroundColor: 'var(--beige-100)', borderColor: 'var(--beige-300)', color: '#3a2f1f'}}
                    onFocus={(e) => {e.currentTarget.style.borderColor = 'var(--beige-600)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212, 165, 116, 0.2)'}}
                    onBlur={(e) => {e.currentTarget.style.borderColor = 'var(--beige-300)'; e.currentTarget.style.boxShadow = 'none'}}
                  >
                    <option value="">Select Region</option>
                    <option value="EU">European Union</option>
                    <option value="US">United States</option>
                    <option value="APAC">Asia Pacific</option>
                    <option value="ME">Middle East</option>
                    <option value="India">India</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="order_type" className="block text-sm font-bold mb-2" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>
                    Order Type
                  </label>
                  <select
                    id="order_type"
                    name="order_type"
                    value={formData.order_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg beige-border transition-all duration-200 font-normal"
                    style={{backgroundColor: 'var(--beige-100)', borderColor: 'var(--beige-300)', color: '#3a2f1f'}}
                    onFocus={(e) => {e.currentTarget.style.borderColor = 'var(--beige-600)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212, 165, 116, 0.2)'}}
                    onBlur={(e) => {e.currentTarget.style.borderColor = 'var(--beige-300)'; e.currentTarget.style.boxShadow = 'none'}}
                  >
                    <option value="">Select Order Type</option>
                    <option value="sample">Sample Order</option>
                    <option value="bulk">Bulk Order</option>
                    <option value="custom">Custom/Branded</option>
                    <option value="inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold mb-2" style={{color: '#78350F', fontFamily: 'var(--heading-font)'}}>
                    Tell us what you need *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg beige-border transition-all duration-200 resize-none font-normal"
                    style={{backgroundColor: 'var(--beige-100)', borderColor: 'var(--beige-300)', color: '#3a2f1f'}}
                    onFocus={(e) => {e.currentTarget.style.borderColor = 'var(--beige-600)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212, 165, 116, 0.2)'}}
                    onBlur={(e) => {e.currentTarget.style.borderColor = 'var(--beige-300)'; e.currentTarget.style.boxShadow = 'none'}}
                    placeholder="Please describe your requirements..."
                  />
                </div>

                {error && (
                  <div className="bg-red-100 text-red-800 p-4 rounded-none text-sm font-bold border-2 border-red-600">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full btn-cta-primary"
                  style={{
                    backgroundColor: !canSubmit ? 'var(--beige-400)' : 'var(--beige-700)',
                    color: 'white',
                    opacity: !canSubmit ? 0.7 : 1,
                    cursor: !canSubmit ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Send Inquiry"
                >
                  {loading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send Inquiry</span>
                      <Send size={20} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
