export async function generateDocument(
  templateKey: string,
  values: Record<string, string>,
  citizenId?: string
): Promise<{ docxBase64: string; fileName: string; text: string; mimeType: string } | null> {
  try {
    const res = await fetch('/api/documents/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_key: templateKey,
        values,
        citizen_id: citizenId || 'guest_citizen',
        ai_polish: true,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.docxBase64) {
        return {
          docxBase64: json.docxBase64,
          fileName: json.fileName,
          text: json.text,
          mimeType: json.mimeType,
        };
      }
      if (json.success && json.text) {
        return { docxBase64: '', fileName: `${templateKey}.txt`, text: json.text, mimeType: 'text/plain' };
      }
    }
  } catch (err) {
    console.warn('generateDocument proxy notice:', err);
  }
  return null;
}
