/**
 * Client-side helper for Groq AI calls routed through backend server
 */

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function askGroqAI(messages: GroqChatMessage[]): Promise<string> {
  try {
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Aapka sawal read ho gaya hai, par koi response generate nahi ho paya.';
  } catch (err: any) {
    console.error('Error calling Groq proxy:', err);
    throw err;
  }
}
