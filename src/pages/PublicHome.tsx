import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form as BootstrapForm,
  ListGroup,
  Nav,
  Navbar,
  Row,
} from 'react-bootstrap';
import { defaultContent } from '../content/defaultContent';
import { getList, hasPlaceholder, phoneHref, publicText, visibleByOrder } from '../lib/publicContent';
import { loadSiteContent, submitRepairRequest } from '../lib/repository';
import { applyHomepageSeo } from '../lib/seo';
import { isDemoMode } from '../lib/supabase';
import { repairRequestSchema } from '../lib/validation';
import type { HomepageSection, RepairRequestInput, SiteContent } from '../types';

export default function PublicHome() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [hideStickyCall, setHideStickyCall] = useState(false);

  useEffect(() => {
    loadSiteContent()
      .then(setContent)
      .catch((error) => {
        setFormError(error instanceof Error ? error.message : 'Could not load site content.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) applyHomepageSeo(content);
  }, [content, loading]);

  const sections = useMemo(() => visibleByOrder(content.sections), [content.sections]);
  const stickyPhoneHref = phoneHref(content.settings.phone);

  useEffect(() => {
    if (!stickyPhoneHref || loading || !('IntersectionObserver' in window)) {
      setHideStickyCall(false);
      return;
    }

    const targets = [document.querySelector('.classic-hero'), document.getElementById('contact'), document.querySelector('.site-footer-classic')].filter(
      (target): target is Element => Boolean(target),
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setHideStickyCall(entries.some((entry) => entry.isIntersecting));
      },
      { threshold: 0.01 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [loading, stickyPhoneHref]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitState('submitting');
    setFormError('');

    const formData = new FormData(form);
    const input: RepairRequestInput = {
      customerName: String(formData.get('customerName') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      email: String(formData.get('email') ?? ''),
      postcode: String(formData.get('postcode') ?? ''),
      applianceType: String(formData.get('applianceType') ?? ''),
      brand: String(formData.get('brand') ?? ''),
      faultDescription: String(formData.get('faultDescription') ?? ''),
      preferredContactMethod: String(formData.get('preferredContactMethod') ?? 'Phone'),
      preferredWindow: String(formData.get('preferredWindow') ?? ''),
      sourcePath: window.location.pathname,
    };

    const parsed = repairRequestSchema.safeParse(input);
    if (!parsed.success) {
      setSubmitState('error');
      setFormError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    try {
      await submitRepairRequest(parsed.data);
      setSubmitState('success');
      form.reset();
    } catch (error) {
      setSubmitState('error');
      setFormError(error instanceof Error ? error.message : 'Could not send the request.');
    }
  };

  const renderSection = (section: HomepageSection) => {
    switch (section.sectionType) {
      case 'hero':
        return <HeroSection key={section.id} section={section} content={content} />;
      case 'trust_strip':
        return <TrustStrip key={section.id} section={section} />;
      case 'services':
        return <ServicesSection key={section.id} section={section} content={content} />;
      case 'how_it_works':
        return <StepsSection key={section.id} section={section} />;
      case 'areas':
        return <AreasSection key={section.id} section={section} />;
      case 'reviews':
        return <ReviewsSection key={section.id} section={section} content={content} />;
      case 'faq':
        return <FaqSection key={section.id} section={section} content={content} />;
      case 'contact_form':
        return (
          <ContactSection
            key={section.id}
            section={section}
            content={content}
            submitState={submitState}
            formError={formError}
            onSubmit={handleSubmit}
            onFormChange={() => {
              if (submitState === 'success') setSubmitState('idle');
            }}
          />
        );
      case 'cta_band':
        return <CtaBand key={section.id} section={section} content={content} />;
      default:
        return <CustomTextSection key={section.id} section={section} />;
    }
  };

  return (
    <div className={`public-site theme-${content.settings.themeKey}`}>
      {isDemoMode && (
        <div className="demo-banner">
          Demo mode: content and enquiries are stored in this browser until Supabase is configured.
        </div>
      )}

      <TopContactBar content={content} />
      <SiteHeader content={content} />

      <main>{loading ? <div className="loading">Loading site content...</div> : sections.map(renderSection)}</main>

      <SiteFooter content={content} />

      {stickyPhoneHref && !hideStickyCall && (
        <a className="sticky-call d-md-none" href={stickyPhoneHref} aria-label={`Call ${content.settings.businessName}`}>
          <i className="bi bi-telephone-fill" aria-hidden="true" /> Call Will - {content.settings.phone}
        </a>
      )}
    </div>
  );
}

function TopContactBar({ content }: { content: SiteContent }) {
  const primaryArea = publicText(content.settings.primaryArea);
  const phoneLink = phoneHref(content.settings.phone);

  return (
    <div className="top-contact-bar">
      <Container className="d-flex flex-column flex-md-row justify-content-between gap-2">
        <span>{primaryArea ? `Local white goods repairs in ${primaryArea}` : 'Local white goods repairs'}</span>
        {phoneLink && (
          <a href={phoneLink}>
            <i className="bi bi-telephone-fill" aria-hidden="true" /> {content.settings.phone}
          </a>
        )}
      </Container>
    </div>
  );
}

function SiteHeader({ content }: { content: SiteContent }) {
  const [expanded, setExpanded] = useState(false);
  const phoneLink = phoneHref(content.settings.phone);
  const homeHref = import.meta.env.BASE_URL || '/';
  const hasAreas = content.sections.some((section) => section.sectionType === 'areas' && section.isVisible) &&
    getList(content.sections.find((section) => section.sectionType === 'areas')?.content.areas).some((area) => publicText(area));
  const closeNav = () => setExpanded(false);

  return (
    <Navbar bg="primary" variant="dark" expand="md" className="classic-navbar" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <Navbar.Brand href={homeHref} className="fw-bold" onClick={closeNav}>
          {content.settings.businessName}
          <small className="d-block fw-normal" aria-hidden="true">
            {content.settings.tagline}
          </small>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto align-items-md-center" onSelect={closeNav}>
            <Nav.Link href="#services" onClick={closeNav}>Services</Nav.Link>
            {hasAreas && <Nav.Link href="#areas" onClick={closeNav}>Areas</Nav.Link>}
            <Nav.Link href="#contact" onClick={closeNav}>Contact</Nav.Link>
            <Button className="ms-md-3 fw-bold d-none d-md-inline-flex" href={phoneLink ?? '#contact'} variant="warning" onClick={closeNav}>
              {phoneLink ? `Call ${content.settings.phone}` : 'Request callback'}
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function HeroSection({ section, content }: { section: HomepageSection; content: SiteContent }) {
  const phoneLink = phoneHref(content.settings.phone);

  return (
    <section className="classic-hero">
      <Container>
        <Row className="align-items-center g-4">
          <Col lg={7}>
            <Badge bg="warning" text="dark" className="mb-3">
              {String(section.content.badge ?? 'Local appliance repairs')}
            </Badge>
            <h1>{section.title}</h1>
            <p className="lead">{section.body}</p>
            <div className="d-flex flex-column flex-sm-row gap-3 mt-4">
              {phoneLink && (
                <Button href={phoneLink} variant="warning" size="lg" className="fw-bold">
                  <i className="bi bi-telephone-fill" aria-hidden="true" /> {String(section.content.primaryCta ?? 'Call Will now')}
                </Button>
              )}
              <Button href="#contact" variant={phoneLink ? 'outline-primary' : 'warning'} size="lg" className={!phoneLink ? 'fw-bold' : undefined}>
                {String(section.content.secondaryCta ?? 'Request a callback')}
              </Button>
            </div>
          </Col>

          <Col lg={5}>
            <Card className="call-card">
              <Card.Header className="bg-primary text-white fw-bold">Need a repair?</Card.Header>
              <Card.Body>
                <Card.Title as="h2">{phoneLink ? 'Call Will directly' : 'Request a callback'}</Card.Title>
                {phoneLink ? (
                  <a className="hero-phone" href={phoneLink}>
                    {content.settings.phone}
                  </a>
                ) : (
                  <Button href="#contact" variant="warning" className="mb-3 fw-bold">
                    Send repair details
                  </Button>
                )}
                <p className="mb-3">{content.settings.openingHours}</p>
                <ListGroup variant="flush">
                  {visibleByOrder(content.services)
                    .slice(0, 5)
                    .map((service) => (
                      <ListGroup.Item key={service.id} className="px-0">
                        <i className="bi bi-check2-square text-primary me-2" aria-hidden="true" />
                        {service.title}
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

function TrustStrip({ section }: { section: HomepageSection }) {
  const icons = ['bi-telephone-fill', 'bi-wrench-adjustable', 'bi-calendar-check'];

  return (
    <section className="trust-strip-classic" aria-label={section.title}>
      <Container>
        <Row className="g-0">
          {getList(section.content.items).map((item, index) => (
            <Col md key={`${item}-${index}`}>
              <div className="trust-item">
                <i className={`bi ${icons[index % icons.length]}`} aria-hidden="true" />
                <strong>{item}</strong>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

function ServicesSection({ section, content }: { section: HomepageSection; content: SiteContent }) {
  const phoneLink = phoneHref(content.settings.phone);

  return (
    <section className="public-section" id="services">
      <Container>
        <SectionIntro section={section} />
        <Row xs={1} md={2} lg={3} className="g-3">
          {visibleByOrder(content.services).map((service) => (
            <Col key={service.id}>
              <Card className="h-100 service-card-classic">
                <Card.Body>
                  <Card.Title as="h3">{service.title}</Card.Title>
                  <ListGroup variant="flush" className="mb-3">
                    {service.commonFaults.slice(0, 3).map((fault, index) => (
                      <ListGroup.Item key={`${fault}-${index}`} className="px-0">
                        {fault}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  <Button href={phoneLink ?? '#contact'} variant="outline-primary">
                    {phoneLink ? 'Call about this repair' : 'Ask about this repair'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

function StepsSection({ section }: { section: HomepageSection }) {
  return (
    <section className="public-section bg-light">
      <Container>
        <SectionIntro section={section} />
        <Row xs={1} md={3} className="g-3">
          {getList(section.content.steps).map((step, index) => (
            <Col key={`${step}-${index}`}>
              <Card className="h-100">
                <Card.Body>
                  <Badge bg="warning" text="dark" className="mb-3">
                    {index + 1}
                  </Badge>
                  <Card.Title as="h3">{step}</Card.Title>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

function AreasSection({ section }: { section: HomepageSection }) {
  const areas = getList(section.content.areas).filter((area) => publicText(area));

  if (!areas.length) return null;

  return (
    <section className="public-section bg-light" id="areas">
      <Container>
        <SectionIntro section={section} />
        <Card>
          <ListGroup variant="flush">
            {areas.map((area, index) => (
              <ListGroup.Item key={`${area}-${index}`}>
                <i className="bi bi-geo-alt-fill text-primary me-2" aria-hidden="true" />
                {area}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      </Container>
    </section>
  );
}

function ReviewsSection({ section, content }: { section: HomepageSection; content: SiteContent }) {
  const testimonials = visibleByOrder(content.testimonials).filter(
    (testimonial) => !hasPlaceholder(testimonial.customerName) && !hasPlaceholder(testimonial.location) && !hasPlaceholder(testimonial.quote),
  );

  return (
    <section className="public-section" id="reviews">
      <Container>
        <SectionIntro section={section} />
        {testimonials.length ? (
          <Row xs={1} md={2} className="g-3">
            {testimonials.map((testimonial) => (
              <Col key={testimonial.id}>
                <Card className="h-100">
                  <Card.Body>
                    <div className="stars" aria-label={`${testimonial.rating} star review`}>
                      <span aria-hidden="true">{'★'.repeat(testimonial.rating)}</span>
                    </div>
                    <Card.Text>"{testimonial.quote}"</Card.Text>
                    <strong>
                      {testimonial.customerName}
                      {publicText(testimonial.location) && `, ${testimonial.location}`}
                    </strong>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card>
            <Card.Body>
              <Card.Text className="mb-0">Ask Will about recent local repairs or references.</Card.Text>
            </Card.Body>
          </Card>
        )}
      </Container>
    </section>
  );
}

function FaqSection({ section, content }: { section: HomepageSection; content: SiteContent }) {
  const faqs = visibleByOrder(content.faqs).filter((faq) => !hasPlaceholder(faq.answer) && !hasPlaceholder(faq.question));

  if (!faqs.length) return null;

  return (
    <section className="public-section bg-light">
      <Container>
        <SectionIntro section={section} />
        <Accordion>
          {faqs.map((faq, index) => (
            <Accordion.Item eventKey={String(index)} key={faq.id}>
              <Accordion.Header>{faq.question}</Accordion.Header>
              <Accordion.Body>{faq.answer}</Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}

function ContactSection({
  section,
  content,
  submitState,
  formError,
  onSubmit,
  onFormChange,
}: {
  section: HomepageSection;
  content: SiteContent;
  submitState: 'idle' | 'submitting' | 'success' | 'error';
  formError: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: () => void;
}) {
  const phoneLink = phoneHref(content.settings.phone);

  return (
    <section className="public-section bg-light" id="contact">
      <Container>
        <Row className="g-4 align-items-stretch">
          <Col lg={5}>
            <SectionIntro section={section} />
            {phoneLink && (
              <Card className="call-card">
                <Card.Body>
                  <Card.Title>Prefer to call?</Card.Title>
                  <a className="hero-phone" href={phoneLink}>
                    {content.settings.phone}
                  </a>
                  <p>{content.settings.openingHours}</p>
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={7}>
            <Card>
              <Card.Body>
                <BootstrapForm onSubmit={onSubmit} onChange={onFormChange}>
                  <Row className="g-3">
                    <Col md={6}>
                      <BootstrapForm.Group controlId="customerName">
                        <BootstrapForm.Label>Name</BootstrapForm.Label>
                        <BootstrapForm.Control name="customerName" autoComplete="name" required />
                      </BootstrapForm.Group>
                    </Col>
                    <Col md={6}>
                      <BootstrapForm.Group controlId="phone">
                        <BootstrapForm.Label>Phone</BootstrapForm.Label>
                        <BootstrapForm.Control name="phone" autoComplete="tel" required />
                      </BootstrapForm.Group>
                    </Col>
                    <Col md={6}>
                      <BootstrapForm.Group controlId="postcode">
                        <BootstrapForm.Label>Postcode</BootstrapForm.Label>
                        <BootstrapForm.Control name="postcode" autoComplete="postal-code" required />
                      </BootstrapForm.Group>
                    </Col>
                    <Col md={6}>
                      <BootstrapForm.Group controlId="applianceType">
                        <BootstrapForm.Label>Appliance</BootstrapForm.Label>
                        <BootstrapForm.Select name="applianceType" required defaultValue="">
                          <option value="" disabled>
                            Choose appliance
                          </option>
                          {visibleByOrder(content.services).map((service) => (
                            <option key={service.id} value={service.title}>
                              {service.title}
                            </option>
                          ))}
                        </BootstrapForm.Select>
                      </BootstrapForm.Group>
                    </Col>
                    <Col xs={12}>
                      <BootstrapForm.Group controlId="faultDescription">
                        <BootstrapForm.Label>What is wrong?</BootstrapForm.Label>
                        <BootstrapForm.Control name="faultDescription" as="textarea" rows={4} required />
                      </BootstrapForm.Group>
                    </Col>
                    <Col xs={12}>
                      <Accordion className="optional-details">
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>Optional details</Accordion.Header>
                          <Accordion.Body>
                            <Row className="g-3">
                              <Col md={6}>
                                <BootstrapForm.Group controlId="email">
                                  <BootstrapForm.Label>Email</BootstrapForm.Label>
                                  <BootstrapForm.Control name="email" type="email" autoComplete="email" />
                                </BootstrapForm.Group>
                              </Col>
                              <Col md={6}>
                                <BootstrapForm.Group controlId="brand">
                                  <BootstrapForm.Label>Brand</BootstrapForm.Label>
                                  <BootstrapForm.Control name="brand" placeholder="If known" />
                                </BootstrapForm.Group>
                              </Col>
                              <Col md={6}>
                                <BootstrapForm.Group controlId="preferredContactMethod">
                                  <BootstrapForm.Label>Preferred contact</BootstrapForm.Label>
                                  <BootstrapForm.Select name="preferredContactMethod" defaultValue="Phone">
                                    <option>Phone</option>
                                    <option>WhatsApp</option>
                                    <option>Email</option>
                                  </BootstrapForm.Select>
                                </BootstrapForm.Group>
                              </Col>
                              <Col md={6}>
                                <BootstrapForm.Group controlId="preferredWindow">
                                  <BootstrapForm.Label>Preferred time</BootstrapForm.Label>
                                  <BootstrapForm.Control name="preferredWindow" placeholder="Optional" />
                                </BootstrapForm.Group>
                              </Col>
                            </Row>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    </Col>
                    {submitState === 'success' && (
                      <Col xs={12}>
                        <Alert variant="light" className="classic-alert-ok">
                          Thanks - your request has been sent. Will will get back to you soon.
                        </Alert>
                      </Col>
                    )}
                    {submitState === 'error' && (
                      <Col xs={12}>
                        <Alert variant="danger">{formError}</Alert>
                      </Col>
                    )}
                    <Col xs={12}>
                      <Button type="submit" variant="warning" size="lg" className="w-100 fw-bold" disabled={submitState === 'submitting'}>
                        {submitState === 'submitting' ? 'Sending...' : 'Ask Will to call me back'}
                      </Button>
                    </Col>
                  </Row>
                </BootstrapForm>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

function CtaBand({ section, content }: { section: HomepageSection; content: SiteContent }) {
  const phoneLink = phoneHref(content.settings.phone);

  return (
    <section className="public-section">
      <Container>
        <Card className="bg-primary text-white">
          <Card.Body className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center">
            <div>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
            <Button href={phoneLink ?? '#contact'} variant="warning" size="lg">
              {phoneLink ? 'Call now' : 'Request callback'}
            </Button>
          </Card.Body>
        </Card>
      </Container>
    </section>
  );
}

function CustomTextSection({ section }: { section: HomepageSection }) {
  return (
    <section className="public-section">
      <Container>
        <SectionIntro section={section} />
      </Container>
    </section>
  );
}

function SiteFooter({ content }: { content: SiteContent }) {
  const phoneLink = phoneHref(content.settings.phone);
  const email = publicText(content.settings.email);

  return (
    <footer className="site-footer-classic">
      <Container>
        <Row className="g-3 align-items-center">
          <Col md>
            <strong>{content.settings.businessName}</strong>
            <p>{content.settings.tagline}</p>
          </Col>
          <Col md className="text-md-end">
            {phoneLink && <a href={phoneLink}>{content.settings.phone}</a>}
            {email && <p>{email}</p>}
            <p>{content.settings.openingHours}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

function SectionIntro({ section }: { section: HomepageSection }) {
  const body = publicText(section.body);

  return (
    <div className="section-heading">
      <h2>{section.title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}
