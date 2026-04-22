import type { Faq, HomepageSection, ServiceCard, SiteContent, SiteSettings, Testimonial } from '../types';

export const defaultSettings: SiteSettings = {
  id: 'site-settings',
  businessName: 'Will Powell Appliance Repairs',
  tagline: 'White goods repairs',
  phone: '',
  email: '',
  whatsappNumber: '',
  primaryArea: '',
  openingHours: 'Monday-Friday, 8am-6pm',
  googleReviewsUrl: '',
  themeKey: 'classic-navy',
};

export const defaultSections: HomepageSection[] = [
  {
    id: 'hero',
    sectionType: 'hero',
    title: 'Need your washing machine fixed?',
    subtitle: 'Washing machines, dishwashers, ovens, fridges, freezers and tumble dryers',
    body: 'Call Will directly for help with washing machines, dishwashers, ovens, fridges, freezers and tumble dryers. Tell him what is wrong and he will explain the next step.',
    content: {
      primaryCta: 'Call Will now',
      secondaryCta: 'Request a callback',
      badge: 'Local white goods repairs',
    },
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: 'trust-strip',
    sectionType: 'trust_strip',
    title: 'Simple, local help',
    subtitle: 'No fuss',
    body: '',
    content: {
      items: ['Speak directly to Will', 'Explain the fault over the phone', 'Arrange a repair visit'],
    },
    sortOrder: 2,
    isVisible: true,
  },
  {
    id: 'services',
    sectionType: 'services',
    title: 'Common appliance repairs',
    subtitle: 'What Will can help with',
    body: 'If your appliance is not listed, call anyway and describe the problem.',
    content: {},
    sortOrder: 3,
    isVisible: true,
  },
  {
    id: 'how-it-works',
    sectionType: 'how_it_works',
    title: 'How booking works',
    subtitle: 'Simple process',
    body: 'Get in touch, describe the fault, and arrange a repair visit.',
    content: {
      steps: ['Call, WhatsApp, or send the form', 'Share the appliance type and fault', 'Arrange a repair visit'],
    },
    sortOrder: 4,
    isVisible: false,
  },
  {
    id: 'areas',
    sectionType: 'areas',
    title: 'Areas covered',
    subtitle: 'Local service',
    body: 'Add the towns and villages Will covers here.',
    content: {
      areas: [],
    },
    sortOrder: 5,
    isVisible: false,
  },
  {
    id: 'reviews',
    sectionType: 'reviews',
    title: 'Trusted by local customers',
    subtitle: 'Reviews',
    body: 'Genuine reviews can be added here when Will has chosen which ones to show.',
    content: {},
    sortOrder: 6,
    isVisible: true,
  },
  {
    id: 'faq',
    sectionType: 'faq',
    title: 'Frequently asked questions',
    subtitle: 'Before booking',
    body: 'A few useful answers before you call.',
    content: {},
    sortOrder: 7,
    isVisible: true,
  },
  {
    id: 'contact-form',
    sectionType: 'contact_form',
    title: 'Request a repair callback',
    subtitle: 'Quick form',
    body: 'If you prefer not to call, send the basics and Will will get back to you.',
    content: {},
    sortOrder: 8,
    isVisible: true,
  },
];

export const defaultServices: ServiceCard[] = [
  {
    id: 'washing-machines',
    title: 'Washing machines',
    shortDescription: 'Not spinning, leaking, not draining, door locked.',
    commonFaults: ['Not spinning', 'Leaking', 'Not draining', 'Door locked'],
    iconLabel: 'Washer',
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: 'dishwashers',
    title: 'Dishwashers',
    shortDescription: 'Poor cleaning, blocked, leaking, error codes.',
    commonFaults: ['Not cleaning', 'Blocked', 'Leaking', 'Error codes'],
    iconLabel: 'Dishwasher',
    sortOrder: 2,
    isVisible: true,
  },
  {
    id: 'ovens',
    title: 'Ovens & cookers',
    shortDescription: 'Not heating, faulty element, thermostat issues.',
    commonFaults: ['Not heating', 'Faulty element', 'Thermostat issues'],
    iconLabel: 'Oven',
    sortOrder: 3,
    isVisible: true,
  },
  {
    id: 'fridges-freezers',
    title: 'Fridges & freezers',
    shortDescription: 'Not cooling, noisy, icing up, seal issues.',
    commonFaults: ['Not cooling', 'Noisy', 'Icing up', 'Seal issues'],
    iconLabel: 'Fridge',
    sortOrder: 4,
    isVisible: true,
  },
  {
    id: 'tumble-dryers',
    title: 'Tumble dryers',
    shortDescription: 'Not heating, drum not turning, noisy cycles.',
    commonFaults: ['Not heating', 'Drum not turning', 'Noisy cycles'],
    iconLabel: 'Dryer',
    sortOrder: 5,
    isVisible: true,
  },
];

export const defaultTestimonials: Testimonial[] = [
  {
    id: 'review-1',
    quote: 'Arrived on time, fixed the washing machine quickly and explained everything clearly.',
    customerName: 'Local customer',
    location: '',
    rating: 5,
    sortOrder: 1,
    isVisible: false,
  },
  {
    id: 'review-2',
    quote: 'Friendly, tidy and honest about whether the repair was worth doing.',
    customerName: 'Homeowner',
    location: '',
    rating: 5,
    sortOrder: 2,
    isVisible: false,
  },
];

export const defaultFaqs: Faq[] = [
  {
    id: 'callout-fee',
    question: 'Do you charge a call-out fee?',
    answer: 'Will can explain any call-out or diagnostic charge before arranging a visit.',
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: 'brands',
    question: 'What appliances can Will repair?',
    answer: 'Washing machines, dishwashers, ovens, cookers, fridges, freezers and tumble dryers.',
    sortOrder: 2,
    isVisible: true,
  },
  {
    id: 'guarantee',
    question: 'What should I have ready when I call?',
    answer: 'The appliance type, brand if you know it, postcode, and a short description of the fault.',
    sortOrder: 3,
    isVisible: true,
  },
];

export const defaultContent: SiteContent = {
  settings: defaultSettings,
  sections: defaultSections,
  services: defaultServices,
  testimonials: defaultTestimonials,
  faqs: defaultFaqs,
};
