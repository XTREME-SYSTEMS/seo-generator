import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// CaptureLead — creates a Lead record from a public form submission.
// Called by the LeadGenNearYou.com lead form (no auth required).
// Invoke: POST /functions/CaptureLead with { name, email, phone, service_category, message, city, state, source_domain, source_route }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    if (!body.name || !body.email) {
      return Response.json({ error: 'name and email are required' }, { status: 400 });
    }

    const lead = await svc.entities.Lead.create({
      name: String(body.name).slice(0, 200),
      email: String(body.email).slice(0, 200),
      phone: String(body.phone || '').slice(0, 50),
      service_category: String(body.service_category || '').slice(0, 100),
      message: String(body.message || '').slice(0, 5000),
      city: String(body.city || '').slice(0, 100),
      state: String(body.state || '').slice(0, 10),
      source_domain: String(body.source_domain || '').slice(0, 200),
      source_route: String(body.source_route || '').slice(0, 200),
      status: 'new',
    });

    return Response.json({ ok: true, leadId: lead.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}