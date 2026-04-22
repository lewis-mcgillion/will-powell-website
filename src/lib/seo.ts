import type { Faq, SiteContent } from '../types';
import { getList, phoneHref, publicText, visibleByOrder } from './publicContent';

const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const setCanonical = (url: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = url;
};

const compactObject = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== '' && entry !== null));

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return window.location.href;
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

const getSiteUrl = () => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL;
  if (configuredUrl) return normalizeUrl(configuredUrl);
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
};

const getVisibleFaqs = (content: SiteContent): Faq[] =>
  visibleByOrder(content.faqs).filter((faq) => !publicText(faq.question) || !publicText(faq.answer) ? false : true);

export const applyHomepageSeo = (content: SiteContent) => {
  const siteUrl = getSiteUrl();
  const businessName = publicText(content.settings.businessName) || 'Will Powell Appliance Repairs';
  const tagline = publicText(content.settings.tagline) || 'White goods repairs';
  const primaryArea = publicText(content.settings.primaryArea);
  const services = visibleByOrder(content.services).map((service) => service.title);
  const areaSection = content.sections.find((section) => section.sectionType === 'areas');
  const areas = getList(areaSection?.content.areas).filter(publicText);
  const phone = phoneHref(content.settings.phone) ? content.settings.phone : '';
  const email = publicText(content.settings.email);
  const description = `${businessName} offers local white goods repairs${primaryArea ? ` in ${primaryArea}` : ''} for ${services
    .slice(0, 5)
    .join(', ')
    .toLowerCase()}. Call or request a callback.`;

  document.title = `${businessName} | ${tagline}`;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', 'index,follow');
  setMeta('property', 'og:title', document.title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:url', siteUrl);
  setMeta('property', 'og:site_name', businessName);
  setMeta('name', 'twitter:card', 'summary');
  setMeta('name', 'twitter:title', document.title);
  setMeta('name', 'twitter:description', description);
  setCanonical(siteUrl);

  const businessSchema = compactObject({
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${siteUrl}#business`,
    name: businessName,
    url: siteUrl,
    description,
    telephone: phone || undefined,
    email: email || undefined,
    openingHours: publicText(content.settings.openingHours) || undefined,
    areaServed: areas.length ? areas.map((name) => ({ '@type': 'Place', name })) : primaryArea ? { '@type': 'Place', name: primaryArea } : undefined,
    priceRange: 'Ask for quote',
    makesOffer: services.map((name) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name,
        serviceType: 'White goods repair',
      },
    })),
  });

  const faqs = getVisibleFaqs(content);
  const faqSchema = faqs.length
    ? {
        '@type': 'FAQPage',
        '@id': `${siteUrl}#faqs`,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        name: businessName,
        url: siteUrl,
      },
      businessSchema,
      ...(faqSchema ? [faqSchema] : []),
    ],
  };

  let script = document.getElementById('homepage-schema') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'homepage-schema';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
};
