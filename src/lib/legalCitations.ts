/**
 * Structured reference table of well-known Indian law citations.
 * Pure TypeScript — no imports from other project files; runs in
 * browser and Node. Used for hallucination-proofing the AI.
 */

/** Legal area categories used across the citation table. */
export type LegalCategory =
  | 'property'
  | 'tenant'
  | 'family'
  | 'consumer'
  | 'labour'
  | 'criminal'
  | 'procedure'
  | 'constitutional';

/** A single, verified legal citation entry. */
export interface LegalCitation {
  id: string;
  act: string;
  actShort: string;
  section: string;
  title: string;
  summary: string;
  category: string;
  keywords: string[];
}

/** Curated, hand-verified citations of Indian law. */
export const LEGAL_CITATIONS: LegalCitation[] = [
  // ---------- IPC (Indian Penal Code, 1860) ----------
  {
    id: 'IPC-302',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '302',
    title: 'Murder',
    summary: 'Punishment for murder — death or imprisonment for life, and fine.',
    category: 'criminal',
    keywords: ['murder', 'killing', 'death penalty', 'life imprisonment', 'homicide'],
  },
  {
    id: 'IPC-304',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '304',
    title: 'Culpable homicide not amounting to murder',
    summary: 'Culpable homicide not amounting to murder — imprisonment up to life or 10 years, and fine.',
    category: 'criminal',
    keywords: ['culpable homicide', 'manslaughter', 'death', 'killing'],
  },
  {
    id: 'IPC-307',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '307',
    title: 'Attempt to murder',
    summary: 'Attempt to murder — imprisonment up to 10 years (life, and fine, if hurt is caused).',
    category: 'criminal',
    keywords: ['attempt to murder', 'attempted murder', 'shooting', 'attempt'],
  },
  {
    id: 'IPC-323',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '323',
    title: 'Voluntarily causing hurt',
    summary: 'Voluntarily causing hurt — imprisonment up to 1 year, or fine, or both.',
    category: 'criminal',
    keywords: ['hurt', 'assault', 'injury', 'beating', 'voluntary hurt'],
  },
  {
    id: 'IPC-354',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '354',
    title: 'Assault or criminal force to outrage modesty',
    summary: 'Assault or criminal force on a woman with intent to outrage her modesty — 1 to 5 years imprisonment and fine.',
    category: 'criminal',
    keywords: ['outraging modesty', 'women', 'assault', 'criminal force', 'eve teasing', 'harassment'],
  },
  {
    id: 'IPC-375',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '375',
    title: 'Rape',
    summary: 'Defines rape — sexual intercourse without consent, against her will, or by coercion.',
    category: 'criminal',
    keywords: ['rape', 'sexual assault', 'sexual intercourse', 'consent'],
  },
  {
    id: 'IPC-415',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '415',
    title: 'Cheating (definition)',
    summary: 'Defines cheating — deceiving any person fraudulently or dishonestly.',
    category: 'criminal',
    keywords: ['cheating', 'fraud', 'deceit', 'deception', 'definition'],
  },
  {
    id: 'IPC-417',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '417',
    title: 'Punishment for cheating',
    summary: 'Punishment for simple cheating — imprisonment up to 1 year, or fine, or both.',
    category: 'criminal',
    keywords: ['cheating', 'fraud', 'punishment'],
  },
  {
    id: 'IPC-420',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '420',
    title: 'Cheating and dishonestly inducing delivery of property',
    summary: 'Cheating that dishonestly induces delivery of property — imprisonment up to 7 years and fine.',
    category: 'criminal',
    keywords: ['cheating', 'fraud', '420', 'money', 'property', 'scam', 'deception', 'dishonestly'],
  },
  {
    id: 'IPC-441',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '441',
    title: 'Criminal trespass',
    summary: 'Defines criminal trespass — entering or remaining on another\'s property with intent to commit an offence.',
    category: 'property',
    keywords: ['criminal trespass', 'trespass', 'entry', 'property', 'possession'],
  },
  {
    id: 'IPC-447',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '447',
    title: 'Punishment for criminal trespass',
    summary: 'Punishment for criminal trespass — imprisonment up to 3 months, or fine, or both.',
    category: 'property',
    keywords: ['criminal trespass', 'trespass', 'punishment', 'property'],
  },
  {
    id: 'IPC-448',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '448',
    title: 'House-trespass',
    summary: 'Punishment for house-trespass — imprisonment up to 1 year, or fine, or both.',
    category: 'property',
    keywords: ['house trespass', 'trespass', 'home', 'dwelling', 'property'],
  },
  {
    id: 'IPC-499',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '499',
    title: 'Defamation (definition)',
    summary: 'Defines defamation — imputation made to harm a person\'s reputation.',
    category: 'criminal',
    keywords: ['defamation', 'reputation', 'libel', 'slander', 'insult'],
  },
  {
    id: 'IPC-500',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '500',
    title: 'Punishment for defamation',
    summary: 'Punishment for defamation — simple imprisonment up to 2 years, or fine, or both.',
    category: 'criminal',
    keywords: ['defamation', 'punishment', 'reputation', 'libel'],
  },
  {
    id: 'IPC-498A',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '498A',
    title: 'Cruelty by husband or relatives',
    summary: 'Cruelty by a husband or his relatives towards a married woman — imprisonment up to 3 years and fine.',
    category: 'family',
    keywords: ['cruelty', 'husband', 'marriage', 'wife', 'domestic', 'dowry harassment', '498a'],
  },
  {
    id: 'IPC-503',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '503',
    title: 'Criminal intimidation (definition)',
    summary: 'Defines criminal intimidation — threatening injury to person, reputation or property to cause alarm.',
    category: 'criminal',
    keywords: ['criminal intimidation', 'threat', 'threatening', 'intimidation', 'alarm'],
  },
  {
    id: 'IPC-504',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '504',
    title: 'Intentional insult to provoke breach of peace',
    summary: 'Intentional insult intended to provoke a breach of public peace — imprisonment up to 2 years, or fine, or both.',
    category: 'criminal',
    keywords: ['insult', 'provocation', 'breach of peace', 'abuse', 'defamation'],
  },
  {
    id: 'IPC-506',
    act: 'Indian Penal Code, 1860',
    actShort: 'IPC',
    section: '506',
    title: 'Punishment for criminal intimidation',
    summary: 'Punishment for criminal intimidation — up to 2 years (up to 7 years for grave threats such as death or grievous hurt).',
    category: 'criminal',
    keywords: ['criminal intimidation', 'threat', 'punishment', 'intimidation'],
  },

  // ---------- BNS (Bharatiya Nyaya Sanhita, 2023) ----------
  {
    id: 'BNS-103',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '103',
    title: 'Murder',
    summary: 'Successor to IPC 302 — punishment for murder, including (death or life imprisonment); sub-section (2) covers mob lynching.',
    category: 'criminal',
    keywords: ['murder', 'bns', 'killing', 'mob lynching', 'homicide'],
  },
  {
    id: 'BNS-109',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '109',
    title: 'Attempt to murder',
    summary: 'Successor to IPC 307 — attempt to murder, punishable with up to 10 years imprisonment (life, with fine, if hurt is caused).',
    category: 'criminal',
    keywords: ['attempt to murder', 'attempt', 'bns', 'attempted murder'],
  },
  {
    id: 'BNS-318',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '318',
    title: 'Cheating',
    summary: 'Successor to IPC 415/420 — cheating that dishonestly induces delivery of property; imprisonment up to 7 years for the aggravated form.',
    category: 'criminal',
    keywords: ['cheating', 'fraud', 'bns', 'deception', 'money', 'scam'],
  },
  {
    id: 'BNS-85',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '85',
    title: 'Cruelty by husband or relatives',
    summary: 'Successor to IPC 498A — cruelty by a husband or his relatives towards a married woman; up to 3 years imprisonment and fine.',
    category: 'family',
    keywords: ['cruelty', 'husband', 'wife', 'marriage', 'domestic', 'bns'],
  },
  {
    id: 'BNS-80',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '80',
    title: 'Dowry death',
    summary: 'Successor to IPC 304B — dowry death of a woman within 7 years of marriage; imprisonment not less than 7 years, up to life.',
    category: 'criminal',
    keywords: ['dowry death', 'dowry', 'bride burning', 'bns', 'death'],
  },
  {
    id: 'BNS-79',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '79',
    title: 'Word, gesture or act insulting modesty',
    summary: 'Successor to IPC 509 — word, sound, gesture or act intended to insult a woman\'s modesty; up to 3 years simple imprisonment and fine.',
    category: 'criminal',
    keywords: ['modesty', 'insult', 'women', 'privacy', 'bns'],
  },
  {
    id: 'BNS-74',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '74',
    title: 'Outraging modesty of a woman',
    summary: 'Successor to IPC 354 — assault or criminal force on a woman to outrage her modesty; 1 to 5 years imprisonment and fine.',
    category: 'criminal',
    keywords: ['outraging modesty', 'assault', 'women', 'criminal force', 'bns'],
  },
  {
    id: 'BNS-76',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '76',
    title: 'Assault with intent to disrobe',
    summary: 'Successor to IPC 354B — assault on a woman with intent to disrobe or compel her to be naked; 3 to 7 years imprisonment.',
    category: 'criminal',
    keywords: ['disrobe', 'assault', 'women', 'naked', 'bns'],
  },
  {
    id: 'BNS-351',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '351',
    title: 'Criminal intimidation',
    summary: 'Successor to IPC 503/506 — criminal intimidation by threats; up to 2 years imprisonment, up to 7 years for grave threats.',
    category: 'criminal',
    keywords: ['criminal intimidation', 'threat', 'threatening', 'intimidation', 'bns'],
  },
  {
    id: 'BNS-352',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '352',
    title: 'Intentional insult to provoke breach of peace',
    summary: 'Successor to IPC 504 — intentional insult intended to provoke a breach of the peace; up to 2 years imprisonment or fine.',
    category: 'criminal',
    keywords: ['insult', 'provocation', 'breach of peace', 'abuse', 'bns'],
  },
  {
    id: 'BNS-355',
    act: 'Bharatiya Nyaya Sanhita, 2023',
    actShort: 'BNS',
    section: '355',
    title: 'Misconduct in public by a drunken person',
    summary: 'Misconduct in a public place while intoxicated — simple imprisonment up to 24 hours, or fine, or community service.',
    category: 'criminal',
    keywords: ['drunken', 'intoxication', 'public place', 'misconduct', 'bns'],
  },

  // ---------- CrPC (Code of Criminal Procedure, 1973) ----------
  {
    id: 'CRPC-41',
    act: 'Code of Criminal Procedure, 1973',
    actShort: 'CrPC',
    section: '41',
    title: 'Arrest without warrant',
    summary: 'When a police officer may arrest a person without a warrant (cognizable offences, credible information, etc.).',
    category: 'procedure',
    keywords: ['arrest', 'police', 'warrant', 'cognizable', 'bail'],
  },
  {
    id: 'CRPC-154',
    act: 'Code of Criminal Procedure, 1973',
    actShort: 'CrPC',
    section: '154',
    title: 'FIR — First Information Report',
    summary: 'Police must record in writing the information of a cognizable offence given orally or in writing (the FIR).',
    category: 'procedure',
    keywords: ['fir', 'first information report', 'police', 'complaint', 'cognizable', 'lodge'],
  },
  {
    id: 'CRPC-156',
    act: 'Code of Criminal Procedure, 1973',
    actShort: 'CrPC',
    section: '156',
    title: 'Investigation by police',
    summary: 'Power of police to investigate cognizable offences; a Magistrate may order investigation under section 156(3).',
    category: 'procedure',
    keywords: ['investigation', 'police', 'magistrate', 'cognizable', 'enquiry'],
  },
  {
    id: 'CRPC-200',
    act: 'Code of Criminal Procedure, 1973',
    actShort: 'CrPC',
    section: '200',
    title: 'Examination of complainant',
    summary: 'Examination of the complainant and witnesses on oath before a Magistrate takes cognizance of a complaint.',
    category: 'procedure',
    keywords: ['complaint', 'magistrate', 'cognizance', 'examination', 'witness'],
  },
  {
    id: 'CRPC-482',
    act: 'Code of Criminal Procedure, 1973',
    actShort: 'CrPC',
    section: '482',
    title: 'Inherent powers of High Court',
    summary: 'Inherent powers of the High Court to prevent abuse of process or secure the ends of justice (quashing FIRs).',
    category: 'procedure',
    keywords: ['high court', 'quash', 'quashing fir', 'inherent powers', 'abuse of process'],
  },
  {
    id: 'CRPC-125',
    act: 'Code of Criminal Procedure, 1973',
    actShort: 'CrPC',
    section: '125',
    title: 'Maintenance of wife, children and parents',
    summary: 'A person with sufficient means may be ordered to pay monthly maintenance to a wife, children or parents who cannot maintain themselves (renumbered as Section 144 BNSS w.e.f. 1 July 2024).',
    category: 'family',
    keywords: ['maintenance', 'wife', 'children', 'parents', 'alimony', 'support', 'bnss 144'],
  },

  // ---------- BNSS (Bharatiya Nagarik Suraksha Sanhita, 2023) ----------
  {
    id: 'BNSS-173',
    act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    actShort: 'BNSS',
    section: '173',
    title: 'Registration of FIR',
    summary: 'Successor to CrPC 154 — mandatory registration of information of a cognizable offence; introduces e-FIR, Zero FIR and preliminary enquiry.',
    category: 'procedure',
    keywords: ['fir', 'first information report', 'bnss', 'e-fir', 'zero fir', 'cognizable', 'police'],
  },
  {
    id: 'BNSS-144',
    act: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    actShort: 'BNSS',
    section: '144',
    title: 'Maintenance of wife, children and parents',
    summary: 'Successor to CrPC 125 — order for maintenance of wives, children and parents who cannot maintain themselves.',
    category: 'family',
    keywords: ['maintenance', 'wife', 'children', 'parents', 'bnss', 'alimony'],
  },

  // ---------- Consumer Protection Act, 2019 ----------
  {
    id: 'CPA-2',
    act: 'Consumer Protection Act, 2019',
    actShort: 'CPA',
    section: '2',
    title: 'Definitions — consumer, goods, services',
    summary: 'Defines consumer, goods, services, defect and deficiency; includes online and e-commerce purchases.',
    category: 'consumer',
    keywords: ['consumer', 'definition', 'goods', 'services', 'defect', 'deficiency', 'e-commerce', 'buyer'],
  },
  {
    id: 'CPA-35',
    act: 'Consumer Protection Act, 2019',
    actShort: 'CPA',
    section: '35',
    title: 'Manner in which a complaint is made',
    summary: 'A consumer complaint is filed with the District Consumer Commission, including by electronic means.',
    category: 'consumer',
    keywords: ['complaint', 'district commission', 'consumer', 'filing', 'e-filing', 'consumer forum'],
  },
  {
    id: 'CPA-39',
    act: 'Consumer Protection Act, 2019',
    actShort: 'CPA',
    section: '39',
    title: 'Findings of the District Commission',
    summary: 'Relief the District Commission can grant on a consumer complaint, including refund, replacement, compensation and punitive damages.',
    category: 'consumer',
    keywords: ['consumer', 'relief', 'compensation', 'refund', 'replacement', 'district commission', 'damages'],
  },

  // ---------- RTI Act, 2005 ----------
  {
    id: 'RTI-2',
    act: 'Right to Information Act, 2005',
    actShort: 'RTI',
    section: '2',
    title: 'Definitions — information and public authority',
    summary: 'Defines "information" and "public authority" and states the scope of the right to information.',
    category: 'procedure',
    keywords: ['rti', 'information', 'public authority', 'definition', 'right to information'],
  },
  {
    id: 'RTI-6',
    act: 'Right to Information Act, 2005',
    actShort: 'RTI',
    section: '6',
    title: 'Request for obtaining information',
    summary: 'Any citizen may request information from a public authority by application, with the prescribed fee.',
    category: 'procedure',
    keywords: ['rti', 'request', 'application', 'information', 'public authority', 'fee'],
  },
  {
    id: 'RTI-7',
    act: 'Right to Information Act, 2005',
    actShort: 'RTI',
    section: '7',
    title: 'Disposal of request',
    summary: 'Public authority must respond within 30 days (48 hours where life or liberty is involved).',
    category: 'procedure',
    keywords: ['rti', 'response', '30 days', 'time limit', 'information', 'disposal'],
  },

  // ---------- Right to Public Services ----------
  {
    id: 'RTS-MH-4',
    act: 'Maharashtra Right to Public Services Act, 2015',
    actShort: 'RTS',
    section: '4',
    title: 'Right to obtain public services within stipulated time',
    summary: 'Right of an eligible person to obtain notified public services from the Government within the stipulated time limit (state-level, time-bound services).',
    category: 'procedure',
    keywords: ['right to service', 'public services', 'government', 'certificate', 'time limit', 'rts', 'maharashtra'],
  },

  // ---------- Hindu Marriage Act, 1955 ----------
  {
    id: 'HMA-5',
    act: 'Hindu Marriage Act, 1955',
    actShort: 'HMA',
    section: '5',
    title: 'Conditions for a valid Hindu marriage',
    summary: 'Conditions of a valid Hindu marriage — including monogamy, capacity for consent, and age requirements.',
    category: 'family',
    keywords: ['marriage', 'valid marriage', 'conditions', 'monogamy', 'hindu', 'age', 'consent'],
  },
  {
    id: 'HMA-13',
    act: 'Hindu Marriage Act, 1955',
    actShort: 'HMA',
    section: '13',
    title: 'Grounds for divorce',
    summary: 'Grounds on which either party may petition for divorce — cruelty, adultery, desertion, conversion, etc.',
    category: 'family',
    keywords: ['divorce', 'grounds', 'cruelty', 'adultery', 'desertion', 'marriage'],
  },
  {
    id: 'HMA-13B',
    act: 'Hindu Marriage Act, 1955',
    actShort: 'HMA',
    section: '13B',
    title: 'Divorce by mutual consent',
    summary: 'Divorce by mutual consent — joint petition before the court with a cooling-off period of six months.',
    category: 'family',
    keywords: ['divorce', 'mutual consent', 'joint petition', 'cooling period', 'marriage'],
  },
  {
    id: 'HMA-25',
    act: 'Hindu Marriage Act, 1955',
    actShort: 'HMA',
    section: '25',
    title: 'Permanent alimony and maintenance',
    summary: 'Permanent alimony and maintenance payable by either party after a decree is granted or dismissed.',
    category: 'family',
    keywords: ['maintenance', 'alimony', 'permanent alimony', 'divorce', 'spouse', 'wife', 'husband'],
  },
  {
    id: 'HMA-26',
    act: 'Hindu Marriage Act, 1955',
    actShort: 'HMA',
    section: '26',
    title: 'Custody of children',
    summary: 'Orders regarding the custody, maintenance and education of children during and after matrimonial proceedings.',
    category: 'family',
    keywords: ['custody', 'children', 'child custody', 'maintenance', 'education', 'divorce'],
  },

  // ---------- Hindu Succession Act, 1956 ----------
  {
    id: 'HSA-6',
    act: 'Hindu Succession Act, 1956',
    actShort: 'HSA',
    section: '6',
    title: 'Coparcenary and daughters\' equal rights',
    summary: 'Interest in a coparcenary — daughters are equal coparceners with the same rights and liabilities as sons.',
    category: 'family',
    keywords: ['coparcenary', 'daughters', 'inheritance', 'succession', 'joint family', 'hindu'],
  },
  {
    id: 'HSA-8',
    act: 'Hindu Succession Act, 1956',
    actShort: 'HSA',
    section: '8',
    title: 'Intestate succession of a male Hindu',
    summary: 'General rules of succession where a male Hindu dies intestate — Class I heirs receive the property first.',
    category: 'family',
    keywords: ['succession', 'intestate', 'heirs', 'hindu', 'class i', 'inheritance', 'death'],
  },
  {
    id: 'HSA-14',
    act: 'Hindu Succession Act, 1956',
    actShort: 'HSA',
    section: '14',
    title: 'Property of a female Hindu — absolute owner',
    summary: 'Any property possessed by a female Hindu is held by her as absolute owner (full ownership, not restricted estate).',
    category: 'family',
    keywords: ['female hindu', 'women', 'absolute property', 'ownership', 'inheritance', 'succession'],
  },
  {
    id: 'HSA-15',
    act: 'Hindu Succession Act, 1956',
    actShort: 'HSA',
    section: '15',
    title: 'Intestate succession of a female Hindu',
    summary: 'General rules of succession where a female Hindu dies intestate.',
    category: 'family',
    keywords: ['succession', 'female hindu', 'intestate', 'heirs', 'inheritance'],
  },
  {
    id: 'HSA-30',
    act: 'Hindu Succession Act, 1956',
    actShort: 'HSA',
    section: '30',
    title: 'Testamentary succession',
    summary: 'A Hindu may dispose of property, including a coparcener\'s interest, by will or other testamentary disposition.',
    category: 'family',
    keywords: ['will', 'testament', 'succession', 'bequest', 'dispose by will'],
  },

  // ---------- Domestic Violence Act, 2005 ----------
  {
    id: 'DV-12',
    act: 'Protection of Women from Domestic Violence Act, 2005',
    actShort: 'DV Act',
    section: '12',
    title: 'Application to the Magistrate',
    summary: 'An aggrieved person (or another on her behalf) may file an application to a Magistrate for protection from domestic violence.',
    category: 'family',
    keywords: ['domestic violence', 'application', 'magistrate', 'complaint', 'protection', 'woman'],
  },
  {
    id: 'DV-18',
    act: 'Protection of Women from Domestic Violence Act, 2005',
    actShort: 'DV Act',
    section: '18',
    title: 'Protection orders',
    summary: 'The Magistrate may pass a protection order restraining the respondent from committing acts of domestic violence.',
    category: 'family',
    keywords: ['domestic violence', 'protection order', 'restraining', 'safety', 'magistrate'],
  },
  {
    id: 'DV-19',
    act: 'Protection of Women from Domestic Violence Act, 2005',
    actShort: 'DV Act',
    section: '19',
    title: 'Residence orders',
    summary: 'The right of the aggrieved person to reside in a shared household, including orders to secure that residence.',
    category: 'family',
    keywords: ['domestic violence', 'residence', 'shared household', 'home', 'housing', 'protection'],
  },

  // ---------- Dowry Prohibition Act, 1961 ----------
  {
    id: 'DOWRY-3',
    act: 'Dowry Prohibition Act, 1961',
    actShort: 'D.P. Act',
    section: '3',
    title: 'Penalty for giving or taking dowry',
    summary: 'Penalty for giving, taking or abetting the giving or taking of dowry — imprisonment up to 5 years and fine.',
    category: 'family',
    keywords: ['dowry', 'dowry demand', 'penalty', 'marriage', 'gift', 'harassment'],
  },

  // ---------- POSH Act, 2013 ----------
  {
    id: 'POSH-3',
    act: 'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
    actShort: 'POSH Act',
    section: '3',
    title: 'Prevention of sexual harassment at workplace',
    summary: 'No woman shall be subjected to sexual harassment at the workplace; employers must constitute an Internal Committee.',
    category: 'labour',
    keywords: ['sexual harassment', 'workplace', 'internal committee', 'posh', 'women', 'employer', 'icc'],
  },

  // ---------- RERA, 2016 ----------
  {
    id: 'RERA-3',
    act: 'Real Estate (Regulation and Development) Act, 2016',
    actShort: 'RERA',
    section: '3',
    title: 'Mandatory registration of real estate projects',
    summary: 'No promoter shall advertise, sell or offer a real estate project without registering it with the RERA Authority.',
    category: 'property',
    keywords: ['rera', 'real estate', 'builder', 'registration', 'project', 'promoter', 'apartment', 'flat'],
  },
  {
    id: 'RERA-18',
    act: 'Real Estate (Regulation and Development) Act, 2016',
    actShort: 'RERA',
    section: '18',
    title: 'Obligations of the promoter — refund with interest',
    summary: 'Promoter must complete and hand over the project as promised; on default the buyer may claim refund with interest.',
    category: 'property',
    keywords: ['rera', 'promoter', 'refund', 'interest', 'delay', 'possession', 'builder', 'flat', 'apartment'],
  },

  // ---------- Negotiable Instruments Act, 1881 ----------
  {
    id: 'NI-138',
    act: 'Negotiable Instruments Act, 1881',
    actShort: 'NI Act',
    section: '138',
    title: 'Dishonour of cheque',
    summary: 'Criminal liability of a drawer whose cheque is dishonoured for insufficiency of funds — punishment and compensation.',
    category: 'criminal',
    keywords: ['cheque', 'cheque bounce', 'dishonour', 'bounced cheque', 'insufficient funds', 'pay'],
  },

  // ---------- Registration Act, 1908 ----------
  {
    id: 'REG-17',
    act: 'Registration Act, 1908',
    actShort: 'Registration Act',
    section: '17',
    title: 'Documents requiring compulsory registration',
    summary: 'Documents of which registration is compulsory — including instruments of gift and transfer of immovable property.',
    category: 'property',
    keywords: ['registration', 'compulsory', 'immovable property', 'document', 'gift', 'sale'],
  },
  {
    id: 'REG-49',
    act: 'Registration Act, 1908',
    actShort: 'Registration Act',
    section: '49',
    title: 'Effect of non-registration',
    summary: 'An unregistered document required to be registered cannot affect immovable property or be received as evidence.',
    category: 'property',
    keywords: ['registration', 'unregistered', 'evidence', 'immovable property', 'effect'],
  },

  // ---------- Transfer of Property Act, 1882 ----------
  {
    id: 'TPA-5',
    act: 'Transfer of Property Act, 1882',
    actShort: 'TPA',
    section: '5',
    title: 'Transfer of property defined',
    summary: 'Defines transfer of property — the act of conveying property by one living person to another.',
    category: 'property',
    keywords: ['transfer', 'property', 'definition', 'living person', 'conveyance'],
  },
  {
    id: 'TPA-54',
    act: 'Transfer of Property Act, 1882',
    actShort: 'TPA',
    section: '54',
    title: 'Sale — how made',
    summary: 'Defines sale; sale of immovable property worth Rs 100 or more can be made only by a registered instrument.',
    category: 'property',
    keywords: ['sale', 'immovable property', 'registered', 'sale deed', 'ownership'],
  },
  {
    id: 'TPA-105',
    act: 'Transfer of Property Act, 1882',
    actShort: 'TPA',
    section: '105',
    title: 'Lease defined',
    summary: 'Defines lease — a transfer of the right to enjoy immovable property for a time, in exchange for rent or premium.',
    category: 'tenant',
    keywords: ['lease', 'landlord', 'tenant', 'rent', 'rental', 'premium', 'property'],
  },
  {
    id: 'TPA-111',
    act: 'Transfer of Property Act, 1882',
    actShort: 'TPA',
    section: '111',
    title: 'Determination of lease',
    summary: 'How a lease comes to an end — expiry, forfeiture, notice, merger of interest, etc.',
    category: 'tenant',
    keywords: ['lease', 'termination', 'eviction', 'forfeiture', 'notice', 'landlord', 'tenant', 'end of lease'],
  },

  // ---------- Limitation Act, 1963 ----------
  {
    id: 'LIM-ART65',
    act: 'Limitation Act, 1963',
    actShort: 'Limitation Act',
    section: 'Article 65',
    title: 'Suit for possession of immovable property',
    summary: 'Suit for possession of immovable property or interest based on title — limitation period of 12 years from dispossession.',
    category: 'property',
    keywords: ['limitation', 'possession', 'immovable property', '12 years', 'title', 'ejectment'],
  },
  {
    id: 'LIM-ART113',
    act: 'Limitation Act, 1963',
    actShort: 'Limitation Act',
    section: 'Article 113',
    title: 'Residuary suits',
    summary: 'Suit for which no period of limitation is prescribed elsewhere — limitation period of 3 years.',
    category: 'procedure',
    keywords: ['limitation', '3 years', 'residuary', 'suit', 'period of limitation'],
  },

  // ---------- Specific Relief Act, 1963 ----------
  {
    id: 'SRA-34',
    act: 'Specific Relief Act, 1963',
    actShort: 'SRA',
    section: '34',
    title: 'Discretionary declaratory relief',
    summary: 'A court may make a declaratory decree that the plaintiff is entitled to any legal character or to any right as to property.',
    category: 'property',
    keywords: ['declaration', 'declaratory decree', 'legal character', 'right', 'property', 'suit'],
  },
  {
    id: 'SRA-38',
    act: 'Specific Relief Act, 1963',
    actShort: 'SRA',
    section: '38',
    title: 'Perpetual injunction',
    summary: 'Perpetual injunction to prevent a breach of an obligation — a discretionary remedy restraining the invasion of a right.',
    category: 'property',
    keywords: ['injunction', 'perpetual injunction', 'restrain', 'obligation', 'trespass', 'property'],
  },

  // ---------- Indian Succession Act, 1925 ----------
  {
    id: 'ISA-63',
    act: 'Indian Succession Act, 1925',
    actShort: 'ISA',
    section: '63',
    title: 'Execution of unprivileged wills',
    summary: 'Requirements for the valid execution of an unprivileged will — signed by the testator and attested by witnesses.',
    category: 'property',
    keywords: ['will', 'execution', 'attestation', 'testator', 'witness', 'inheritance', 'succession'],
  },

  // ---------- Payment of Gratuity Act, 1972 ----------
  {
    id: 'GRAT-4',
    act: 'Payment of Gratuity Act, 1972',
    actShort: 'PGA',
    section: '4',
    title: 'Payment of gratuity',
    summary: 'Gratuity is payable on termination of employment after 5 years\' continuous service — capped monthly wage formula.',
    category: 'labour',
    keywords: ['gratuity', 'employee', 'retirement', 'termination', 'service', '5 years', 'employer', 'payment'],
  },

  // ---------- Industrial Disputes Act, 1947 ----------
  {
    id: 'IDA-2A',
    act: 'Industrial Disputes Act, 1947',
    actShort: 'IDA',
    section: '2A',
    title: 'Discharge or dismissal as industrial dispute',
    summary: 'A dismissal, discharge or retrenchment of an individual workman is itself an industrial dispute even without other workmen.',
    category: 'labour',
    keywords: ['industrial dispute', 'dismissal', 'discharge', 'retrenchment', 'workman', 'labour', 'termination'],
  },
  {
    id: 'IDA-25F',
    act: 'Industrial Disputes Act, 1947',
    actShort: 'IDA',
    section: '25F',
    title: 'Conditions precedent to retrenchment',
    summary: 'Retrenchment of a workman requires one month\'s notice (or wages in lieu) and compensation of 15 days\' wages per completed year.',
    category: 'labour',
    keywords: ['retrenchment', 'workman', 'notice', 'compensation', 'labour', 'employment', 'termination'],
  },

  // ---------- Code of Civil Procedure, 1908 ----------
  {
    id: 'CPC-O39R1',
    act: 'Code of Civil Procedure, 1908',
    actShort: 'CPC',
    section: 'Order 39 Rule 1',
    title: 'Temporary injunction',
    summary: 'The court may grant a temporary injunction to restrain an act that threatens property in dispute pending the suit.',
    category: 'procedure',
    keywords: ['injunction', 'temporary injunction', 'civil', 'property', 'pending suit', 'cpc', 'restrain'],
  },
];

/**
 * Splits free text into lowercase alphanumeric search tokens.
 */
function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Escapes a string for safe use inside a RegExp.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scores one citation against the query tokens, using weighted
 * matches against title, keywords, summary, act, actShort and section.
 * A token that exactly equals the section number scores highest.
 */
function scoreCitation(c: LegalCitation, tokens: string[]): number {
  const fields: ReadonlyArray<{ text: string; weight: number }> = [
    { text: c.section, weight: 6 },
    { text: c.title, weight: 5 },
    { text: c.keywords.join(' '), weight: 4 },
    { text: c.summary, weight: 3 },
    { text: c.act, weight: 2 },
    { text: c.actShort, weight: 2 },
  ];

  let score = 0;
  for (const token of tokens) {
    const boundary = new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}(?=$|[^a-z0-9])`, 'i');
    let best = 0;
    for (const field of fields) {
      if (boundary.test(field.text)) best = Math.max(best, field.weight);
    }
    if (token === c.section.toLowerCase()) best = Math.max(best, 10);
    score += best;
  }
  return score;
}

/**
 * Retrieval of citations by keyword/token-match scoring.
 * Sorted by score descending, returning up to `limit` results (default 5).
 */
export function searchLegalCitations(query: string, limit?: number): LegalCitation[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const max = typeof limit === 'number' && limit > 0 ? limit : 5;

  return LEGAL_CITATIONS.map((c) => ({ c, score: scoreCitation(c, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id))
    .slice(0, max)
    .map((r) => r.c);
}

/**
 * Formats a citation as a compact, readable label, e.g. "IPC 420 — Cheating".
 */
export function formatCitation(c: LegalCitation): string {
  return `${c.actShort} ${c.section} — ${c.title}`;
}

/** Standard disclaimer to append to any AI-generated legal guidance. */
export const DISCLAIMER_FOOTER =
  "This is AI-generated guidance, not a substitute for a licensed advocate's advice.";

/**
 * Builds a prompt fragment quoting verified citations for the query,
 * so the AI cites exactly these sections and never invents new ones.
 * Returns an empty string when nothing matches.
 */
export function buildCitationContext(query: string, limit?: number): string {
  const matches = searchLegalCitations(query, limit);
  if (matches.length === 0) return '';

  const lines = matches.map((c) => ` - ${formatCitation(c)}: ${c.summary}`);
  return (
    'AVAILABLE LEGAL CITATIONS (cite exactly these — never invent a section):\n' +
    lines.join('\n')
  );
}