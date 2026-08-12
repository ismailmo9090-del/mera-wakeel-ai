import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Role Key in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Feature-hashing vector generator matching server.ts (1536 dimensions for vector(1536))
function generateVectorEmbedding(text: string): number[] {
  const dim = 1536;
  if (!text || !text.trim()) return new Array(dim).fill(0);

  const vec = new Array(dim).fill(0);
  const clean = text.toLowerCase().trim();
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

  let sumSq = 0;
  for (let i = 0; i < dim; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => v / norm);
}

export interface LawSection {
  act_name: string;
  section_number: string;
  category: 'property' | 'tenant' | 'family' | 'consumer' | 'labour' | 'other';
  content: string;
}

export const LAW_SECTIONS: LawSection[] = [
  // Transfer of Property Act, 1882
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 54',
    category: 'property',
    content: 'Sale defined.—"Sale" is a transfer of ownership in exchange for a price paid or promised or part-paid and part-promised. Such transfer, in the case of tangible immovable property of the value of one hundred rupees and upwards, or in the case of a reversion or other intangible thing, can be made only by a registered instrument. Sale of tangible immovable property of value less than one hundred rupees may be made either by a registered instrument or by delivery of the property.',
  },
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 105',
    category: 'tenant',
    content: 'Lease defined.—A lease of immovable property is a transfer of a right to enjoy such property, made for a certain time, express or implied, or in perpetuity, in consideration of a price paid or promised, or of money, a share of crops, service or any other thing of value, to be rendered periodically or on specified occasions to the transferor by the transferee, who accepts the transfer on such terms.',
  },
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 106',
    category: 'tenant',
    content: 'Duration of certain leases in absence of written contract or local usage.—In the absence of a contract or local law or usage to the contrary, a lease of immovable property for agricultural or manufacturing purposes shall be deemed to be a lease from year to year, terminable, on the part of either lessor or lessee, by six months notice; and a lease of immovable property for any other purpose shall be deemed to be a lease from month to month, terminable, on the part of either lessor or lessee, by fifteen days notice.',
  },
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 107',
    category: 'tenant',
    content: 'Leases how made.—A lease of immovable property from year to year, or for any term exceeding one year, or reserving a yearly rent, can be made only by a registered instrument. All other leases of immovable property may be made either by a registered instrument or by oral agreement accompanied by delivery of possession.',
  },
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 108',
    category: 'tenant',
    content: 'Rights and liabilities of lessor and lessee.—Lessor is bound to disclose to lessee any material defect in the property; to put lessee in possession; and lessee shall enjoy quiet possession without interruption. Lessee is bound to pay rent at proper time, to keep property in good condition, to restore possession upon determination, and not to make permanent structures without lessor consent.',
  },
  {
    act_name: 'Transfer of Property Act, 1882',
    section_number: 'Section 111',
    category: 'tenant',
    content: 'Determination of lease.—A lease of immovable property determines: (a) by lapse of time limited thereby; (b) where such time is limited conditionally on happening of event; (c) by surrender or forfeiture; (d) by notice to quit or notice of intention to quit, duly given by one party to the other.',
  },

  // Hindu Succession Act, 1956
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 6',
    category: 'property',
    content: 'Devolution of interest in coparcenary property.—In a Joint Hindu family governed by Mitakshara law, the daughter of a coparcener shall by birth become a coparcener in her own right in the same manner as the son, having the same rights and liabilities in respect of the coparcenary property as she would have had if she had been a son.',
  },
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 8',
    category: 'property',
    content: 'General rules of succession in the case of males.—The property of a male Hindu dying intestate shall devolve: firstly, upon Class I heirs (mother, widow, son, daughter, children of predeceased son/daughter); secondly, if no Class I heir, upon Class II heirs; thirdly, upon agnates; and lastly, upon cognates.',
  },
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 14',
    category: 'property',
    content: 'Property of a female Hindu to be her absolute property.—Any property possessed by a female Hindu, whether acquired before or after the commencement of this Act, shall be held by her as full owner thereof and not as a limited owner. This includes property acquired by inheritance, gift, partition, maintenance, or purchase.',
  },
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 15',
    category: 'property',
    content: 'General rules of succession in the case of female Hindus.—The property of a female Hindu dying intestate shall devolve: firstly, upon sons, daughters, and husband; secondly, upon heirs of husband; thirdly, upon mother and father; fourthly, upon heirs of father; and lastly, upon heirs of mother.',
  },
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 22',
    category: 'property',
    content: 'Preferential right to acquire property in certain cases.—Where an interest in immovable property or business devolves upon two or more heirs specified in Class I of the Schedule, and any one of such heirs proposes to transfer his or her interest, the other heirs shall have a preferential right to acquire the interest proposed to be transferred.',
  },
  {
    act_name: 'Hindu Succession Act, 1956',
    section_number: 'Section 30',
    category: 'property',
    content: 'Testamentary succession.—Any Hindu may dispose of by will or other testamentary disposition any property, which is capable of being so disposed of by him or her, in accordance with the provisions of the Indian Succession Act, 1925, or any other law for the time being in force.',
  },

  // Registration Act, 1908
  {
    act_name: 'Registration Act, 1908',
    section_number: 'Section 17',
    category: 'property',
    content: 'Documents of which registration is compulsory.—Instruments of gift of immovable property; non-testamentary instruments which purport or operate to create, declare, assign, limit or extinguish any right, title or interest of value of Rs 100 or upwards in immovable property; and leases of immovable property from year to year or exceeding one year MUST be registered.',
  },
  {
    act_name: 'Registration Act, 1908',
    section_number: 'Section 49',
    category: 'property',
    content: 'Effect of non-registration of documents required to be registered.—No document required by section 17 or by any provision of the Transfer of Property Act to be registered shall affect any immovable property comprised therein, or be received as evidence of any transaction affecting such property, unless it has been registered.',
  },

  // Consumer Protection Act, 2019
  {
    act_name: 'Consumer Protection Act, 2019',
    section_number: 'Section 2(7)',
    category: 'consumer',
    content: 'Definition of Consumer.—"Consumer" means any person who buys any goods or hires/avails any services for consideration which has been paid or promised or partly paid. It includes offline and online e-commerce transactions, but excludes a person who obtains goods for resale or for commercial purpose.',
  },
  {
    act_name: 'Consumer Protection Act, 2019',
    section_number: 'Section 35',
    category: 'consumer',
    content: 'Manner in which complaint shall be made.—A complaint in relation to any goods sold or delivered or service provided may be filed before District Commission by the consumer, any recognized consumer association, or central authority.',
  },
  {
    act_name: 'Consumer Protection Act, 2019',
    section_number: 'Section 37',
    category: 'consumer',
    content: 'Reference to Mediation.—At the first hearing of complaint or at any time, if it appears to District Commission that there exist elements of a settlement, it may refer the dispute to mediation with consent of parties.',
  },
  {
    act_name: 'Consumer Protection Act, 2019',
    section_number: 'Section 47',
    category: 'consumer',
    content: 'Jurisdiction of State Commission.—State Consumer Disputes Redressal Commission has jurisdiction to entertain complaints where the value of goods or services paid as consideration exceeds Rs 1 crore but does not exceed Rs 10 crore.',
  },
  {
    act_name: 'Consumer Protection Act, 2019',
    section_number: 'Section 69',
    category: 'consumer',
    content: 'Limitation period.—The District Commission, State Commission or National Commission shall not admit a complaint unless it is filed within two years from the date on which the cause of action has arisen.',
  },

  // RERA, 2016
  {
    act_name: 'Real Estate (Regulation and Development) Act, 2016',
    section_number: 'Section 3',
    category: 'property',
    content: 'Prior registration of real estate project with Real Estate Regulatory Authority.—No promoter shall advertise, market, book, sell or offer for sale any plot, apartment or building in any real estate project without registering the project with RERA. Exemption applies if land area does not exceed 500 sq meters or number of apartments does not exceed 8.',
  },
  {
    act_name: 'Real Estate (Regulation and Development) Act, 2016',
    section_number: 'Section 18',
    category: 'property',
    content: 'Return of amount and compensation.—If promoter fails to complete or give possession of apartment/building in accordance with agreement for sale, promoter shall be liable to return the amount received with interest at prescribed rate and compensation if buyer wishes to withdraw from project.',
  },
  {
    act_name: 'Real Estate (Regulation and Development) Act, 2016',
    section_number: 'Section 31',
    category: 'property',
    content: 'Filing of complaints to Authority or Adjudicating Officer.—Any aggrieved person may file a complaint with RERA authority or adjudicating officer for any violation or contravention of the provisions of RERA by promoter, allottee, or real estate agent.',
  },

  // Negotiable Instruments Act, 1881
  {
    act_name: 'Negotiable Instruments Act, 1881',
    section_number: 'Section 138',
    category: 'other',
    content: 'Dishonour of cheque for insufficiency, etc., of funds in the account.—Where any cheque drawn by a person on an account maintained by him for payment of money is returned unpaid due to insufficient funds or exceeding arrangement, such person shall be deemed to have committed an offence punishable with imprisonment up to 2 years or fine up to twice cheque amount. Statutory legal notice must be issued within 30 days of dishonour demand.',
  },
  {
    act_name: 'Negotiable Instruments Act, 1881',
    section_number: 'Section 139',
    category: 'other',
    content: 'Presumption in favour of holder.—It shall be presumed, unless the contrary is proved, that the holder of a cheque received the cheque of the nature referred to in section 138 for the discharge, in whole or in part, of any debt or other liability.',
  },
  {
    act_name: 'Negotiable Instruments Act, 1881',
    section_number: 'Section 141',
    category: 'other',
    content: 'Offences by companies under NI Act.—If the person committing an offence under section 138 is a company, every person who at the time the offence was committed was in charge of, and was responsible to the company for the conduct of business, as well as company, shall be deemed guilty.',
  },
  {
    act_name: 'Negotiable Instruments Act, 1881',
    section_number: 'Section 142',
    category: 'other',
    content: 'Cognizance of offences.—No court shall take cognizance of any offence under section 138 except upon a complaint in writing made by payee or holder within one month of the cause of action arising after expiration of 15 days of statutory notice.',
  },

  // Hindu Marriage Act, 1955
  {
    act_name: 'Hindu Marriage Act, 1955',
    section_number: 'Section 5',
    category: 'family',
    content: 'Conditions for a Hindu Marriage.—A marriage may be solemnized between any two Hindus if neither party has a spouse living; neither is incapable of giving valid consent due to unsoundness of mind; groom has completed 21 years and bride 18 years; and parties are not within prohibited degrees of relationship.',
  },
  {
    act_name: 'Hindu Marriage Act, 1955',
    section_number: 'Section 9',
    category: 'family',
    content: 'Restitution of conjugal rights.—When either husband or wife has, without reasonable excuse, withdrawn from the society of the other, aggrieved party may apply by petition to district court for restitution of conjugal rights.',
  },
  {
    act_name: 'Hindu Marriage Act, 1955',
    section_number: 'Section 13',
    category: 'family',
    content: 'Divorce grounds.—Any marriage solemnized may be dissolved by decree of divorce on grounds of adultery, cruelty, desertion for not less than 2 years, conversion to another religion, incurable unsoundness of mind, or venereal disease.',
  },
  {
    act_name: 'Hindu Marriage Act, 1955',
    section_number: 'Section 13B',
    category: 'family',
    content: 'Divorce by mutual consent.—Petition for divorce may be presented to district court by both parties together on ground that they have been living separately for a period of one year or more, and have not been able to live together, and have mutually agreed to dissolve marriage.',
  },
  {
    act_name: 'Hindu Marriage Act, 1955',
    section_number: 'Section 24',
    category: 'family',
    content: 'Maintenance pendente lite and expenses of proceedings.—Where in any proceeding under this Act it appears to court that either wife or husband has no independent income sufficient for support and necessary expenses, court may order respondent to pay petitioner monthly maintenance and litigation costs.',
  },
  {
    act_name: 'Hindu Marriage Act, 1955',
    section_number: 'Section 25',
    category: 'family',
    content: 'Permanent alimony and maintenance.—Any court exercising jurisdiction under this Act may at time of passing decree or thereafter order respondent to pay applicant for maintenance and support a gross sum or monthly sum during life of applicant.',
  },

  // Protection of Women from Domestic Violence Act, 2005
  {
    act_name: 'Protection of Women from Domestic Violence Act, 2005',
    section_number: 'Section 3',
    category: 'family',
    content: 'Definition of domestic violence.—Any act, omission, commission or conduct of respondent shall constitute domestic violence if it harms, injures or endangers health, safety, life, limb or well-being (physical, sexual, verbal, emotional, economic abuse) of aggrieved person or causes harassment regarding dowry demands.',
  },
  {
    act_name: 'Protection of Women from Domestic Violence Act, 2005',
    section_number: 'Section 12',
    category: 'family',
    content: 'Application to Magistrate.—An aggrieved person or Protection Officer or any other person on behalf of aggrieved person may present an application to Magistrate seeking one or more reliefs under PWDVA.',
  },
  {
    act_name: 'Protection of Women from Domestic Violence Act, 2005',
    section_number: 'Section 18',
    category: 'family',
    content: 'Protection orders.—Magistrate may pass a protection order prohibiting respondent from committing domestic violence, entering place of employment or residence of aggrieved person, or attempting to communicate with aggrieved person.',
  },
  {
    act_name: 'Protection of Women from Domestic Violence Act, 2005',
    section_number: 'Section 19',
    category: 'family',
    content: 'Residence orders.—Magistrate may pass a residence order directing respondent to remove himself from shared household, restraining respondent from dispossessing aggrieved person, or ordering respondent to secure alternate accommodation for aggrieved person.',
  },

  // IPC / BNS
  {
    act_name: 'Indian Penal Code, 1860',
    section_number: 'Section 420',
    category: 'other',
    content: 'Cheating and dishonestly inducing delivery of property.—Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy whole or part of valuable security, shall be punished with imprisonment up to 7 years and fine.',
  },
  {
    act_name: 'Indian Penal Code, 1860',
    section_number: 'Section 447',
    category: 'property',
    content: 'Punishment for criminal trespass.—Whoever commits criminal trespass by entering into or upon property in possession of another with intent to commit an offence or intimidate/insult shall be punished with imprisonment up to 3 months or fine up to Rs 500.',
  },
  {
    act_name: 'Indian Penal Code, 1860',
    section_number: 'Section 448',
    category: 'property',
    content: 'Punishment for house-trespass.—Whoever commits house-trespass by entering into or remaining in any building, tent or vessel used as human dwelling shall be punished with imprisonment up to 1 year or fine up to Rs 1,000.',
  },
  {
    act_name: 'Indian Penal Code, 1860',
    section_number: 'Section 406',
    category: 'other',
    content: 'Punishment for criminal breach of trust.—Whoever commits criminal breach of trust in respect of property entrusted to him shall be punished with imprisonment up to 3 years, or fine, or both.',
  },
  {
    act_name: 'Indian Penal Code, 1860',
    section_number: 'Section 498A',
    category: 'family',
    content: 'Husband or relative of husband subjecting woman to cruelty.—Whoever, being husband or relative of husband of a woman, subjects such woman to cruelty (physical/mental harassment for dowry) shall be punished with imprisonment up to 3 years and fine. Non-bailable offence.',
  },
  {
    act_name: 'Indian Penal Code, 1860',
    section_number: 'Section 506',
    category: 'other',
    content: 'Punishment for criminal intimidation.—Whoever commits offence of criminal intimidation shall be punished with imprisonment up to 2 years, or fine, or both.',
  },

  // CrPC / BNSS
  {
    act_name: 'Code of Criminal Procedure, 1973',
    section_number: 'Section 154',
    category: 'other',
    content: 'Information in cognizable cases (FIR).—Every information relating to commission of a cognizable offence, if given orally to officer in charge of police station, shall be reduced to writing, read over to informant, signed by informant, and copy provided free of cost.',
  },
  {
    act_name: 'Code of Criminal Procedure, 1973',
    section_number: 'Section 156',
    category: 'other',
    content: 'Police officer power to investigate cognizable case.—Any officer in charge of a police station may, without order of Magistrate, investigate any cognizable case. Magistrate empowered under section 190 may order such an investigation (156(3) CrPC).',
  },
  {
    act_name: 'Code of Criminal Procedure, 1973',
    section_number: 'Section 438',
    category: 'other',
    content: 'Direction for grant of bail to person apprehending arrest (Anticipatory Bail).—When any person has reason to believe that he may be arrested on accusation of having committed a non-bailable offence, he may apply to High Court or Court of Session for direction for anticipatory bail.',
  },
  {
    act_name: 'Code of Criminal Procedure, 1973',
    section_number: 'Section 439',
    category: 'other',
    content: 'Special powers of High Court or Court of Session regarding bail.—A High Court or Court of Session may direct that any person accused of an offence and in custody be released on bail, or set aside/modify conditions imposed by Magistrate.',
  },

  // Industrial Disputes Act, 1947 & Gratuity
  {
    act_name: 'Industrial Disputes Act, 1947',
    section_number: 'Section 25F',
    category: 'labour',
    content: 'Conditions precedent to retrenchment of workmen.—No workman employed in any industry who has been in continuous service for not less than one year shall be retrenched by employer until workman has been given one month notice in writing or paid wages in lieu of notice, and paid retrenchment compensation equal to 15 days average pay for every completed year of service.',
  },
  {
    act_name: 'Industrial Disputes Act, 1947',
    section_number: 'Section 25N',
    category: 'labour',
    content: 'Conditions precedent to retrenchment of workmen in industrial establishments with 100+ workers.—Prior permission of appropriate Government is mandatory before retrenching workmen in large industrial establishments.',
  },
  {
    act_name: 'Payment of Gratuity Act, 1972',
    section_number: 'Section 4',
    category: 'labour',
    content: 'Payment of gratuity.—Gratuity shall be payable to an employee on termination of employment after continuous service for not less than 5 years: (a) on superannuation; (b) on retirement/resignation; or (c) on death or disablement. Calculated at 15 days wages for every completed year of service.',
  },

  // Indian Contract Act, 1872
  {
    act_name: 'Indian Contract Act, 1872',
    section_number: 'Section 10',
    category: 'other',
    content: 'What agreements are contracts.—All agreements are contracts if they are made by free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.',
  },
  {
    act_name: 'Indian Contract Act, 1872',
    section_number: 'Section 73',
    category: 'other',
    content: 'Compensation for loss or damage caused by breach of contract.—When a contract has been broken, the party who suffers by such breach is entitled to receive, from party who broke contract, compensation for loss or damage naturally arising in usual course of things from breach.',
  },
  {
    act_name: 'Indian Contract Act, 1872',
    section_number: 'Section 74',
    category: 'other',
    content: 'Compensation for breach of contract where penalty stipulated for.—When a contract has been broken, if a sum is named in contract as amount to be paid in case of breach, party complaining is entitled to receive reasonable compensation not exceeding amount so named.',
  },

  // Specific Relief Act, 1963
  {
    act_name: 'Specific Relief Act, 1963',
    section_number: 'Section 10',
    category: 'property',
    content: 'Specific performance in respect of contracts.—Specific performance of a contract shall be enforced by court subject to provisions of sections 11(2), 14 and 16. Grant of specific performance is mandatory for contracts relating to immovable property.',
  },
  {
    act_name: 'Specific Relief Act, 1963',
    section_number: 'Section 34',
    category: 'property',
    content: 'Discretion of court as to declaration of status or right.—Any person entitled to any legal character, or to any right as to any property, may institute a suit against any person denying or interested to deny his title to such character or right, and court may declare that he is so entitled.',
  },
];

async function seed() {
  console.log(`Starting Legal Knowledge Base seeding: ${LAW_SECTIONS.length} law sections...`);

  let count = 0;
  for (const item of LAW_SECTIONS) {
    const textToEmbed = `${item.act_name} ${item.section_number} ${item.content}`;
    const embedding = generateVectorEmbedding(textToEmbed);

    const record = {
      id: crypto.randomUUID(),
      act_name: item.act_name,
      section_number: item.section_number,
      category: item.category,
      content: item.content,
      embedding: embedding,
    };

    const { data, error } = await supabase.from('legal_knowledge_base').insert(record).select('id').single();

    if (error) {
      console.warn(`Error inserting ${item.act_name} (${item.section_number}): ${error.message}`);
    } else {
      count++;
      console.log(`[${count}/${LAW_SECTIONS.length}] Seeded: ${item.act_name} - ${item.section_number}`);
    }
  }

  console.log(`Successfully completed seeding ${count} legal knowledge base sections!`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
