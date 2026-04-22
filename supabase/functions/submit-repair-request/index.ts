import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Payload = {
  customerName?: string;
  phone?: string;
  email?: string;
  postcode?: string;
  applianceType?: string;
  brand?: string;
  faultDescription?: string;
  preferredContactMethod?: string;
  preferredWindow?: string;
  sourcePath?: string;
};

const required = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

const sendEmail = async (payload: Payload) => {
  const provider = Deno.env.get('EMAIL_PROVIDER') ?? 'resend';
  const apiKey = Deno.env.get('EMAIL_API_KEY');
  const to = Deno.env.get('FORM_NOTIFICATION_TO');
  const from = Deno.env.get('FORM_NOTIFICATION_FROM');

  if (!apiKey || !to || !from) return 'not_configured';

  const subject = `New repair request: ${payload.applianceType ?? 'Appliance'} in ${payload.postcode ?? 'unknown postcode'}`;
  const text = [
    `Name: ${payload.customerName}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email ?? ''}`,
    `Postcode: ${payload.postcode}`,
    `Appliance: ${payload.applianceType}`,
    `Brand: ${payload.brand ?? ''}`,
    `Preferred contact: ${payload.preferredContactMethod ?? 'Phone'}`,
    `Preferred window: ${payload.preferredWindow ?? ''}`,
    `Source: ${payload.sourcePath ?? ''}`,
    '',
    `Fault: ${payload.faultDescription}`,
  ].join('\n');

  if (provider === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return response.ok ? 'sent' : 'failed';
  }

  if (provider === 'postmark') {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ From: from, To: to, Subject: subject, TextBody: text }),
    });
    return response.ok ? 'sent' : 'failed';
  }

  return 'not_configured';
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await request.json()) as Payload;
    const missing = ['customerName', 'phone', 'postcode', 'applianceType', 'faultDescription'].filter(
      (field) => !required(payload[field as keyof Payload]),
    );

    if (missing.length) {
      return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase function is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from('repair_requests')
      .insert({
        customer_name: payload.customerName,
        phone: payload.phone,
        email: payload.email || null,
        postcode: payload.postcode,
        appliance_type: payload.applianceType,
        brand: payload.brand || null,
        fault_description: payload.faultDescription,
        preferred_contact_method: payload.preferredContactMethod || 'Phone',
        preferred_window: payload.preferredWindow || null,
        source_path: payload.sourcePath || null,
        email_delivery_status: 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;

    const emailStatus = await sendEmail(payload);
    await supabase
      .from('repair_requests')
      .update({ email_delivery_status: emailStatus, updated_at: new Date().toISOString() })
      .eq('id', data.id);

    return new Response(
      JSON.stringify({
        id: data.id,
        status: data.status,
        emailDeliveryStatus: emailStatus,
        customerName: data.customer_name,
        phone: data.phone,
        email: data.email,
        postcode: data.postcode,
        applianceType: data.appliance_type,
        brand: data.brand,
        faultDescription: data.fault_description,
        preferredContactMethod: data.preferred_contact_method,
        preferredWindow: data.preferred_window,
        sourcePath: data.source_path,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        notes: [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
