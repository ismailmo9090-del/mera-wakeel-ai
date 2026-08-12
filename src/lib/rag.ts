import { LegalKnowledgeBase, CaseCategory } from '../types/database';
import { getSupabase, generateUUID } from './supabase';

// Helper to compute cosine similarity between two 768-dimensional vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Client-side fallback feature vector generator (768-dim) if server API is offline
export function generateDeterministicEmbedding(text: string): number[] {
  const dim = 768;
  const vec = new Array(dim).fill(0);
  const clean = text.toLowerCase().trim();
  if (!clean) return vec;

  // Term frequency & character n-gram hashing
  const words = clean.split(/\W+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1.0 / (i + 1);
  }

  // Normalize
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => v / norm);
}

// Request embedding from server (or generate locally if server offline)
export async function getVectorEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch('/api/rag/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.embedding && Array.isArray(data.embedding) && data.embedding.length > 0) {
        return data.embedding;
      }
    }
  } catch (err) {
    console.warn('Embedding API request failed, using deterministic local embedding vector:', err);
  }

  return generateDeterministicEmbedding(text);
}

// Pre-seeded foundational Indian Act sections
export const DEFAULT_INDIAN_LAW_SEED_CHUNKS: Omit<LegalKnowledgeBase, 'id'>[] = [
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 6',
    category: 'property',
    content: 'Devolution of interest in coparcenary property. On and from the commencement of the Hindu Succession (Amendment) Act, 2005, in a Joint Hindu family governed by the Mitakshara law, the daughter of a coparcenary shall by birth become a coparcenary in her own right in the same manner as the son, and shall have the same rights in coparcenary property as she would have had if she had been a son.',
  },
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 8',
    category: 'family',
    content: 'General rules of succession in the case of males. The property of an intestate male Hindu devolves firstly upon the Class I heirs specified in the Schedule (including son, daughter, widow, mother), secondly upon Class II heirs, thirdly upon agnates, and lastly upon cognates in equal shares.',
  },
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 54',
    category: 'property',
    content: '"Sale" defined. Sale is a transfer of ownership in exchange for a price paid or promised or part-paid and part-promised. Sale of tangible immovable property of the value of one hundred rupees and upwards can be made only by a registered instrument. An unregistered agreement to sell or General Power of Attorney (GPA) sale does not convey legal ownership title (Suraj Lamp principle).',
  },
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 106',
    category: 'tenant',
    content: 'Duration of certain leases in absence of written contract or local usage. In the absence of a contract or local law or usage to the contrary, a lease of immovable property for agricultural or manufacturing purposes shall be deemed to be a lease from year to year, terminable on the part of either lessor or lessee by six months notice. A lease for any other purpose (including residential or commercial tenancy) shall be deemed to be a lease from month to month, terminable by fifteen days notice.',
  },
  {
    act_name: 'Delhi Rent Control Act, 1958',
    section_number: 'Section 14',
    category: 'tenant',
    content: 'Protection of tenant against eviction. Notwithstanding anything to the contrary contained in any other law or contract, no order or decree for the recovery of possession of any premises shall be made by any court or Controller in favour of the landlord against a tenant, except on specific grounds such as non-payment of rent despite notice, subletting without landlord consent, or bona fide necessity.',
  },
  {
    act_name: 'Consumer Protection Act, 2019',
    section_number: 'Section 35',
    category: 'consumer',
    content: 'Manner in which complaint shall be made before District Commission. A consumer, recognized consumer association, or central authority may file a complaint regarding deficiency in goods/services or unfair trade practices within two years from the date on which the cause of action arose.',
  },
  {
    act_name: 'Negotiable Instruments Act, 1881',
    section_number: 'Section 138',
    category: 'other',
    content: 'Dishonour of cheque for insufficiency, etc., of funds in the account. Where any cheque drawn by a person on an account maintained by him with a banker for payment of any amount of money to another person for the discharge of any debt or liability is returned unpaid by the bank, such person shall be deemed to have committed an offence and shall be punished with imprisonment for a term which may be extended to two years, or with fine which may extend to twice the amount of the cheque, provided statutory notice is issued within 30 days of receiving return memo.',
  },
  {
    act_name: 'Industrial Disputes Act, 1947',
    section_number: 'Section 25F',
    category: 'labour',
    content: 'Conditions precedent to retrenchment of workmen. No workman employed in any industry who has been in continuous service for not less than one year under an employer shall be retrenched by that employer until the workman has been given one month notice in writing indicating the reasons for retrenchment and retrenchment compensation equivalent to 15 days average pay for every completed year of service.',
  },
];

// Get knowledge base items from fallback / DB
export function getLocalKnowledgeBase(): LegalKnowledgeBase[] {
  return [];
}

export function saveLocalKnowledgeBase(items: LegalKnowledgeBase[]) {
  // No-op: DB is primary source of truth
}

// Fetch all knowledge base chunks (combining Supabase DB & local cache)
export async function fetchAllKnowledgeChunks(): Promise<LegalKnowledgeBase[]> {
  let chunks: LegalKnowledgeBase[] = [];

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('legal_knowledge_base').select('*').order('act_name');
      if (!error && data && data.length > 0) {
        chunks = data as LegalKnowledgeBase[];
        saveLocalKnowledgeBase(chunks);
        return chunks;
      }
    } catch (e) {
      console.warn('Supabase fetchAllKnowledgeChunks error:', e);
    }
  }

  // Fallback to local storage or seed defaults
  const local = getLocalKnowledgeBase();
  if (local.length > 0) return local;

  // Initialize seed chunks if empty
  await seedDefaultKnowledgeBase();
  return getLocalKnowledgeBase();
}

// Insert a new chunk into the knowledge base
export async function insertKnowledgeChunk(input: {
  act_name: string;
  section_number?: string | null;
  category?: CaseCategory | null;
  content: string;
}): Promise<LegalKnowledgeBase> {
  const embedding = await getVectorEmbedding(`${input.act_name} ${input.section_number || ''} ${input.content}`);

  const newChunk: LegalKnowledgeBase = {
    id: generateUUID(),
    act_name: input.act_name.trim(),
    section_number: input.section_number ? input.section_number.trim() : null,
    category: input.category || 'other',
    content: input.content.trim(),
    embedding,
  };

  // Save to Supabase DB if connected
  const client = getSupabase();
  if (client) {
    try {
      await client.from('legal_knowledge_base').insert(newChunk);
    } catch (err) {
      console.warn('Supabase insert knowledge chunk warning:', err);
    }
  }

  // Also save locally
  const current = getLocalKnowledgeBase();
  current.unshift(newChunk);
  saveLocalKnowledgeBase(current);

  return newChunk;
}

// Delete chunk from knowledge base
export async function deleteKnowledgeChunk(id: string): Promise<boolean> {
  const client = getSupabase();
  if (client) {
    try {
      await client.from('legal_knowledge_base').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete knowledge chunk error:', err);
    }
  }

  const current = getLocalKnowledgeBase().filter((c) => c.id !== id);
  saveLocalKnowledgeBase(current);
  return true;
}

// Seed default Indian Acts into knowledge base if empty
export async function seedDefaultKnowledgeBase(): Promise<number> {
  const existing = getLocalKnowledgeBase();
  if (existing.length >= DEFAULT_INDIAN_LAW_SEED_CHUNKS.length) {
    return existing.length;
  }

  const preparedChunks: LegalKnowledgeBase[] = [];

  for (const item of DEFAULT_INDIAN_LAW_SEED_CHUNKS) {
    const textToEmbed = `${item.act_name} ${item.section_number || ''} ${item.content}`;
    const embedding = generateDeterministicEmbedding(textToEmbed);
    preparedChunks.push({
      id: generateUUID(),
      act_name: item.act_name,
      section_number: item.section_number,
      category: item.category,
      content: item.content,
      embedding,
    });
  }

  saveLocalKnowledgeBase(preparedChunks);

  // Try bulk insert into Supabase if available
  const client = getSupabase();
  if (client) {
    try {
      await client.from('legal_knowledge_base').upsert(preparedChunks, { onConflict: 'id' });
    } catch (e) {
      console.warn('Bulk seed into Supabase warning:', e);
    }
  }

  return preparedChunks.length;
}

// Perform vector similarity search against legal knowledge base
export async function searchKnowledgeBase(
  query: string,
  category?: CaseCategory | null,
  limit: number = 4
): Promise<{ chunk: LegalKnowledgeBase; similarity: number }[]> {
  if (!query || !query.trim()) return [];

  // Generate query embedding
  const queryVec = await getVectorEmbedding(query);

  // Retrieve all chunks from storage
  let chunks = await fetchAllKnowledgeChunks();

  if (category) {
    // Priority filter by category if specified, but keep others in fallback
    const categoryMatched = chunks.filter((c) => c.category === category);
    if (categoryMatched.length >= 2) {
      chunks = categoryMatched;
    }
  }

  // Calculate similarity for each chunk
  const scored = chunks.map((chunk) => {
    let vec = chunk.embedding;
    if (!vec || vec.length === 0) {
      vec = generateDeterministicEmbedding(`${chunk.act_name} ${chunk.section_number || ''} ${chunk.content}`);
    }
    const similarity = cosineSimilarity(queryVec, vec);
    return { chunk, similarity };
  });

  // Sort by highest similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit);
}

// Format retrieved law chunks into grounded context string for AI system prompt
export function formatRAGContext(
  retrievedChunks: { chunk: LegalKnowledgeBase; similarity: number }[],
  similarityThreshold: number = 0.25
): { contextText: string; isGrounded: boolean } {
  // Filter chunks meeting minimum similarity
  const validChunks = retrievedChunks.filter((item) => item.similarity >= similarityThreshold);

  if (validChunks.length === 0) {
    return {
      contextText:
        'Grounding Note: No specific section was retrieved from the legal knowledge base for this exact query. Speak in clear, general legal terms based on established Indian principles, and avoid fabricating specific section numbers or fake statute citations.',
      isGrounded: false,
    };
  }

  const chunkLines = validChunks.map((item, idx) => {
    const { chunk } = item;
    return `${idx + 1}. [${chunk.act_name}${chunk.section_number ? `, ${chunk.section_number}` : ''}]: ${chunk.content}`;
  });

  const contextText = `Relevant Indian Law Context (use this to ground your answer, do not invent sections not shown here):\n${chunkLines.join('\n\n')}`;

  return {
    contextText,
    isGrounded: true,
  };
}
