/**
 * Free government legal aid schemes in India (NALSA / Tele-Law).
 * Browser + Node compatible, pure TypeScript, no project imports.
 */

/** A single free government legal aid scheme in India. */
export interface GovScheme {
	id: string;
	name: string;
	description: string;
	helpline: string;
	website: string;
	eligibility: string[];
	howToApply: string;
}

/** Free government legal aid schemes surfaced alongside paid options. */
export const GOV_SCHEMES: GovScheme[] = [
	{
		id: 'nalsa',
		name: 'NALSA (National Legal Services Authority)',
		description:
			'The National Legal Services Authority provides free legal services to eligible persons under the Legal Services Authorities Act, 1987. It operates through State Legal Services Authorities and District Legal Services Authorities, offering free lawyers, legal advice, and representation.',
		helpline: '15100',
		website: 'https://nalsa.gov.in',
		eligibility: [
			'Members of Scheduled Castes / Scheduled Tribes',
			'Victims of trafficking in human beings or begar (forced labour)',
			'Women and children',
			'Persons with disabilities',
			'Industrial workmen / workers whose wages are below the prescribed limit',
			'Persons in custody (jail/prison), including undertrials',
			'Persons with annual income below the limit prescribed by the concerned State Government (varies by state)',
			'Victims of a mass disaster, ethnic violence, caste atrocity, flood, drought, or riot',
			'Other categories as listed under Section 12 of the Legal Services Authorities Act, 1987',
		],
		howToApply:
			'Visit your nearest District Legal Services Authority (DLSA) or Legal Aid Clinic at a court/campus, or call the NALSA toll-free helpline 15100 to be connected to free legal aid.',
	},
	{
		id: 'tele-law',
		name: 'Tele-Law Programme',
		description:
			'A Government of India scheme (under the Ministry of Law & Justice, in partnership with CSC e-Governance India) that provides free legal advice and consultation through panel lawyers over phone and video calls, accessed via Common Service Centres (CSCs), especially for rural and remote areas.',
		helpline: '15100',
		website: 'https://telelaw.csc.gov.in',
		eligibility: [
			'Any person, including those from weaker and marginalized sections',
			'Rural and remote citizens with limited access to courts or lawyers',
			'Women, Scheduled Castes/Scheduled Tribes, and economically weaker sections are prioritised',
			'No strict income ceiling; intended for those who cannot afford private legal fees',
		],
		howToApply:
			'Visit your nearest Common Service Centre (CSC) and ask for the Tele-Law service, or call the helpline 15100. The Para-Legal Volunteer (PLV) at the CSC will schedule a free consultation with an empanelled lawyer.',
	},
	{
		id: 'csc',
		name: 'Common Service Centres (CSC)',
		description:
			'Common Service Centres are rural e-governance access points run under the CSC e-Governance India scheme. They deliver digital government services such as e-District applications, e-legal advice (Tele-Law), and referral to free legal aid institutions, making justice services accessible in villages.',
		helpline: '15100',
		website: 'https://csc.gov.in',
		eligibility: [
			'Open to all citizens, particularly those in rural and semi-urban areas',
			'Services including Tele-Law and e-District are aimed at economically weaker and disadvantaged citizens',
			'No separate income criterion to use the centre for legal aid referral',
		],
		howToApply:
			'Locate your nearest CSC through the CSC locator on csc.gov.in, walk in, and request Tele-Law (free legal advice) or e-District services. Para-Legal Volunteers at the centre will assist you.',
	},
	{
		id: 'lok-adalat',
		name: 'Lok Adalat (People\u2019s Court)',
		description:
			'Lok Adalats are a free alternative dispute resolution mechanism under the Legal Services Authorities Act, 1987. They are organised by Legal Services Authorities, settle pending and pre-litigation disputes through conciliation and compromise, and awards are final and binding with the force of a civil court decree \u2014 with no court fee and no appeal. Permanent Lok Adalats also handle certain public utility service disputes.',
		helpline: '15100',
		website: 'https://nalsa.gov.in',
		eligibility: [
			'Any party to a pending or pre-litigation civil, family, matrimonial, or petty criminal case',
			'Disputes involving public utility services can go to Permanent Lok Adalats',
			'Open to all citizens; no income criterion required',
		],
		howToApply:
			'Contact the nearest Legal Services Authority or DLSA to have your case referred to a Lok Adalat. These are held regularly at courts and villages; watch local announcements or ask the DLSA for the next sitting.',
	},
];

const ELIGIBILITY_MARKERS: string[] = [
	'no income',
	'below poverty',
	'bpl',
	'bhuka',
	'garib',
	'low income',
	'poor',
	'unemployed',
	'widow',
	'widowed',
	'disabled',
	'dalit',
	'sc/st',
	'scheduled caste',
	'scheduled tribe',
	'worker',
	'labour',
	'wages',
	'minimum wage',
	'per day',
	'earn',
	'earning',
	'earnings',
	'rs ',
	'rupees',
	'income',
	'pension',
	'below poverty line',
	'free legal',
	'can\'t afford',
	'cannot afford',
	'no money',
	'struggling',
];

/**
 * Liberal heuristic: returns true when several eligibility markers appear in the
 * user's text. Favours surfacing free legal aid, so it errs on the side of true.
 */
export function isLikelyEligibleForFreeLegalAid(text: string): boolean {
	const haystack = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
	let matches = 0;
	for (const marker of ELIGIBILITY_MARKERS) {
		if (haystack.includes(marker)) {
			matches++;
		}
	}
	return matches >= 2;
}

/**
 * Builds a prompt fragment instructing the persona to proactively offer free
 * government legal aid alongside paid options. Returns '' when not eligible.
 */
export function buildGovernmentAidContextBlock(text: string): string {
	if (!isLikelyEligibleForFreeLegalAid(text)) {
		return '';
	}
	return [
		'CONTEXT: FREE GOVERNMENT LEGAL AID AVAILABLE',
		'The user shows signs of being eligible for free legal aid in India. Always mention these free options alongside any paid lawyer marketplace options, and never gate free legal aid behind payment or require the user to book a paid lawyer first:',
		'- NALSA (National Legal Services Authority) free legal aid \u2014 call toll-free helpline 15100, or visit the nearest District Legal Services Authority (DLSA) / Legal Aid Clinic. Covers women, children, SC/ST, disabled persons, industrial workers, low-income individuals, and more per Section 12 of the Legal Services Authorities Act, 1987.',
		'- Tele-Law helpline 15100 \u2014 free legal advice by panel lawyers over phone/video via any Common Service Centre (CSC).',
		'- District Legal Services Authority (DLSA) \u2014 visit for free legal aid, free lawyers, and case referral to Lok Adalat.',
		'- Lok Adalat \u2014 free, binding, out-of-court dispute resolution with no court fees.',
		'Always state the 15100 helpline and gently encourage the user to access these free services immediately, while still offering paid lawyer options if the user prefers them.',
	].join('\n');
}
