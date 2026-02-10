// List of countries with their codes and phone codes
export interface Country {
  name: string;
  code: string; // ISO country code (e.g., 'US', 'PK', 'IN')
  phoneCode: string; // Phone country code (e.g., '+1', '+92', '+91')
}

export const COUNTRIES: Country[] = [
  { name: 'United States', code: 'US', phoneCode: '+1' },
  { name: 'United Kingdom', code: 'GB', phoneCode: '+44' },
  { name: 'Canada', code: 'CA', phoneCode: '+1' },
  { name: 'Australia', code: 'AU', phoneCode: '+61' },
  { name: 'Germany', code: 'DE', phoneCode: '+49' },
  { name: 'France', code: 'FR', phoneCode: '+33' },
  { name: 'Italy', code: 'IT', phoneCode: '+39' },
  { name: 'Spain', code: 'ES', phoneCode: '+34' },
  { name: 'Netherlands', code: 'NL', phoneCode: '+31' },
  { name: 'Belgium', code: 'BE', phoneCode: '+32' },
  { name: 'Switzerland', code: 'CH', phoneCode: '+41' },
  { name: 'Austria', code: 'AT', phoneCode: '+43' },
  { name: 'Sweden', code: 'SE', phoneCode: '+46' },
  { name: 'Norway', code: 'NO', phoneCode: '+47' },
  { name: 'Denmark', code: 'DK', phoneCode: '+45' },
  { name: 'Finland', code: 'FI', phoneCode: '+358' },
  { name: 'Poland', code: 'PL', phoneCode: '+48' },
  { name: 'Portugal', code: 'PT', phoneCode: '+351' },
  { name: 'Greece', code: 'GR', phoneCode: '+30' },
  { name: 'Ireland', code: 'IE', phoneCode: '+353' },
  { name: 'Pakistan', code: 'PK', phoneCode: '+92' },
  { name: 'India', code: 'IN', phoneCode: '+91' },
  { name: 'Bangladesh', code: 'BD', phoneCode: '+880' },
  { name: 'Sri Lanka', code: 'LK', phoneCode: '+94' },
  { name: 'Nepal', code: 'NP', phoneCode: '+977' },
  { name: 'Afghanistan', code: 'AF', phoneCode: '+93' },
  { name: 'China', code: 'CN', phoneCode: '+86' },
  { name: 'Japan', code: 'JP', phoneCode: '+81' },
  { name: 'South Korea', code: 'KR', phoneCode: '+82' },
  { name: 'Singapore', code: 'SG', phoneCode: '+65' },
  { name: 'Malaysia', code: 'MY', phoneCode: '+60' },
  { name: 'Thailand', code: 'TH', phoneCode: '+66' },
  { name: 'Indonesia', code: 'ID', phoneCode: '+62' },
  { name: 'Philippines', code: 'PH', phoneCode: '+63' },
  { name: 'Vietnam', code: 'VN', phoneCode: '+84' },
  { name: 'United Arab Emirates', code: 'AE', phoneCode: '+971' },
  { name: 'Saudi Arabia', code: 'SA', phoneCode: '+966' },
  { name: 'Qatar', code: 'QA', phoneCode: '+974' },
  { name: 'Kuwait', code: 'KW', phoneCode: '+965' },
  { name: 'Bahrain', code: 'BH', phoneCode: '+973' },
  { name: 'Oman', code: 'OM', phoneCode: '+968' },
  { name: 'Israel', code: 'IL', phoneCode: '+972' },
  { name: 'Turkey', code: 'TR', phoneCode: '+90' },
  { name: 'Egypt', code: 'EG', phoneCode: '+20' },
  { name: 'South Africa', code: 'ZA', phoneCode: '+27' },
  { name: 'Nigeria', code: 'NG', phoneCode: '+234' },
  { name: 'Kenya', code: 'KE', phoneCode: '+254' },
  { name: 'Brazil', code: 'BR', phoneCode: '+55' },
  { name: 'Argentina', code: 'AR', phoneCode: '+54' },
  { name: 'Mexico', code: 'MX', phoneCode: '+52' },
  { name: 'Chile', code: 'CL', phoneCode: '+56' },
  { name: 'Colombia', code: 'CO', phoneCode: '+57' },
  { name: 'Peru', code: 'PE', phoneCode: '+51' },
  { name: 'Venezuela', code: 'VE', phoneCode: '+58' },
  { name: 'New Zealand', code: 'NZ', phoneCode: '+64' },
  { name: 'Russia', code: 'RU', phoneCode: '+7' },
  { name: 'Ukraine', code: 'UA', phoneCode: '+380' },
  { name: 'Romania', code: 'RO', phoneCode: '+40' },
  { name: 'Czech Republic', code: 'CZ', phoneCode: '+420' },
  { name: 'Hungary', code: 'HU', phoneCode: '+36' },
  { name: 'Croatia', code: 'HR', phoneCode: '+385' },
  { name: 'Bulgaria', code: 'BG', phoneCode: '+359' },
  { name: 'Serbia', code: 'RS', phoneCode: '+381' },
  { name: 'Slovakia', code: 'SK', phoneCode: '+421' },
  { name: 'Slovenia', code: 'SI', phoneCode: '+386' },
  { name: 'Lithuania', code: 'LT', phoneCode: '+370' },
  { name: 'Latvia', code: 'LV', phoneCode: '+371' },
  { name: 'Estonia', code: 'EE', phoneCode: '+372' },
].sort((a, b) => a.name.localeCompare(b.name));

// Helper function to get country by code
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

// Helper function to get country by phone code
export function getCountryByPhoneCode(phoneCode: string): Country | undefined {
  return COUNTRIES.find((country) => country.phoneCode === phoneCode);
}
