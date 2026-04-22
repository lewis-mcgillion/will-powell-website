import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
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
import { siteThemes } from '../content/themes';
import {
  addRepairRequestNote,
  loadRepairRequests,
  loadSiteContent,
  saveSiteContent,
  updateRepairRequestStatus,
} from '../lib/repository';
import { isDemoMode, supabase } from '../lib/supabase';
import type {
  Faq,
  HomepageSection,
  HomepageSectionType,
  RepairRequest,
  RepairRequestStatus,
  ServiceCard,
  SiteContent,
  SiteThemeKey,
  Testimonial,
} from '../types';

const sectionTypes: HomepageSectionType[] = [
  'hero',
  'trust_strip',
  'services',
  'how_it_works',
  'areas',
  'reviews',
  'faq',
  'contact_form',
  'cta_band',
  'custom_text',
];

const statuses: RepairRequestStatus[] = ['new', 'contacted', 'quoted', 'booked', 'completed', 'cancelled', 'archived'];
type StatusTone = 'info' | 'success' | 'warning' | 'danger';

const sortItems = <T extends { sortOrder: number }>(items: T[]) => [...items].sort((a, b) => a.sortOrder - b.sortOrder);
const nextSortOrder = <T extends { sortOrder: number }>(items: T[]) => Math.max(0, ...items.map((item) => item.sortOrder)) + 1;
const moveBySortOrder = <T extends { id: string; sortOrder: number }>(items: T[], id: string, direction: -1 | 1) => {
  const ordered = sortItems(items);
  const index = ordered.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return items;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered.map((item, sortOrder) => ({ ...item, sortOrder: sortOrder + 1 }));
};
const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const sentenceLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase());
const sectionLabels: Record<HomepageSectionType, string> = {
  hero: 'Hero',
  trust_strip: 'Trust strip',
  services: 'Services',
  how_it_works: 'How it works',
  areas: 'Areas covered',
  reviews: 'Reviews',
  faq: 'FAQs',
  contact_form: 'Repair form',
  cta_band: 'Call-to-action band',
  custom_text: 'Text section',
};
const statusLabels: Record<RepairRequestStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
};
const emailStatusVariant: Record<RepairRequest['emailDeliveryStatus'], 'success' | 'warning' | 'danger' | 'secondary'> = {
  sent: 'success',
  pending: 'warning',
  failed: 'danger',
  not_configured: 'secondary',
};
const settingLabels: Partial<Record<keyof SiteContent['settings'], string>> = {
  whatsappNumber: 'WhatsApp number',
  googleReviewsUrl: 'Google reviews URL',
};
const settingTypes: Partial<Record<keyof SiteContent['settings'], string>> = {
  phone: 'tel',
  email: 'email',
  whatsappNumber: 'tel',
  googleReviewsUrl: 'url',
};
type TextSettingField = Exclude<keyof SiteContent['settings'], 'themeKey'>;
const listToText = (value: unknown) => (Array.isArray(value) ? value.map(String).join(', ') : '');
const textToList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const clampRating = (value: string) => {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, rating));
};
const confirmRemoval = (label: string) => window.confirm(`Remove ${label}? This cannot be undone.`);

export default function AdminPage() {
  const [sessionReady, setSessionReady] = useState(isDemoMode);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    if (isDemoMode || !supabase) {
      setSessionReady(true);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSessionReady(Boolean(data.session));
      })
      .catch((error) => {
        setSessionError(error instanceof Error ? error.message : 'Could not check the admin session.');
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(Boolean(session));
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSessionError('');

    if (isDemoMode || !supabase) {
      setSessionReady(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setSessionError(error.message);
  };

  if (!sessionReady) {
    return (
      <main className="admin-bootstrap admin-login">
        <Card className="admin-login-card">
          <Card.Body>
            <Badge bg="warning" text="dark" className="mb-3">
              Admin
            </Badge>
            <h1 className="admin-page-title">Sign in to manage the site</h1>
            <BootstrapForm onSubmit={handleLogin}>
              <BootstrapForm.Group className="mb-3" controlId="adminEmail">
                <BootstrapForm.Label>Email</BootstrapForm.Label>
                <BootstrapForm.Control name="email" type="email" autoComplete="email" required />
              </BootstrapForm.Group>
              <BootstrapForm.Group className="mb-3" controlId="adminPassword">
                <BootstrapForm.Label>Password</BootstrapForm.Label>
                <BootstrapForm.Control name="password" type="password" autoComplete="current-password" required />
              </BootstrapForm.Group>
              {sessionError && <Alert variant="danger">{sessionError}</Alert>}
              <Button type="submit" variant="warning" size="lg" className="w-100">
                Sign in
              </Button>
            </BootstrapForm>
          </Card.Body>
        </Card>
      </main>
    );
  }

  return <AdminShell />;
}

function AdminShell() {
  const navigate = useNavigate();
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [status, setStatus] = useState<{ message: string; tone: StatusTone }>({ message: 'Loading admin data...', tone: 'info' });
  const [saving, setSaving] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const saveVersion = useRef(0);

  const refresh = async () => {
    const [siteContent, repairRequests] = await Promise.all([loadSiteContent(), loadRepairRequests()]);
    setContent(siteContent);
    setRequests(repairRequests);
    setStatus({ message: isDemoMode ? 'Demo mode: edits are stored in this browser.' : 'Connected to Supabase.', tone: 'info' });
  };

  useEffect(() => {
    refresh().catch((error) => setStatus({ message: error instanceof Error ? error.message : 'Could not load admin data.', tone: 'danger' }));
  }, []);

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  const save = (nextContent: SiteContent): Promise<void> => {
    setSaving(true);
    setContent(nextContent);
    setStatus({ message: 'Saving changes...', tone: 'warning' });
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    const version = saveVersion.current + 1;
    saveVersion.current = version;
    saveTimer.current = window.setTimeout(() => {
      saveSiteContent(nextContent)
        .then(() => {
          if (saveVersion.current === version) setStatus({ message: 'Saved.', tone: 'success' });
        })
        .catch((error) => {
          if (saveVersion.current === version) {
            setStatus({ message: error instanceof Error ? error.message : 'Could not save changes.', tone: 'danger' });
          }
        })
        .finally(() => {
          if (saveVersion.current === version) setSaving(false);
        });
    }, 600);

    return Promise.resolve();
  };

  const closeNav = () => setNavExpanded(false);

  const signOut = async () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      try {
        await saveSiteContent(content);
      } catch (error) {
        setStatus({ message: error instanceof Error ? error.message : 'Could not save changes before leaving admin.', tone: 'danger' });
        setSaving(false);
        return;
      }
    }
    if (!isDemoMode && supabase) await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="admin-bootstrap">
      <Navbar bg="primary" variant="dark" expand="lg" className="classic-navbar" expanded={navExpanded} onToggle={setNavExpanded}>
        <Container fluid className="px-lg-4">
          <Navbar.Brand as={Link} to="/admin" className="fw-bold">
            Admin
            <small className="d-block fw-normal">{content.settings.businessName}</small>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-nav" />
          <Navbar.Collapse id="admin-nav">
            <Nav className="ms-auto align-items-lg-center" onSelect={closeNav}>
              <Nav.Link as={NavLink} to="/admin" end>Overview</Nav.Link>
              <Nav.Link as={NavLink} to="/admin/homepage">Homepage</Nav.Link>
              <Nav.Link as={NavLink} to="/admin/settings">Settings</Nav.Link>
              <Nav.Link as={NavLink} to="/admin/services">Services</Nav.Link>
              <Nav.Link as={NavLink} to="/admin/faqs">FAQs</Nav.Link>
              <Nav.Link as={NavLink} to="/admin/testimonials">Testimonials</Nav.Link>
              <Nav.Link as={NavLink} to="/admin/enquiries">Enquiries</Nav.Link>
            </Nav>
            <div className="d-flex flex-column flex-lg-row gap-2 ms-lg-3 mt-3 mt-lg-0">
              <Link className="btn btn-outline-light" to="/" onClick={closeNav}>View site</Link>
              <Button variant="warning" onClick={signOut}>
                Exit admin
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="admin-content px-lg-4 py-4">
        <Alert variant={status.tone} className="d-flex justify-content-between gap-3 align-items-center">
          <span>{status.message}</span>
          {saving && <Badge bg="primary">Saving...</Badge>}
        </Alert>

        <Routes>
          <Route path="/" element={<Overview content={content} requests={requests} />} />
          <Route path="/homepage" element={<HomepageEditor content={content} onSave={save} />} />
          <Route path="/settings" element={<SettingsEditor content={content} onSave={save} />} />
          <Route path="/services" element={<ServicesEditor content={content} onSave={save} />} />
          <Route path="/faqs" element={<FaqEditor content={content} onSave={save} />} />
          <Route path="/testimonials" element={<TestimonialsEditor content={content} onSave={save} />} />
          <Route path="/enquiries" element={<Enquiries requests={requests} onRefresh={refresh} />} />
        </Routes>
      </Container>
    </div>
  );
}

function Overview({ content, requests }: { content: SiteContent; requests: RepairRequest[] }) {
  const visibleSections = content.sections.filter((section) => section.isVisible).length;
  const newRequests = requests.filter((request) => request.status === 'new').length;

  return (
    <Card>
      <Card.Body>
        <Badge bg="warning" text="dark" className="mb-3">Overview</Badge>
        <h1 className="admin-page-title">Site dashboard</h1>
        <Row xs={1} md={3} className="g-3 mt-2">
          <Col>
            <StatCard value={visibleSections} label="visible homepage sections" />
          </Col>
          <Col>
            <StatCard value={content.services.filter((item) => item.isVisible).length} label="visible services" />
          </Col>
          <Col>
            <StatCard value={newRequests} label="new enquiries" />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <Card className="h-100 bg-light">
      <Card.Body className="d-flex flex-column gap-1">
        <strong className="admin-stat-value">{value}</strong>
        <span className="text-muted fw-bold">{label}</span>
      </Card.Body>
    </Card>
  );
}

function HomepageEditor({ content, onSave }: { content: SiteContent; onSave: (content: SiteContent) => Promise<void> }) {
  const sections = useMemo(() => sortItems(content.sections), [content.sections]);

  const updateSection = (id: string, patch: Partial<HomepageSection>) => {
    onSave({ ...content, sections: content.sections.map((section) => (section.id === id ? { ...section, ...patch } : section)) });
  };
  const updateSectionContent = (id: string, patch: Record<string, unknown>) => {
    onSave({
      ...content,
      sections: content.sections.map((section) =>
        section.id === id ? { ...section, content: { ...section.content, ...patch } } : section,
      ),
    });
  };

  const addSection = () => {
    const sortOrder = Math.max(0, ...content.sections.map((section) => section.sortOrder)) + 1;
    const section: HomepageSection = {
      id: makeId('section'),
      sectionType: 'custom_text',
      title: 'New section',
      subtitle: '',
      body: 'Edit this text in the admin panel.',
      content: {},
      sortOrder,
      isVisible: true,
    };
    onSave({ ...content, sections: [...content.sections, section] });
  };

  const move = (id: string, direction: -1 | 1) => {
    onSave({ ...content, sections: moveBySortOrder(content.sections, id, direction) });
  };

  const remove = (id: string) => {
    const section = content.sections.find((item) => item.id === id);
    if (section && confirmRemoval(section.title || sectionLabels[section.sectionType])) {
      onSave({ ...content, sections: content.sections.filter((item) => item.id !== id) });
    }
  };

  return (
    <Card>
      <Card.Body>
        <PanelHeader eyebrow="Homepage" title="Edit homepage sections" actionLabel="Add section" onAction={addSection} />
        <div className="admin-editor-list">
          {sections.map((section, index) => (
            <Card key={section.id}>
              <Card.Body>
                <Row className="g-3">
                  <Col md={8}>
                    <BootstrapForm.Group controlId={`${section.id}-type`}>
                       <BootstrapForm.Label>Section type</BootstrapForm.Label>
                       <BootstrapForm.Select value={section.sectionType} onChange={(event) => updateSection(section.id, { sectionType: event.target.value as HomepageSectionType })}>
                         {sectionTypes.map((type) => (
                           <option key={type} value={type}>{sectionLabels[type]}</option>
                         ))}
                       </BootstrapForm.Select>
                     </BootstrapForm.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <BootstrapForm.Check
                      type="switch"
                      id={`${section.id}-visible`}
                      label="Visible on site"
                      checked={section.isVisible}
                      onChange={(event) => updateSection(section.id, { isVisible: event.target.checked })}
                    />
                  </Col>
                  <Col md={6}>
                    <BootstrapForm.Group controlId={`${section.id}-title`}>
                      <BootstrapForm.Label>Title</BootstrapForm.Label>
                      <BootstrapForm.Control value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} />
                    </BootstrapForm.Group>
                  </Col>
                  <Col md={6}>
                    <BootstrapForm.Group controlId={`${section.id}-subtitle`}>
                      <BootstrapForm.Label>Subtitle</BootstrapForm.Label>
                      <BootstrapForm.Control value={section.subtitle} onChange={(event) => updateSection(section.id, { subtitle: event.target.value })} />
                    </BootstrapForm.Group>
                  </Col>
                  <Col xs={12}>
                    <BootstrapForm.Group controlId={`${section.id}-body`}>
                      <BootstrapForm.Label>Body</BootstrapForm.Label>
                      <BootstrapForm.Control as="textarea" rows={3} value={section.body} onChange={(event) => updateSection(section.id, { body: event.target.value })} />
                    </BootstrapForm.Group>
                  </Col>
                  <SectionContentFields section={section} onChange={(patch) => updateSectionContent(section.id, patch)} />
                </Row>
                <ActionRow className="mt-3">
                  <Button variant="outline-primary" disabled={index === 0} onClick={() => move(section.id, -1)} aria-label={`Move ${section.title} up`}>Move up</Button>
                  <Button variant="outline-primary" disabled={index === sections.length - 1} onClick={() => move(section.id, 1)} aria-label={`Move ${section.title} down`}>Move down</Button>
                  <Button variant="outline-danger" onClick={() => remove(section.id)} aria-label={`Remove ${section.title}`}>Remove</Button>
                </ActionRow>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

function SettingsEditor({ content, onSave }: { content: SiteContent; onSave: (content: SiteContent) => Promise<void> }) {
  const update = (field: TextSettingField, value: string) => {
    onSave({ ...content, settings: { ...content.settings, [field]: value } });
  };
  const updateTheme = (themeKey: SiteThemeKey) => {
    onSave({ ...content, settings: { ...content.settings, themeKey } });
  };

  const fields: TextSettingField[] = ['businessName', 'tagline', 'phone', 'email', 'whatsappNumber', 'primaryArea', 'openingHours', 'googleReviewsUrl'];
  const activeTheme = siteThemes.find((theme) => theme.key === content.settings.themeKey) ?? siteThemes[0];

  return (
    <Card>
      <Card.Body>
        <Badge bg="warning" text="dark" className="mb-3">Settings</Badge>
        <h1 className="admin-page-title">Business details</h1>
        <Card className="theme-picker-card mb-4">
          <Card.Body>
            <Row className="g-3 align-items-start">
              <Col lg={4}>
                <BootstrapForm.Group controlId="setting-theme">
                  <BootstrapForm.Label>Website theme</BootstrapForm.Label>
                  <BootstrapForm.Select
                    value={content.settings.themeKey}
                    onChange={(event) => updateTheme(event.target.value as SiteThemeKey)}
                  >
                    {siteThemes.map((theme) => (
                      <option key={theme.key} value={theme.key}>
                        {theme.name}
                      </option>
                    ))}
                  </BootstrapForm.Select>
                </BootstrapForm.Group>
                <p className="text-muted mb-0 mt-2">{activeTheme.description}</p>
              </Col>
              <Col lg={8}>
                <div className="theme-options" aria-label="Theme previews">
                  {siteThemes.map((theme) => (
                    <button
                      type="button"
                      key={theme.key}
                      className={`theme-option ${theme.key === content.settings.themeKey ? 'is-selected' : ''}`}
                      onClick={() => updateTheme(theme.key)}
                      aria-pressed={theme.key === content.settings.themeKey}
                    >
                      <span className="theme-option-name">{theme.name}</span>
                      <span className="theme-swatches" aria-hidden="true">
                        {theme.swatches.map((swatch) => (
                          <span key={swatch} style={{ background: swatch }} />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        <Row xs={1} md={2} className="g-3 mt-1">
          {fields.map((field) => (
            <Col key={field}>
              <BootstrapForm.Group controlId={`setting-${field}`}>
                <BootstrapForm.Label>{settingLabels[field] ?? sentenceLabel(field)}</BootstrapForm.Label>
                <BootstrapForm.Control
                  type={settingTypes[field] ?? 'text'}
                  value={content.settings[field]}
                  onChange={(event) => update(field, event.target.value)}
                />
              </BootstrapForm.Group>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
}

function ServicesEditor({ content, onSave }: { content: SiteContent; onSave: (content: SiteContent) => Promise<void> }) {
  const update = (id: string, patch: Partial<ServiceCard>) => {
    onSave({ ...content, services: content.services.map((service) => (service.id === id ? { ...service, ...patch } : service)) });
  };

  const add = () => {
    onSave({
      ...content,
      services: [
        ...content.services,
        { id: makeId('service'), title: 'New service', shortDescription: '', commonFaults: [], iconLabel: 'Service', sortOrder: nextSortOrder(content.services), isVisible: true },
      ],
    });
  };

  return (
    <CollectionEditor
      title="Services"
      items={content.services}
      onAdd={add}
      onMove={(id, direction) => onSave({ ...content, services: moveBySortOrder(content.services, id, direction) })}
      onRemove={(id) => {
        const service = content.services.find((item) => item.id === id);
        if (service && confirmRemoval(service.title)) onSave({ ...content, services: content.services.filter((item) => item.id !== id) });
      }}
      getItemLabel={(service) => service.title}
      render={(service) => (
        <Row className="g-3">
          <Col md={6}>
            <BootstrapForm.Group controlId={`${service.id}-title`}>
              <BootstrapForm.Label>Service title</BootstrapForm.Label>
              <BootstrapForm.Control value={service.title} onChange={(event) => update(service.id, { title: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col md={6}>
            <BootstrapForm.Group controlId={`${service.id}-icon`}>
              <BootstrapForm.Label>Short icon label</BootstrapForm.Label>
              <BootstrapForm.Control value={service.iconLabel} onChange={(event) => update(service.id, { iconLabel: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col xs={12}>
            <BootstrapForm.Group controlId={`${service.id}-desc`}>
              <BootstrapForm.Label>Short description</BootstrapForm.Label>
              <BootstrapForm.Control value={service.shortDescription} onChange={(event) => update(service.id, { shortDescription: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col xs={12}>
            <BootstrapForm.Group controlId={`${service.id}-faults`}>
              <BootstrapForm.Label>Common faults, separated by commas</BootstrapForm.Label>
              <BootstrapForm.Control value={service.commonFaults.join(', ')} onChange={(event) => update(service.id, { commonFaults: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
            </BootstrapForm.Group>
          </Col>
          <Col xs={12}>
            <BootstrapForm.Check type="switch" id={`${service.id}-visible`} label="Visible on site" checked={service.isVisible} onChange={(event) => update(service.id, { isVisible: event.target.checked })} />
          </Col>
        </Row>
      )}
    />
  );
}

function FaqEditor({ content, onSave }: { content: SiteContent; onSave: (content: SiteContent) => Promise<void> }) {
  const update = (id: string, patch: Partial<Faq>) => onSave({ ...content, faqs: content.faqs.map((faq) => (faq.id === id ? { ...faq, ...patch } : faq)) });
  const add = () => onSave({ ...content, faqs: [...content.faqs, { id: makeId('faq'), question: 'New question', answer: '', sortOrder: nextSortOrder(content.faqs), isVisible: true }] });

  return (
    <CollectionEditor
      title="FAQs"
      items={content.faqs}
      onAdd={add}
      onMove={(id, direction) => onSave({ ...content, faqs: moveBySortOrder(content.faqs, id, direction) })}
      onRemove={(id) => {
        const faq = content.faqs.find((item) => item.id === id);
        if (faq && confirmRemoval(faq.question)) onSave({ ...content, faqs: content.faqs.filter((item) => item.id !== id) });
      }}
      getItemLabel={(faq) => faq.question}
      render={(faq) => (
        <Row className="g-3">
          <Col xs={12}>
            <BootstrapForm.Group controlId={`${faq.id}-question`}>
              <BootstrapForm.Label>Question</BootstrapForm.Label>
              <BootstrapForm.Control value={faq.question} onChange={(event) => update(faq.id, { question: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col xs={12}>
            <BootstrapForm.Group controlId={`${faq.id}-answer`}>
              <BootstrapForm.Label>Answer</BootstrapForm.Label>
              <BootstrapForm.Control as="textarea" rows={3} value={faq.answer} onChange={(event) => update(faq.id, { answer: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col xs={12}>
            <BootstrapForm.Check type="switch" id={`${faq.id}-visible`} label="Visible on site" checked={faq.isVisible} onChange={(event) => update(faq.id, { isVisible: event.target.checked })} />
          </Col>
        </Row>
      )}
    />
  );
}

function TestimonialsEditor({ content, onSave }: { content: SiteContent; onSave: (content: SiteContent) => Promise<void> }) {
  const update = (id: string, patch: Partial<Testimonial>) => onSave({ ...content, testimonials: content.testimonials.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  const add = () => onSave({ ...content, testimonials: [...content.testimonials, { id: makeId('testimonial'), quote: 'New quote', customerName: 'Customer', location: '', rating: 5, sortOrder: nextSortOrder(content.testimonials), isVisible: true }] });

  return (
    <CollectionEditor
      title="Testimonials"
      items={content.testimonials}
      onAdd={add}
      onMove={(id, direction) => onSave({ ...content, testimonials: moveBySortOrder(content.testimonials, id, direction) })}
      onRemove={(id) => {
        const item = content.testimonials.find((testimonial) => testimonial.id === id);
        if (item && confirmRemoval(item.customerName || 'this review')) {
          onSave({ ...content, testimonials: content.testimonials.filter((testimonial) => testimonial.id !== id) });
        }
      }}
      getItemLabel={(item) => item.customerName || 'review'}
      render={(item) => (
        <Row className="g-3">
          <Col xs={12}>
            <BootstrapForm.Group controlId={`${item.id}-quote`}>
              <BootstrapForm.Label>Review quote</BootstrapForm.Label>
              <BootstrapForm.Control as="textarea" rows={3} value={item.quote} onChange={(event) => update(item.id, { quote: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col md={5}>
            <BootstrapForm.Group controlId={`${item.id}-customer`}>
              <BootstrapForm.Label>Customer name</BootstrapForm.Label>
              <BootstrapForm.Control value={item.customerName} onChange={(event) => update(item.id, { customerName: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col md={5}>
            <BootstrapForm.Group controlId={`${item.id}-location`}>
              <BootstrapForm.Label>Location</BootstrapForm.Label>
              <BootstrapForm.Control value={item.location} onChange={(event) => update(item.id, { location: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col md={2}>
            <BootstrapForm.Group controlId={`${item.id}-rating`}>
              <BootstrapForm.Label>Rating</BootstrapForm.Label>
              <BootstrapForm.Control type="number" min={1} max={5} value={item.rating} onChange={(event) => update(item.id, { rating: clampRating(event.target.value) })} />
            </BootstrapForm.Group>
          </Col>
          <Col xs={12}>
            <BootstrapForm.Check type="switch" id={`${item.id}-visible`} label="Visible on site" checked={item.isVisible} onChange={(event) => update(item.id, { isVisible: event.target.checked })} />
          </Col>
        </Row>
      )}
    />
  );
}

function SectionContentFields({
  section,
  onChange,
}: {
  section: HomepageSection;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  switch (section.sectionType) {
    case 'hero':
      return (
        <>
          <Col md={4}>
            <BootstrapForm.Group controlId={`${section.id}-badge`}>
              <BootstrapForm.Label>Small badge</BootstrapForm.Label>
              <BootstrapForm.Control value={String(section.content.badge ?? '')} onChange={(event) => onChange({ badge: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col md={4}>
            <BootstrapForm.Group controlId={`${section.id}-primary-cta`}>
              <BootstrapForm.Label>Main button text</BootstrapForm.Label>
              <BootstrapForm.Control value={String(section.content.primaryCta ?? '')} onChange={(event) => onChange({ primaryCta: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
          <Col md={4}>
            <BootstrapForm.Group controlId={`${section.id}-secondary-cta`}>
              <BootstrapForm.Label>Second button text</BootstrapForm.Label>
              <BootstrapForm.Control value={String(section.content.secondaryCta ?? '')} onChange={(event) => onChange({ secondaryCta: event.target.value })} />
            </BootstrapForm.Group>
          </Col>
        </>
      );
    case 'trust_strip':
      return (
        <Col xs={12}>
          <BootstrapForm.Group controlId={`${section.id}-items`}>
            <BootstrapForm.Label>Trust points, separated by commas</BootstrapForm.Label>
            <BootstrapForm.Control value={listToText(section.content.items)} onChange={(event) => onChange({ items: textToList(event.target.value) })} />
          </BootstrapForm.Group>
        </Col>
      );
    case 'how_it_works':
      return (
        <Col xs={12}>
          <BootstrapForm.Group controlId={`${section.id}-steps`}>
            <BootstrapForm.Label>Steps, separated by commas</BootstrapForm.Label>
            <BootstrapForm.Control value={listToText(section.content.steps)} onChange={(event) => onChange({ steps: textToList(event.target.value) })} />
          </BootstrapForm.Group>
        </Col>
      );
    case 'areas':
      return (
        <Col xs={12}>
          <BootstrapForm.Group controlId={`${section.id}-areas`}>
            <BootstrapForm.Label>Areas covered, separated by commas</BootstrapForm.Label>
            <BootstrapForm.Control value={listToText(section.content.areas)} onChange={(event) => onChange({ areas: textToList(event.target.value) })} />
          </BootstrapForm.Group>
        </Col>
      );
    default:
      return null;
  }
}

function CollectionEditor<T extends { id: string; title?: string; question?: string; sortOrder: number }>({
  title,
  items,
  onAdd,
  onMove,
  onRemove,
  getItemLabel,
  render,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  getItemLabel: (item: T) => string;
  render: (item: T) => ReactNode;
}) {
  const orderedItems = sortItems(items);

  return (
    <Card>
      <Card.Body>
        <PanelHeader eyebrow="Content" title={title} actionLabel="Add" onAction={onAdd} />
        <div className="admin-editor-list">
          {orderedItems.map((item, index) => {
            const itemLabel = getItemLabel(item);
            return (
            <Card key={item.id}>
              <Card.Body>
                {render(item)}
                <ActionRow className="mt-3">
                  <Button variant="outline-primary" disabled={index === 0} onClick={() => onMove(item.id, -1)} aria-label={`Move ${itemLabel} up`}>Move up</Button>
                  <Button variant="outline-primary" disabled={index === orderedItems.length - 1} onClick={() => onMove(item.id, 1)} aria-label={`Move ${itemLabel} down`}>Move down</Button>
                  <Button variant="outline-danger" onClick={() => onRemove(item.id)} aria-label={`Remove ${itemLabel}`}>Remove</Button>
                </ActionRow>
              </Card.Body>
            </Card>
          );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}

function Enquiries({ requests, onRefresh }: { requests: RepairRequest[]; onRefresh: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filtered = requests.filter((request) => {
    const haystack =
      `${request.customerName} ${request.phone} ${request.email} ${request.postcode} ${request.applianceType} ${request.brand} ${request.faultDescription} ${request.preferredContactMethod} ${request.preferredWindow} ${request.sourcePath}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const changeStatus = async (id: string, status: RepairRequestStatus) => {
    await updateRepairRequestStatus(id, status);
    await onRefresh();
  };

  const saveNote = async (id: string) => {
    const note = notes[id]?.trim();
    if (!note) return;
    await addRepairRequestNote(id, note);
    setNotes((current) => ({ ...current, [id]: '' }));
    await onRefresh();
  };

  return (
    <Card>
      <Card.Body>
        <Badge bg="warning" text="dark" className="mb-3">Enquiries</Badge>
        <h1 className="admin-page-title">Repair requests</h1>
        <BootstrapForm.Group className="mb-3" controlId="enquiry-search">
          <BootstrapForm.Label className="visually-hidden">Search enquiries</BootstrapForm.Label>
          <BootstrapForm.Control
            aria-label="Search enquiries"
            placeholder="Search enquiries"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </BootstrapForm.Group>
        <div className="admin-editor-list">
          {filtered.map((request) => (
            <Card key={request.id}>
              <Card.Body>
                <Row className="g-3">
                  <Col md={12} lg={5}>
                    <h2 className="h5 mb-1">{request.customerName}</h2>
                    <p className="mb-1">{request.applianceType} - {request.postcode}</p>
                    <p>{request.faultDescription}</p>
                    <p className="mb-1 fw-bold">{request.phone} {request.email && `- ${request.email}`}</p>
                    <small className="text-muted d-block">
                      {[
                        request.brand && `Brand: ${request.brand}`,
                        request.preferredContactMethod && `Contact: ${request.preferredContactMethod}`,
                        request.preferredWindow && `When: ${request.preferredWindow}`,
                      ]
                        .filter(Boolean)
                        .join(' | ')}
                    </small>
                  </Col>
                  <Col md={4} lg={3}>
                    <BootstrapForm.Group controlId={`${request.id}-status`}>
                      <BootstrapForm.Label>Status</BootstrapForm.Label>
                      <BootstrapForm.Select value={request.status} onChange={(event) => changeStatus(request.id, event.target.value as RepairRequestStatus)}>
                        {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                      </BootstrapForm.Select>
                    </BootstrapForm.Group>
                    <Badge bg={emailStatusVariant[request.emailDeliveryStatus]} className="mt-2">Email: {sentenceLabel(request.emailDeliveryStatus)}</Badge>
                  </Col>
                  <Col md={8} lg={4}>
                    <ListGroup className="mb-2">
                      {request.notes.map((existingNote) => (
                        <ListGroup.Item key={existingNote.id}>
                          <small className="text-muted d-block">{formatDate(existingNote.createdAt)}</small>
                          {existingNote.note}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    <BootstrapForm.Label htmlFor={`${request.id}-note`}>Add note</BootstrapForm.Label>
                    <BootstrapForm.Control
                      id={`${request.id}-note`}
                      as="textarea"
                      rows={2}
                      value={notes[request.id] ?? ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                    />
                    <Button className="mt-2" variant="outline-primary" onClick={() => saveNote(request.id)} disabled={!notes[request.id]?.trim()}>Add note</Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
          {!filtered.length && <Alert variant="light" className="border">No enquiries found.</Alert>}
        </div>
      </Card.Body>
    </Card>
  );
}

function PanelHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="admin-panel-header">
      <div>
        <Badge bg="warning" text="dark" className="mb-3">{eyebrow}</Badge>
        <h1 className="admin-page-title">{title}</h1>
      </div>
      <Button variant="warning" onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}

function ActionRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`d-flex flex-wrap gap-2 ${className}`}>{children}</div>;
}
