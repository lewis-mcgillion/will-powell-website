import { defaultContent } from '../content/defaultContent';
import { isSiteThemeKey } from '../content/themes';
import type {
  Faq,
  HomepageSection,
  RepairRequest,
  RepairRequestInput,
  RepairRequestStatus,
  ServiceCard,
  SiteContent,
  SiteSettings,
  Testimonial,
} from '../types';
import { isDemoMode, supabase } from './supabase';

const CONTENT_KEY = 'will-powell-site-content';
const REQUESTS_KEY = 'will-powell-repair-requests';

const bySortOrder = <T extends { sortOrder: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const mergeSettings = (settings?: Partial<SiteSettings>): SiteSettings => {
  const merged = { ...defaultContent.settings, ...settings };
  return {
    ...merged,
    themeKey: isSiteThemeKey(merged.themeKey) ? merged.themeKey : defaultContent.settings.themeKey,
  };
};

const readLocalContent = (): SiteContent => {
  const stored = localStorage.getItem(CONTENT_KEY);
  if (!stored) return defaultContent;

  try {
    const parsed = JSON.parse(stored) as SiteContent;
    return {
      ...defaultContent,
      ...parsed,
      settings: mergeSettings(parsed.settings),
      sections: Array.isArray(parsed.sections) ? bySortOrder(parsed.sections) : defaultContent.sections,
      services: Array.isArray(parsed.services) ? bySortOrder(parsed.services) : defaultContent.services,
      testimonials: Array.isArray(parsed.testimonials) ? bySortOrder(parsed.testimonials) : defaultContent.testimonials,
      faqs: Array.isArray(parsed.faqs) ? bySortOrder(parsed.faqs) : defaultContent.faqs,
    };
  } catch {
    return defaultContent;
  }
};

const writeLocalContent = (content: SiteContent) => {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
};

const syncCollectionTable = async (table: string, payload: { id: string }[]) => {
  if (!supabase) return;

  const { data: existingRows, error: existingError } = await supabase.from(table).select('id');
  if (existingError) throw existingError;

  const nextIds = new Set(payload.map((row) => row.id));
  const staleIds = (existingRows ?? [])
    .map((row: { id: unknown }) => String(row.id))
    .filter((id) => !nextIds.has(id));

  if (payload.length) {
    const { error } = await supabase.from(table).upsert(payload);
    if (error) throw error;
  }

  if (staleIds.length) {
    const { error } = await supabase.from(table).delete().in('id', staleIds);
    if (error) throw error;
  }
};

const readLocalRequests = (): RepairRequest[] => {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as RepairRequest[];
  } catch {
    return [];
  }
};

const writeLocalRequests = (requests: RepairRequest[]) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
};

const mapSection = (row: Record<string, unknown>): HomepageSection => ({
  id: String(row.id),
  sectionType: row.section_type as HomepageSection['sectionType'],
  title: String(row.title ?? ''),
  subtitle: String(row.subtitle ?? ''),
  body: String(row.body ?? ''),
  content: (row.content as Record<string, unknown>) ?? {},
  sortOrder: Number(row.sort_order ?? 0),
  isVisible: Boolean(row.is_visible),
});

const mapService = (row: Record<string, unknown>): ServiceCard => ({
  id: String(row.id),
  title: String(row.title ?? ''),
  shortDescription: String(row.short_description ?? ''),
  commonFaults: Array.isArray(row.common_faults) ? (row.common_faults as string[]) : [],
  iconLabel: String(row.icon_label ?? ''),
  sortOrder: Number(row.sort_order ?? 0),
  isVisible: Boolean(row.is_visible),
});

const mapTestimonial = (row: Record<string, unknown>): Testimonial => ({
  id: String(row.id),
  quote: String(row.quote ?? ''),
  customerName: String(row.customer_name ?? ''),
  location: String(row.location ?? ''),
  rating: Number(row.rating ?? 5),
  sortOrder: Number(row.sort_order ?? 0),
  isVisible: Boolean(row.is_visible),
});

const mapFaq = (row: Record<string, unknown>): Faq => ({
  id: String(row.id),
  question: String(row.question ?? ''),
  answer: String(row.answer ?? ''),
  sortOrder: Number(row.sort_order ?? 0),
  isVisible: Boolean(row.is_visible),
});

const mapSettings = (row: Record<string, unknown> | null): SiteSettings => ({
  ...mergeSettings({
    id: String(row?.id ?? defaultContent.settings.id),
    businessName: String(row?.business_name ?? defaultContent.settings.businessName),
    tagline: String(row?.tagline ?? defaultContent.settings.tagline),
    phone: String(row?.phone ?? defaultContent.settings.phone),
    email: String(row?.email ?? defaultContent.settings.email),
    whatsappNumber: String(row?.whatsapp_number ?? defaultContent.settings.whatsappNumber),
    primaryArea: String(row?.primary_area ?? defaultContent.settings.primaryArea),
    openingHours: String(row?.opening_hours ?? defaultContent.settings.openingHours),
    googleReviewsUrl: String(row?.google_reviews_url ?? defaultContent.settings.googleReviewsUrl),
    themeKey: String(row?.theme_key ?? defaultContent.settings.themeKey) as SiteSettings['themeKey'],
  }),
});

export const loadSiteContent = async (): Promise<SiteContent> => {
  if (isDemoMode || !supabase) return readLocalContent();

  const [settings, sections, services, testimonials, faqs] = await Promise.all([
    supabase.from('site_settings').select('*').limit(1).maybeSingle(),
    supabase.from('homepage_sections').select('*').order('sort_order'),
    supabase.from('service_cards').select('*').order('sort_order'),
    supabase.from('testimonials').select('*').order('sort_order'),
    supabase.from('faqs').select('*').order('sort_order'),
  ]);

  for (const result of [settings, sections, services, testimonials, faqs]) {
    if (result.error) throw result.error;
  }

  return {
    settings: mapSettings(settings.data as Record<string, unknown> | null),
    sections: sections.data?.map((row) => mapSection(row)) ?? defaultContent.sections,
    services: services.data?.map((row) => mapService(row)) ?? defaultContent.services,
    testimonials: testimonials.data?.map((row) => mapTestimonial(row)) ?? defaultContent.testimonials,
    faqs: faqs.data?.map((row) => mapFaq(row)) ?? defaultContent.faqs,
  };
};

export const saveSiteContent = async (content: SiteContent) => {
  if (isDemoMode || !supabase) {
    writeLocalContent(content);
    return;
  }

  const settingsPayload = {
    id: content.settings.id,
    business_name: content.settings.businessName,
    tagline: content.settings.tagline,
    phone: content.settings.phone,
    email: content.settings.email,
    whatsapp_number: content.settings.whatsappNumber,
    primary_area: content.settings.primaryArea,
    opening_hours: content.settings.openingHours,
    google_reviews_url: content.settings.googleReviewsUrl,
    theme_key: content.settings.themeKey,
  };

  const sectionPayload = content.sections.map((section) => ({
    id: section.id,
    section_type: section.sectionType,
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    content: section.content,
    sort_order: section.sortOrder,
    is_visible: section.isVisible,
  }));
  const servicePayload = content.services.map((service) => ({
    id: service.id,
    title: service.title,
    short_description: service.shortDescription,
    common_faults: service.commonFaults,
    icon_label: service.iconLabel,
    sort_order: service.sortOrder,
    is_visible: service.isVisible,
  }));
  const testimonialPayload = content.testimonials.map((testimonial) => ({
    id: testimonial.id,
    quote: testimonial.quote,
    customer_name: testimonial.customerName,
    location: testimonial.location,
    rating: testimonial.rating,
    sort_order: testimonial.sortOrder,
    is_visible: testimonial.isVisible,
  }));
  const faqPayload = content.faqs.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    sort_order: faq.sortOrder,
    is_visible: faq.isVisible,
  }));

  const [settings] = await Promise.all([
    supabase.from('site_settings').upsert(settingsPayload),
    syncCollectionTable('homepage_sections', sectionPayload),
    syncCollectionTable('service_cards', servicePayload),
    syncCollectionTable('testimonials', testimonialPayload),
    syncCollectionTable('faqs', faqPayload),
  ]);

  if (settings.error) throw settings.error;
};

export const submitRepairRequest = async (input: RepairRequestInput) => {
  if (isDemoMode || !supabase) {
    const now = new Date().toISOString();
    const request: RepairRequest = {
      ...input,
      id: uid(),
      status: 'new',
      emailDeliveryStatus: 'not_configured',
      createdAt: now,
      updatedAt: now,
      notes: [],
    };
    writeLocalRequests([request, ...readLocalRequests()]);
    return request;
  }

  const { data, error } = await supabase.functions.invoke('submit-repair-request', {
    body: input,
  });

  if (error) throw error;
  return data as RepairRequest;
};

export const loadRepairRequests = async (): Promise<RepairRequest[]> => {
  if (isDemoMode || !supabase) return readLocalRequests();

  const { data, error } = await supabase
    .from('repair_requests')
    .select('*, repair_request_notes(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email ?? '',
    postcode: row.postcode,
    applianceType: row.appliance_type,
    brand: row.brand ?? '',
    faultDescription: row.fault_description,
    preferredContactMethod: row.preferred_contact_method,
    preferredWindow: row.preferred_window ?? '',
    sourcePath: row.source_path ?? '',
    emailDeliveryStatus: row.email_delivery_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notes: (row.repair_request_notes ?? []).map((note: Record<string, string>) => ({
      id: note.id,
      repairRequestId: note.repair_request_id,
      note: note.note,
      createdAt: note.created_at,
    })),
  }));
};

export const updateRepairRequestStatus = async (id: string, status: RepairRequestStatus) => {
  if (isDemoMode || !supabase) {
    const requests = readLocalRequests().map((request) =>
      request.id === id ? { ...request, status, updatedAt: new Date().toISOString() } : request,
    );
    writeLocalRequests(requests);
    return;
  }

  const { error } = await supabase
    .from('repair_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

export const addRepairRequestNote = async (repairRequestId: string, note: string) => {
  if (isDemoMode || !supabase) {
    const requests = readLocalRequests().map((request) =>
      request.id === repairRequestId
        ? {
            ...request,
            notes: [
              ...request.notes,
              { id: uid(), repairRequestId, note, createdAt: new Date().toISOString() },
            ],
          }
        : request,
    );
    writeLocalRequests(requests);
    return;
  }

  const { error } = await supabase.from('repair_request_notes').insert({
    repair_request_id: repairRequestId,
    note,
  });

  if (error) throw error;
};
