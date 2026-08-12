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

export interface SeedLawyerData {
  email: string;
  full_name: string;
  phone: string;
  city: string;
  state: string;
  preferred_language: 'hindi' | 'english' | 'hinglish';
  specialty: string[];
  years_experience: number;
  bar_council_number: string;
  bio: string;
  consultation_fee_range: string;
  rating_avg: number;
  total_cases_handled: number;
  profile_photo_url: string;
}

export const SAMPLE_LAWYERS: SeedLawyerData[] = [
  {
    email: 'adv.rajesh.sharma@merawakeel.ai',
    full_name: 'Adv. Rajesh Sharma',
    phone: '9876543210',
    city: 'Delhi',
    state: 'Delhi',
    preferred_language: 'hindi',
    specialty: ['Property Law', 'Land Acquisition', 'Civil Disputes'],
    years_experience: 16,
    bar_council_number: 'D/1482/2008',
    bio: 'Senior Civil Advocate practicing at Delhi High Court and District Courts. Specializes in land title verification, illegal possession, and partition suits with 15+ years of litigation experience.',
    consultation_fee_range: '₹2000-4000',
    rating_avg: 4.9,
    total_cases_handled: 185,
    profile_photo_url: 'https://i.pravatar.cc/150?img=11',
  },
  {
    email: 'adv.priya.deshmukh@merawakeel.ai',
    full_name: 'Adv. Priya Deshmukh',
    phone: '9812345678',
    city: 'Mumbai',
    state: 'Maharashtra',
    preferred_language: 'english',
    specialty: ['Tenant Disputes', 'RERA Law', 'Property Registration'],
    years_experience: 12,
    bar_council_number: 'MAH/5621/2012',
    bio: 'High Court Advocate dealing with Mumbai flat agreements, redevelopment disputes, and RERA compensation claims. Trusted legal counselor for cooperative housing societies.',
    consultation_fee_range: '₹2500-5000',
    rating_avg: 4.8,
    total_cases_handled: 140,
    profile_photo_url: 'https://i.pravatar.cc/150?img=47',
  },
  {
    email: 'adv.amit.verma@merawakeel.ai',
    full_name: 'Adv. Amit Verma',
    phone: '9765432109',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    preferred_language: 'hindi',
    specialty: ['Criminal Defense', 'NI Act Cheque Bounce', 'FIR Cancellation'],
    years_experience: 14,
    bar_council_number: 'UP/3940/2010',
    bio: 'Criminal law specialist at Allahabad High Court Lucknow Bench. Successfully defended clients in Section 138 NI Act cheque bounce matters, Section 420 IPC, and anticipatory bail petitions.',
    consultation_fee_range: '₹1500-3000',
    rating_avg: 4.7,
    total_cases_handled: 160,
    profile_photo_url: 'https://i.pravatar.cc/150?img=33',
  },
  {
    email: 'adv.sanjay.gupta@merawakeel.ai',
    full_name: 'Adv. Sanjay Gupta',
    phone: '9845012345',
    city: 'Bengaluru',
    state: 'Karnataka',
    preferred_language: 'english',
    specialty: ['Labour & Employment', 'Corporate Contracts', 'Consumer Forum'],
    years_experience: 10,
    bar_council_number: 'KAR/2819/2014',
    bio: 'Corporate legal counsel advocating for tech employees and consumers. Expert in illegal termination, retrenchment gratuity, and deficiency of service claims in Consumer Courts.',
    consultation_fee_range: '₹2000-3500',
    rating_avg: 5.0,
    total_cases_handled: 110,
    profile_photo_url: 'https://i.pravatar.cc/150?img=60',
  },
  {
    email: 'adv.meenakshi.sundaram@merawakeel.ai',
    full_name: 'Adv. Meenakshi Sundaram',
    phone: '9444123456',
    city: 'Chennai',
    state: 'Tamil Nadu',
    preferred_language: 'english',
    specialty: ['Family Law', 'Mutual Consent Divorce', 'Child Custody'],
    years_experience: 18,
    bar_council_number: 'TN/1092/2006',
    bio: 'Family court legal expert specializing in Hindu Marriage Act disputes, PWDVA domestic violence protection orders, and permanent alimony negotiations with complete empathy.',
    consultation_fee_range: '₹2500-4500',
    rating_avg: 4.9,
    total_cases_handled: 210,
    profile_photo_url: 'https://i.pravatar.cc/150?img=45',
  },
  {
    email: 'adv.vikram.rathore@merawakeel.ai',
    full_name: 'Adv. Vikram Singh Rathore',
    phone: '9928012345',
    city: 'Jaipur',
    state: 'Rajasthan',
    preferred_language: 'hindi',
    specialty: ['Property Law', 'Ancestral Inheritance', 'Revenue Matters'],
    years_experience: 15,
    bar_council_number: 'RAJ/4481/2009',
    bio: 'Experienced revenue advocate for agricultural land titles, mutation certificates, and coparcenary rights under Hindu Succession Act in Rajasthan courts.',
    consultation_fee_range: '₹1500-2800',
    rating_avg: 4.8,
    total_cases_handled: 175,
    profile_photo_url: 'https://i.pravatar.cc/150?img=12',
  },
  {
    email: 'adv.ananya.roy@merawakeel.ai',
    full_name: 'Adv. Ananya Roy',
    phone: '9830012345',
    city: 'Kolkata',
    state: 'West Bengal',
    preferred_language: 'english',
    specialty: ['Consumer Protection', 'Insurance Claims', 'Medical Negligence'],
    years_experience: 9,
    bar_council_number: 'WB/1928/2015',
    bio: 'Pioneer advocate in consumer rights litigation and insurance claim repudiations. Fighting for consumer compensation in District and National Commissions.',
    consultation_fee_range: '₹1800-3200',
    rating_avg: 4.7,
    total_cases_handled: 95,
    profile_photo_url: 'https://i.pravatar.cc/150?img=26',
  },
  {
    email: 'adv.rahul.kulkarni@merawakeel.ai',
    full_name: 'Adv. Rahul Kulkarni',
    phone: '9822012345',
    city: 'Pune',
    state: 'Maharashtra',
    preferred_language: 'hinglish',
    specialty: ['Tenant Disputes', 'Lease Agreements', 'Eviction Suits'],
    years_experience: 11,
    bar_council_number: 'MAH/7721/2013',
    bio: 'Specialist in Maharashtra Rent Control Act, commercial tenancy contracts, and tenant eviction suits. Provides pragmatic legal remedies to property owners and tenants.',
    consultation_fee_range: '₹2000-3500',
    rating_avg: 4.9,
    total_cases_handled: 130,
    profile_photo_url: 'https://i.pravatar.cc/150?img=15',
  },
  {
    email: 'adv.sunita.patnaik@merawakeel.ai',
    full_name: 'Adv. Sunita Patnaik',
    phone: '9437012345',
    city: 'Patna',
    state: 'Bihar',
    preferred_language: 'hindi',
    specialty: ['Family Law', 'Domestic Violence', 'Maintenance'],
    years_experience: 13,
    bar_council_number: 'BIH/3310/2011',
    bio: 'Dedicated advocate protecting women rights under PWDVA 2005, Section 125 CrPC maintenance claims, and dowry harassment defense in Bihar judiciary.',
    consultation_fee_range: '₹1200-2500',
    rating_avg: 4.8,
    total_cases_handled: 155,
    profile_photo_url: 'https://i.pravatar.cc/150?img=32',
  },
  {
    email: 'adv.tariq.ahmed@merawakeel.ai',
    full_name: 'Adv. Syed Tariq Ahmed',
    phone: '9849012345',
    city: 'Hyderabad',
    state: 'Telangana',
    preferred_language: 'english',
    specialty: ['Property Law', 'Specific Performance', 'Civil Writs'],
    years_experience: 17,
    bar_council_number: 'TS/902/2007',
    bio: 'Senior practitioner in Telangana High Court. Expert in Specific Relief Act suits, title declaration, injunctions, and commercial real estate litigation.',
    consultation_fee_range: '₹3000-6000',
    rating_avg: 5.0,
    total_cases_handled: 220,
    profile_photo_url: 'https://i.pravatar.cc/150?img=68',
  },
  {
    email: 'adv.harpreet.singh@merawakeel.ai',
    full_name: 'Adv. Harpreet Singh',
    phone: '9814012345',
    city: 'Chandigarh',
    state: 'Punjab',
    preferred_language: 'hinglish',
    specialty: ['Cheque Bounce (NI Act)', 'Criminal Law', 'Bail Writs'],
    years_experience: 8,
    bar_council_number: 'PH/5102/2016',
    bio: 'High Court Advocate at Punjab & Haryana High Court. Fast-track recovery under Section 138 NI Act, anticipatory bails, and criminal trial litigation.',
    consultation_fee_range: '₹1500-3000',
    rating_avg: 4.6,
    total_cases_handled: 88,
    profile_photo_url: 'https://i.pravatar.cc/150?img=52',
  },
  {
    email: 'adv.kavita.trivedi@merawakeel.ai',
    full_name: 'Adv. Kavita Trivedi',
    phone: '9898012345',
    city: 'Ahmedabad',
    state: 'Gujarat',
    preferred_language: 'hindi',
    specialty: ['Labour & Employment', 'RERA Law', 'Consumer Protection'],
    years_experience: 14,
    bar_council_number: 'GUJ/4019/2010',
    bio: 'Respected legal consultant in Industrial Tribunals and Gujarat RERA Authority. Assisting home buyers in delayed possession penalty enforcement and retrenched workers.',
    consultation_fee_range: '₹2000-4000',
    rating_avg: 4.9,
    total_cases_handled: 170,
    profile_photo_url: 'https://i.pravatar.cc/150?img=20',
  },
];

async function seedLawyers() {
  console.log(`Starting Lawyer Directory seeding: ${SAMPLE_LAWYERS.length} advocate profiles...`);

  // Fetch all existing auth users
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const userMap = new Map<string, string>();
  if (usersData?.users) {
    usersData.users.forEach((u) => {
      if (u.email) userMap.set(u.email.toLowerCase(), u.id);
    });
  }

  let count = 0;
  for (const lawyer of SAMPLE_LAWYERS) {
    const cleanEmail = lawyer.email.toLowerCase();
    let userId = userMap.get(cleanEmail);

    if (!userId) {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: 'LawyerPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: lawyer.full_name,
          user_type: 'lawyer',
        },
      });
      if (userData?.user?.id) {
        userId = userData.user.id;
        userMap.set(cleanEmail, userId);
      } else {
        console.warn(`Could not create auth user for ${cleanEmail}: ${userError?.message}`);
        continue;
      }
    }

    // 2. Upsert into profiles
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        full_name: lawyer.full_name,
        user_type: 'lawyer',
        phone: lawyer.phone,
        city: lawyer.city,
        state: lawyer.state,
        preferred_language: lawyer.preferred_language,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      console.warn(`Profile upsert error for ${lawyer.full_name}: ${profileError.message}`);
      continue;
    }

    // 3. Insert or update lawyers record
    const { data: existingLawyer } = await supabase.from('lawyers').select('id').eq('profile_id', userId).maybeSingle();

    const lawyerPayload = {
      profile_id: userId,
      specialty: lawyer.specialty,
      years_experience: lawyer.years_experience,
      bar_council_number: lawyer.bar_council_number,
      is_verified: true,
      bio: lawyer.bio,
      consultation_fee_range: lawyer.consultation_fee_range,
      rating_avg: lawyer.rating_avg,
      total_cases_handled: lawyer.total_cases_handled,
      available: true,
      profile_photo_url: lawyer.profile_photo_url,
      updated_at: new Date().toISOString(),
    };

    let lawyerError = null;
    if (existingLawyer) {
      const { error } = await supabase.from('lawyers').update(lawyerPayload).eq('id', existingLawyer.id);
      lawyerError = error;
    } else {
      const { error } = await supabase.from('lawyers').insert({ id: crypto.randomUUID(), ...lawyerPayload });
      lawyerError = error;
    }

    if (lawyerError) {
      console.warn(`Lawyer upsert error for ${lawyer.full_name}: ${lawyerError.message}`);
    } else {
      count++;
      console.log(`[${count}/${SAMPLE_LAWYERS.length}] Seeded Advocate: ${lawyer.full_name} (${lawyer.city})`);
    }
  }

  console.log(`Successfully completed lawyer seeding: ${count} lawyers created/updated!`);
}

seedLawyers().catch((err) => {
  console.error('Lawyer seeding failed:', err);
  process.exit(1);
});
