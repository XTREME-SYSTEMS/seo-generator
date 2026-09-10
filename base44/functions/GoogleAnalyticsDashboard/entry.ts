import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get GA connector token
    let connection;
    try {
      connection = await base44.asServiceRole.connectors.getConnection('google_analytics');
    } catch (e) {
      return Response.json({
        error: 'Google Analytics not connected. Please connect it in the Connectors page.',
        connected: false,
      }, { status: 200 });
    }

    const accessToken = connection.accessToken;

    // 1. List all GA4 account summaries to find properties
    const adminRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!adminRes.ok) {
      const err = await adminRes.text();
      return Response.json({ error: `GA Admin API error: ${err}`, connected: true }, { status: 200 });
    }

    const adminData = await adminRes.json();
    const properties = [];

    for (const account of (adminData.accountSummaries || [])) {
      for (const propSummary of (account.propertySummaries || [])) {
        const propertyId = propSummary.property.replace('properties/', '');
        properties.push({
          propertyId,
          displayName: propSummary.displayName || account.displayName,
          property: propSummary.property,
        });
      }
    }

    if (properties.length === 0) {
      return Response.json({
        connected: true,
        properties: [],
        message: 'No GA4 properties found. Create a GA4 property in Google Analytics first.',
      });
    }

    // 2. For each property, run a report for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const fmt = (d) => d.toISOString().split('T')[0];

    const propertyReports = [];

    for (const prop of properties.slice(0, 20)) { // limit to 20 properties
      try {
        const reportRes = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${prop.propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
              dimensions: [{ name: 'date' }],
              metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
                { name: 'screenPageViews' },
                { name: 'conversions' },
              ],
              orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
            }),
          }
        );

        if (!reportRes.ok) continue;

        const reportData = await reportRes.json();
        const rows = (reportData.rows || []).map(r => ({
          date: r.dimensionValues[0]?.value || '',
          sessions: parseInt(r.metricValues[0]?.value || '0'),
          users: parseInt(r.metricValues[1]?.value || '0'),
          pageViews: parseInt(r.metricValues[2]?.value || '0'),
          conversions: parseInt(r.metricValues[3]?.value || '0'),
        }));

        // Also get hostname breakdown
        let hostnames = [];
        try {
          const hostRes = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${prop.propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
                dimensions: [{ name: 'hostName' }],
                metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
                limit: 20,
              }),
            }
          );
          if (hostRes.ok) {
            const hostData = await hostRes.json();
            hostnames = (hostData.rows || []).map(r => ({
              hostname: r.dimensionValues[0]?.value || '',
              sessions: parseInt(r.metricValues[0]?.value || '0'),
              users: parseInt(r.metricValues[1]?.value || '0'),
            }));
          }
        } catch (e) { /* hostname report optional */ }

        const totalSessions = rows.reduce((s, r) => s + r.sessions, 0);
        const totalUsers = rows.reduce((s, r) => s + r.users, 0);
        const totalPageViews = rows.reduce((s, r) => s + r.pageViews, 0);
        const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);

        propertyReports.push({
          ...prop,
          dailyData: rows,
          hostnames,
          totals: {
            sessions: totalSessions,
            users: totalUsers,
            pageViews: totalPageViews,
            conversions: totalConversions,
          },
        });
      } catch (e) {
        // skip property on error
      }
    }

    // 3. Get lead/estimator usage from Lead entity (last 30 days by day)
    let leadData = [];
    try {
      const leads = await base44.asServiceRole.entities.Lead.list('-created_date', 500);
      const byDay = {};
      for (const lead of (leads || [])) {
        if (!lead.created_date) continue;
        const day = lead.created_date.split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;
      }
      leadData = Object.entries(byDay)
        .map(([date, count]) => ({ date, leads: count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30);
    } catch (e) { /* Lead entity optional */ }

    const totalLeads30d = leadData.reduce((s, d) => s + d.leads, 0);
    const leadsToday = leadData.filter(d => d.date === fmt(endDate)).reduce((s, d) => s + d.leads, 0);

    return Response.json({
      connected: true,
      properties: propertyReports,
      leadData,
      totals: {
        totalLeads30d,
        leadsToday,
        totalProperties: properties.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}