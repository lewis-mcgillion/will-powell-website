export type HomepageSectionType =
  | 'hero'
  | 'trust_strip'
  | 'services'
  | 'how_it_works'
  | 'areas'
  | 'reviews'
  | 'faq'
  | 'contact_form'
  | 'cta_band'
  | 'custom_text';

export type RepairRequestStatus =
  | 'new'
  | 'contacted'
  | 'quoted'
  | 'booked'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type SiteThemeKey = 'classic-navy' | 'burgundy-cream' | 'forest-cream' | 'slate-amber';

export interface SiteSettings {
  id: string;
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  primaryArea: string;
  openingHours: string;
  googleReviewsUrl: string;
  themeKey: SiteThemeKey;
}

export interface HomepageSection {
  id: string;
  sectionType: HomepageSectionType;
  title: string;
  subtitle: string;
  body: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isVisible: boolean;
}

export interface ServiceCard {
  id: string;
  title: string;
  shortDescription: string;
  commonFaults: string[];
  iconLabel: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  customerName: string;
  location: string;
  rating: number;
  sortOrder: number;
  isVisible: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface SiteContent {
  settings: SiteSettings;
  sections: HomepageSection[];
  services: ServiceCard[];
  testimonials: Testimonial[];
  faqs: Faq[];
}

export interface RepairRequestInput {
  customerName: string;
  phone: string;
  email?: string;
  postcode: string;
  applianceType: string;
  brand?: string;
  faultDescription: string;
  preferredContactMethod: string;
  preferredWindow?: string;
  sourcePath?: string;
}

export interface RepairRequest extends RepairRequestInput {
  id: string;
  status: RepairRequestStatus;
  emailDeliveryStatus: 'pending' | 'sent' | 'failed' | 'not_configured';
  createdAt: string;
  updatedAt: string;
  notes: RepairRequestNote[];
}

export interface RepairRequestNote {
  id: string;
  repairRequestId: string;
  note: string;
  createdAt: string;
}
