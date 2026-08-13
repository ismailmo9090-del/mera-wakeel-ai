/**
 * Pre-defined Indian legal document templates and rendering helpers.
 * Pure TypeScript, dependency-free, browser + Node compatible.
 */

/** Identifies one of the built-in document templates. */
export type DocumentTemplateKey =
  | 'legal_notice'
  | 'rent_agreement'
  | 'consumer_complaint'
  | 'rti_application'
  | 'termination_notice';

/** Describes a single input field collected for a template. */
export interface DocumentTemplateField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea';
  required: boolean;
}

/** A named document template with its fields and render function. */
export interface DocumentTemplate {
  key: DocumentTemplateKey;
  label: string;
  description: string;
  fields: DocumentTemplateField[];
  render(values: Record<string, string>): string;
}

/** Placeholder used when a rendered field value is missing. */
const NOT_PROVIDED = '[NOT PROVIDED]';

/** Reads a value from the provided map, substituting a placeholder if absent. */
function v(values: Record<string, string>, key: string): string {
  const value = values[key];
  return value !== undefined && value.trim() !== '' ? value.trim() : NOT_PROVIDED;
}

/** Renders a standard signature block. */
function signatureBlock(name: string, designation: string): string {
  return [
    `Signature: ____`,
    `Name: ${name}`,
    `Designation: ${designation}`,
  ].join('\n');
}

/** Legal notice template — Section 138 NI Act / general demand notice. */
const LEGAL_NOTICE: DocumentTemplate = {
  key: 'legal_notice',
  label: 'Legal Notice',
  description:
    'Formal legal notice for recovery of dues, including an optional mention of Section 138 of the Negotiable Instruments Act, 1881.',
  fields: [
    { key: 'recipient_name', label: 'Recipient Name', type: 'text', required: true },
    { key: 'recipient_address', label: 'Recipient Address', type: 'textarea', required: true },
    { key: 'sender_name', label: 'Sender Name', type: 'text', required: true },
    { key: 'sender_address', label: 'Sender Address', type: 'textarea', required: true },
    { key: 'subject', label: 'Subject', type: 'text', required: true },
    { key: 'facts_description', label: 'Facts and Narration', type: 'textarea', required: true },
    { key: 'clause_or_amount', label: 'Clause or Amount Due', type: 'text', required: false },
    { key: 'deadline_days', label: 'Deadline (days)', type: 'number', required: true },
  ],
  render(values: Record<string, string>): string {
    const recipient = v(values, 'recipient_name');
    const recipientAddr = v(values, 'recipient_address');
    const sender = v(values, 'sender_name');
    const senderAddr = v(values, 'sender_address');
    const subject = v(values, 'subject');
    const facts = v(values, 'facts_description');
    const clause = v(values, 'clause_or_amount');
    const deadline = v(values, 'deadline_days');

    const clauseMention =
      clause !== NOT_PROVIDED
        ? `That the said liability arises out of a legally enforceable debt/liability, and reference is drawn to ${clause}.\n`
        : '';

    return [
      'LEGAL NOTICE',
      'BY REGISTERED POST / COURIER / EMAIL',
      '',
      'To,',
      recipient,
      recipientAddr,
      '',
      'Through their Advocate',
      '',
      `Subject: ${subject}`,
      '',
      'Dear Sir/Madam,',
      '',
      'We act for and on behalf of our client, the sender, namely',
      `${sender}, of ${senderAddr} (hereinafter referred to as "the Sender"). This notice is issued under instructions and authority of the Sender.`,
      '',
      clause !== NOT_PROVIDED ? 'Under Section 138 of the Negotiable Instruments Act, 1881' : '',
      '',
      'FACTS AND NARRATION',
      facts,
      '',
      clauseMention,
      'DEMAND',
      `You are hereby called upon to pay the sum of ` +
        `${clause} together with interest, costs and damages, within a period of ${deadline} days from the date of receipt of this notice. ` +
        'The Sender reserves all rights to claim interest and costs.',
      '',
      'WARNING',
      `Please take notice that if you fail to comply with the demands made herein within the aforesaid period of ${deadline} days, ` +
        'the Sender shall be constrained to initiate appropriate civil and/or criminal proceedings against you, ' +
        'including proceedings under Section 138 of the Negotiable Instruments Act, 1881, at your entire risk as to cost and consequences.',
      '',
      'Nothing in this notice shall be construed as a waiver of any right or remedy available to the Sender under law.',
      '',
      'Yours faithfully,',
      signatureBlock('Advocate for the Sender', 'Advocate, High Court'),
      '',
      `S/D: ${sender}`,
      senderAddr,
    ].join('\n');
  },
};

/** Rent agreement template — simple leave-and-license / rent agreement. */
const RENT_AGREEMENT: DocumentTemplate = {
  key: 'rent_agreement',
  label: 'Rent / Leave-and-License Agreement',
  description: 'Standard simple Indian leave-and-license rent agreement with common clauses.',
  fields: [
    { key: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
    { key: 'tenant_name', label: 'Tenant Name', type: 'text', required: true },
    { key: 'property_address', label: 'Property Address', type: 'textarea', required: true },
    { key: 'rent_amount', label: 'Monthly Rent (Rs)', type: 'number', required: true },
    { key: 'security_deposit', label: 'Security Deposit (Rs)', type: 'number', required: false },
    { key: 'starting_date', label: 'Commencement Date', type: 'date', required: true },
    { key: 'duration_months', label: 'Duration (months)', type: 'number', required: true },
    { key: 'notice_period_days', label: 'Notice Period (days)', type: 'number', required: false },
    { key: 'landlord_contact', label: 'Landlord Contact', type: 'text', required: false },
    { key: 'tenant_contact', label: 'Tenant Contact', type: 'text', required: false },
  ],
  render(values: Record<string, string>): string {
    const landlord = v(values, 'landlord_name');
    const tenant = v(values, 'tenant_name');
    const premises = v(values, 'property_address');
    const rent = v(values, 'rent_amount');
    const deposit = v(values, 'security_deposit');
    const start = v(values, 'starting_date');
    const months = v(values, 'duration_months');
    const notice = v(values, 'notice_period_days');
    const landContact = v(values, 'landlord_contact');
    const tenContact = v(values, 'tenant_contact');

    return [
      'RENT / LEAVE-AND-LICENSE AGREEMENT',
      'AGREEMENT made this day between the parties described below.',
      '',
      '1. PARTIES',
      `This Agreement is made between ${landlord} (hereinafter referred to as the "Landlord") of the first part, ` +
        `and ${tenant} (hereinafter referred to as the "Tenant") of the second part. ` +
        `Both parties are hereinafter referred to as the "Parties" and individually as a "Party".`,
      '',
      '2. PREMISES',
      `The Landlord agrees to let out and the Tenant agrees to take on leave-and-license basis the premises situated at ` +
        `${premises}, on the terms and conditions herein contained.`,
      '',
      '3. TERM',
      `The leave-and-license shall commence from ${start} and shall be valid for a period of ${months} months, ` +
        'subject to renewal by mutual consent of the Parties.',
      '',
      '4. RENT',
      `The monthly rent payable by the Tenant to the Landlord shall be Rs. ${rent} per month, payable in advance on or before the ` +
        '10th day of each calendar month. Any delay may attract such late payment charges as may be mutually agreed.',
      '',
      '5. SECURITY DEPOSIT',
      deposit !== NOT_PROVIDED
        ? `The Tenant shall pay a refundable security deposit of Rs. ${deposit} towards damages/maintenance, ` +
          'to be refunded, without interest, upon vacating the premises and leaving it in good condition, subject to deductions for damages.'
        : 'A refundable security deposit shall be paid and adjusted as mutually agreed between the Parties.',
      '',
      '6. MAINTENANCE AND UTILITIES',
      'The Tenant shall maintain the premises in good habitable condition and shall be responsible for internal repairs and utility payments, ' +
        'unless otherwise agreed. The Landlord shall be responsible for major/structural repairs.',
      '',
      '7. TERMINATION AND NOTICE',
      `Either Party may terminate this Agreement by giving ${notice} days written notice to the other Party. ` +
        'Upon termination, the Tenant shall hand over vacant and peaceful possession of the premises.',
      '',
      '8. JURISDICTION',
      'Any dispute arising out of this Agreement shall be subject to the exclusive jurisdiction of the courts at the place where the premises are situated.',
      '',
      'IN WITNESS WHEREOF the Parties have executed this Agreement.',
      '',
      signatureBlock(landlord, 'Landlord'),
      `Contact: ${landContact}`,
      '',
      signatureBlock(tenant, 'Tenant'),
      `Contact: ${tenContact}`,
    ].join('\n');
  },
};

/** Consumer complaint template — Consumer Protection Act, 2019. */
const CONSUMER_COMPLAINT: DocumentTemplate = {
  key: 'consumer_complaint',
  label: 'Consumer Complaint',
  description:
    'Complaint under the Consumer Protection Act, 2019 before the District / State / National Commission.',
  fields: [
    { key: 'complainant_name', label: 'Complainant Name', type: 'text', required: true },
    { key: 'complainant_address', label: 'Complainant Address', type: 'textarea', required: true },
    { key: 'opposite_party', label: 'Opposite Party Name', type: 'text', required: true },
    { key: 'opposite_party_address', label: 'Opposite Party Address', type: 'textarea', required: true },
    { key: 'product_or_service', label: 'Product / Service', type: 'text', required: true },
    { key: 'purchase_date', label: 'Date of Purchase', type: 'date', required: true },
    { key: 'price_amount', label: 'Price Paid (Rs)', type: 'number', required: true },
    { key: 'deficiency_description', label: 'Deficiency in Service / Defect', type: 'textarea', required: true },
    { key: 'relief_requested', label: 'Relief Requested', type: 'textarea', required: true },
  ],
  render(values: Record<string, string>): string {
    const complainant = v(values, 'complainant_name');
    const compAddr = v(values, 'complainant_address');
    const opp = v(values, 'opposite_party');
    const oppAddr = v(values, 'opposite_party_address');
    const product = v(values, 'product_or_service');
    const date = v(values, 'purchase_date');
    const price = v(values, 'price_amount');
    const deficiency = v(values, 'deficiency_description');
    const relief = v(values, 'relief_requested');

    return [
      'BEFORE THE HONOURABLE DISTRICT / STATE / NATIONAL CONSUMER DISPUTES REDRESSAL COMMISSION',
      'CONSUMER COMPLAINT NO. ____ OF 20____',
      'UNDER THE CONSUMER PROTECTION ACT, 2019',
      '',
      'BETWEEN:',
      `${complainant}, residing at ${compAddr} ... COMPLAINANT`,
      '',
      'AND',
      '',
      `${opp}, of ${oppAddr} ... OPPOSITE PARTY`,
      '',
      'MOST RESPECTFULLY SHOWETH:',
      '1. The Complainant is a "consumer" within the meaning of Section 2(7) of the Consumer Protection Act, 2019.',
      `2. The Opposite Party is engaged in the business/sale/service of ${product}, and is a "service provider"/"trader" ` +
        'within the meaning of the Act.',
      `3. The Complainant availed/purchased ${product} from the Opposite Party on ${date} by paying Rs. ${price} as consideration.`,
      `4. The Complainant states that there is a defect in the goods / deficiency in service, namely: ${deficiency}.`,
      '5. Despite due notice and repeated requests, the Opposite Party has failed to redress the grievance of the Complainant, ' +
        'constituting a deficiency in service / unfair trade practice within the meaning of the Act.',
      '6. No other proceedings in respect of the same cause of action are pending before any court or commission.',
      '',
      'PRAYER',
      `In view of the facts set out above, the Complainant most humbly prays that this Honourable Commission be pleased to order: ${relief}`,
      'and pass such other and further orders as this Honourable Commission may deem fit, and award costs of the proceedings.',
      '',
      'Place: ____',
      'Date: ____',
      '',
      signatureBlock(complainant, 'Complainant'),
      'Through Counsel',
    ].join('\n');
  },
};

/** RTI application template — Right to Information Act, 2005. */
const RTI_APPLICATION: DocumentTemplate = {
  key: 'rti_application',
  label: 'RTI Application',
  description:
    'Application under the Right to Information Act, 2005 seeking information from a public authority.',
  fields: [
    { key: 'applicant_name', label: 'Applicant Name', type: 'text', required: true },
    { key: 'applicant_address', label: 'Applicant Address', type: 'textarea', required: true },
    { key: 'information_sought', label: 'Information Sought', type: 'textarea', required: true },
    { key: 'relevant_department', label: 'Relevant Department / Authority', type: 'text', required: true },
  ],
  render(values: Record<string, string>): string {
    const applicant = v(values, 'applicant_name');
    const address = v(values, 'applicant_address');
    const info = v(values, 'information_sought');
    const department = v(values, 'relevant_department');

    return [
      'APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005',
      'TO, THE PUBLIC INFORMATION OFFICER (PIO)',
      department,
      '',
      `From: ${applicant}`,
      address,
      '',
      'Subject: Application seeking information under the Right to Information Act, 2005.',
      '',
      'Dear Sir/Madam,',
      '',
      'I, the undersigned, hereby request you, in terms of Section 6 of the Right to Information Act, 2005, ' +
        'to provide me the following information under your control:',
      '',
      info,
      '',
      'FEE',
      'I am enclosing the prescribed application fee of Rs. 10 in the form of a Demand Draft / Indian Postal Order / cash, ' +
        'as applicable. Further fees, if any, may be intimated to me for remittance.',
      '',
      'I am a citizen of India. If the information sought is exempt under the Act or cannot be provided, ' +
        'kindly inform me in writing as required under law, along with the details of the First Appellate Authority.',
      '',
      'Thanking you,',
      '',
      signatureBlock(applicant, 'Applicant'),
      'Place: ____',
      'Date: ____',
    ].join('\n');
  },
};

/** Termination notice template — Indian labour law principles. */
const TERMINATION_NOTICE: DocumentTemplate = {
  key: 'termination_notice',
  label: 'Employment Termination Notice',
  description:
    'Notice of termination of employment consistent with Indian labour law principles.',
  fields: [
    { key: 'employee_name', label: 'Employee Name', type: 'text', required: true },
    { key: 'employer_name', label: 'Employer Name', type: 'text', required: true },
    { key: 'last_working_day', label: 'Last Working Day', type: 'date', required: true },
    { key: 'reason_for_termination', label: 'Reason for Termination', type: 'textarea', required: false },
    { key: 'notice_period_days', label: 'Notice Period (days)', type: 'number', required: false },
    { key: 'severance_amount', label: 'Severance / Settlement Amount (Rs)', type: 'number', required: false },
  ],
  render(values: Record<string, string>): string {
    const employee = v(values, 'employee_name');
    const employer = v(values, 'employer_name');
    const lastDay = v(values, 'last_working_day');
    const reason = v(values, 'reason_for_termination');
    const period = v(values, 'notice_period_days');
    const severance = v(values, 'severance_amount');

    const reasonClause =
      reason !== NOT_PROVIDED
        ? `\nREASON FOR TERMINATION\n${reason}\n`
        : '';

    const severanceClause =
      severance !== NOT_PROVIDED
        ? `\nThe Employer shall pay you a full and final settlement of Rs. ${severance} towards severance / dues, ` +
          'subject to statutory deductions and verification of records, within the time prescribed by law.\n'
        : '\nAny amounts due to you towards salary, leave encashment and statutory dues shall be disbursed as per law.\n';

    return [
      'NOTICE OF TERMINATION OF EMPLOYMENT',
      '',
      `Date: ____`,
      '',
      'To,',
      employee,
      'Employee,',
      '',
      `Subject: Termination of employment with ${employer}`,
      '',
      'Dear Sir/Madam,',
      '',
      `Please take notice that your employment with ${employer} shall stand terminated with effect from ${lastDay} ` +
        `${period !== NOT_PROVIDED ? `consequent to the notice period of ${period} days ` : '(as per the terms of your employment) '}` +
        'being complied with / dispensed with as per applicable law and the terms of your employment.',
      reasonClause,
      'Full and final settlement shall be computed strictly in accordance with the applicable law, the terms of employment, ' +
        'and the standing orders / rules of the organisation.',
      severanceClause,
      'Please surrender all assets, documents, keys and materials belonging to the Employer and complete the exit formalities ' +
        'on or before your last working day. Non-compete and confidentiality obligations, where applicable, shall survive termination.',
      '',
      'This termination is issued in compliance with the Industrial Disputes Act, 1947 and other applicable labour laws, ' +
        'as applicable to your category of employment.',
      '',
      'We wish you all the best in your future endeavours.',
      '',
      'Yours faithfully,',
      '',
      signatureBlock(employer, 'Authorised Signatory'),
      'Place: ____',
    ].join('\n');
  },
};

/** All available document templates, keyed by DocumentTemplateKey. */
export const DOCUMENT_TEMPLATES: Record<DocumentTemplateKey, DocumentTemplate> = {
  legal_notice: LEGAL_NOTICE,
  rent_agreement: RENT_AGREEMENT,
  consumer_complaint: CONSUMER_COMPLAINT,
  rti_application: RTI_APPLICATION,
  termination_notice: TERMINATION_NOTICE,
};

/**
 * Renders a document for the given template key.
 * @throws Error if the template key is unknown.
 */
export function renderDocument(key: DocumentTemplateKey, values: Record<string, string>): string {
  const template = DOCUMENT_TEMPLATES[key];
  if (!template) {
    throw new Error(`Unknown document template key: ${key}`);
  }
  return template.render(values);
}