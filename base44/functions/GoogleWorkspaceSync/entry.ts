import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'export-to-sheets': {
        const { data, sheet_name, spreadsheet_id, folder_id } = params;
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

        let spreadsheetId = spreadsheet_id;

        if (!spreadsheetId) {
          const createBody = { name: sheet_name || 'SEO Export', mimeType: 'application/vnd.google-apps.spreadsheet' };
          if (folder_id) createBody.parents = [folder_id];
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(createBody),
          });
          const sheet = await createRes.json();
          spreadsheetId = sheet.id;
        }

        const values = data;
        const updateRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values }),
          }
        );
        const updateData = await updateRes.json();

        return Response.json({ spreadsheet_id: spreadsheetId, updated_cells: updateData.updatedCells || 0 });
      }

      case 'save-to-drive': {
        const { content, filename, mimeType } = params;
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

        const boundary = '-------314159265358979323846';
        const bodyStr = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: filename })}\r\n--${boundary}\r\nContent-Type: ${mimeType || 'text/plain'}\r\n\r\n${content}\r\n--${boundary}--`;

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
          body: bodyStr,
        });
        const file = await uploadRes.json();

        return Response.json({ file_id: file.id, name: file.name });
      }

      case 'create-doc': {
        const { title, content } = params;
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledocs');

        const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
        const doc = await createRes.json();

        if (content) {
          await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [{ insertText: { location: { index: 1 }, text: content } }],
            }),
          });
        }

        return Response.json({ doc_id: doc.documentId, title });
      }

      case 'create-task': {
        const { title, notes, due_date } = params;
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googletasks');

        const taskListsRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const taskLists = await taskListsRes.json();
        const taskListId = taskLists.items?.[0]?.id;

        if (!taskListId) return Response.json({ error: 'No task list found' }, { status: 400 });

        const taskBody = { title, notes };
        if (due_date) taskBody.due = due_date;

        const taskRes = await fetch(`https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(taskBody),
        });
        const task = await taskRes.json();

        return Response.json({ task_id: task.id, title });
      }

      case 'send-email': {
        const { to, subject, body: emailBody } = params;
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

        const email = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${emailBody}`;
        const encodedEmail = btoa(email);

        const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: encodedEmail }),
        });
        const result = await sendRes.json();

        return Response.json({ message_id: result.id, thread_id: result.threadId });
      }

      case 'create-event': {
        const { summary, description, start_time, end_time } = params;
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

        const eventBody = {
          summary,
          description,
          start: { dateTime: start_time, timeZone: 'America/New_York' },
          end: { dateTime: end_time, timeZone: 'America/New_York' },
        };

        const eventRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        });
        const event = await eventRes.json();

        return Response.json({ event_id: event.id, html_link: event.htmlLink });
      }

      default:
        return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}