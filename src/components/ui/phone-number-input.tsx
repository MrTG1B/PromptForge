
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2 code e.g., 'US'
  dialCode: string; // e.g., '+1'
  flag: string; // Emoji flag
}

// Ensure all countries have flag emojis
const countries: Country[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Afghanistan', code: 'AF', dialCode: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', dialCode: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Andorra', code: 'AD', dialCode: '+376', flag: '🇦🇩' },
  { name: 'Angola', code: 'AO', dialCode: '+244', flag: '🇦🇴' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { name: 'Armenia', code: 'AM', dialCode: '+374', flag: '🇦🇲' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: 'AZ', dialCode: '+994', flag: '🇦🇿' },
  { name: 'Bahamas', code: 'BS', dialCode: '+1242', flag: '🇧🇸' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Barbados', code: 'BB', dialCode: '+1246', flag: '🇧🇧' },
  { name: 'Belarus', code: 'BY', dialCode: '+375', flag: '🇧🇾' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { name: 'Belize', code: 'BZ', dialCode: '+501', flag: '🇧🇿' },
  { name: 'Benin', code: 'BJ', dialCode: '+229', flag: '🇧🇯' },
  { name: 'Bhutan', code: 'BT', dialCode: '+975', flag: '🇧🇹' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387', flag: '🇧🇦' },
  { name: 'Botswana', code: 'BW', dialCode: '+267', flag: '🇧🇼' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359', flag: '🇧🇬' },
  { name: 'Burkina Faso', code: 'BF', dialCode: '+226', flag: '🇧🇫' },
  { name: 'Burundi', code: 'BI', dialCode: '+257', flag: '🇧🇮' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855', flag: '🇰🇭' },
  { name: 'Cameroon', code: 'CM', dialCode: '+237', flag: '🇨🇲' },
  { name: 'Cape Verde', code: 'CV', dialCode: '+238', flag: '🇨🇻' },
  { name: 'Central African Republic', code: 'CF', dialCode: '+236', flag: '🇨🇫' },
  { name: 'Chad', code: 'TD', dialCode: '+235', flag: '🇹🇩' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { name: 'Comoros', code: 'KM', dialCode: '+269', flag: '🇰🇲' },
  { name: 'Congo, Dem. Rep.', code: 'CD', dialCode: '+243', flag: '🇨🇩' },
  { name: 'Congo, Rep.', code: 'CG', dialCode: '+242', flag: '🇨🇬' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506', flag: '🇨🇷' },
  { name: "Côte d'Ivoire", code: 'CI', dialCode: '+225', flag: '🇨🇮' },
  { name: 'Croatia', code: 'HR', dialCode: '+385', flag: '🇭🇷' },
  { name: 'Cuba', code: 'CU', dialCode: '+53', flag: '🇨🇺' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357', flag: '🇨🇾' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Djibouti', code: 'DJ', dialCode: '+253', flag: '🇩🇯' },
  { name: 'Dominica', code: 'DM', dialCode: '+1767', flag: '🇩🇲' },
  { name: 'Dominican Republic', code: 'DO', dialCode: '+1', flag: '🇩🇴' }, // Note: DR shares +1, ensure unique handling if needed
  { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: '🇪🇨' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: 'GQ', dialCode: '+240', flag: '🇬🇶' },
  { name: 'Eritrea', code: 'ER', dialCode: '+291', flag: '🇪🇷' },
  { name: 'Estonia', code: 'EE', dialCode: '+372', flag: '🇪🇪' },
  { name: 'Eswatini', code: 'SZ', dialCode: '+268', flag: '🇸🇿' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251', flag: '🇪🇹' },
  { name: 'Fiji', code: 'FJ', dialCode: '+679', flag: '🇫🇯' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { name: 'Gabon', code: 'GA', dialCode: '+241', flag: '🇬🇦' },
  { name: 'Gambia', code: 'GM', dialCode: '+220', flag: '🇬🇲' },
  { name: 'Georgia', code: 'GE', dialCode: '+995', flag: '🇬🇪' },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { name: 'Grenada', code: 'GD', dialCode: '+1473', flag: '🇬🇩' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502', flag: '🇬🇹' },
  { name: 'Guinea', code: 'GN', dialCode: '+224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: 'GW', dialCode: '+245', flag: '🇬🇼' },
  { name: 'Guyana', code: 'GY', dialCode: '+592', flag: '🇬🇾' },
  { name: 'Haiti', code: 'HT', dialCode: '+509', flag: '🇭🇹' },
  { name: 'Honduras', code: 'HN', dialCode: '+504', flag: '🇭🇳' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
  { name: 'Hungary', code: 'HU', dialCode: '+36', flag: '🇭🇺' },
  { name: 'Iceland', code: 'IS', dialCode: '+354', flag: '🇮🇸' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Iran', code: 'IR', dialCode: '+98', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', dialCode: '+964', flag: '🇮🇶' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Jamaica', code: 'JM', dialCode: '+1876', flag: '🇯🇲' },
  { name: 'Jordan', code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7', flag: '🇰🇿' }, // Note: +7 shared with Russia
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Kiribati', code: 'KI', dialCode: '+686', flag: '🇰🇮' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: 'KG', dialCode: '+996', flag: '🇰🇬' },
  { name: 'Laos', code: 'LA', dialCode: '+856', flag: '🇱🇦' },
  { name: 'Latvia', code: 'LV', dialCode: '+371', flag: '🇱🇻' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961', flag: '🇱🇧' },
  { name: 'Lesotho', code: 'LS', dialCode: '+266', flag: '🇱🇸' },
  { name: 'Liberia', code: 'LR', dialCode: '+231', flag: '🇱🇷' },
  { name: 'Libya', code: 'LY', dialCode: '+218', flag: '🇱🇾' },
  { name: 'Liechtenstein', code: 'LI', dialCode: '+423', flag: '🇱🇮' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370', flag: '🇱🇹' },
  { name: 'Luxembourg', code: 'LU', dialCode: '+352', flag: '🇱🇺' },
  { name: 'Macau', code: 'MO', dialCode: '+853', flag: '🇲🇴' },
  { name: 'Madagascar', code: 'MG', dialCode: '+261', flag: '🇲🇬' },
  { name: 'Malawi', code: 'MW', dialCode: '+265', flag: '🇲🇼' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Maldives', code: 'MV', dialCode: '+960', flag: '🇲🇻' },
  { name: 'Mali', code: 'ML', dialCode: '+223', flag: '🇲🇱' },
  { name: 'Malta', code: 'MT', dialCode: '+356', flag: '🇲🇹' },
  { name: 'Mauritania', code: 'MR', dialCode: '+222', flag: '🇲🇷' },
  { name: 'Mauritius', code: 'MU', dialCode: '+230', flag: '🇲🇺' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Moldova', code: 'MD', dialCode: '+373', flag: '🇲🇩' },
  { name: 'Monaco', code: 'MC', dialCode: '+377', flag: '🇲🇨' },
  { name: 'Mongolia', code: 'MN', dialCode: '+976', flag: '🇲🇳' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382', flag: '🇲🇪' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258', flag: '🇲🇿' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95', flag: '🇲🇲' },
  { name: 'Namibia', code: 'NA', dialCode: '+264', flag: '🇳🇦' },
  { name: 'Nauru', code: 'NR', dialCode: '+674', flag: '🇳🇷' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505', flag: '🇳🇮' },
  { name: 'Niger', code: 'NE', dialCode: '+227', flag: '🇳🇪' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'North Korea', code: 'KP', dialCode: '+850', flag: '🇰🇵' },
  { name: 'North Macedonia', code: 'MK', dialCode: '+389', flag: '🇲🇰' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'Palau', code: 'PW', dialCode: '+680', flag: '🇵🇼' },
  { name: 'Palestine', code: 'PS', dialCode: '+970', flag: '🇵🇸' },
  { name: 'Panama', code: 'PA', dialCode: '+507', flag: '🇵🇦' },
  { name: 'Papua New Guinea', code: 'PG', dialCode: '+675', flag: '🇵🇬' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595', flag: '🇵🇾' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Puerto Rico', code: 'PR', dialCode: '+1', flag: '🇵🇷' }, // Note: PR shares +1
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', dialCode: '+40', flag: '🇷🇴' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼' },
  { name: 'Samoa', code: 'WS', dialCode: '+685', flag: '🇼🇸' },
  { name: 'San Marino', code: 'SM', dialCode: '+378', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', code: 'ST', dialCode: '+239', flag: '🇸🇹' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Senegal', code: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { name: 'Serbia', code: 'RS', dialCode: '+381', flag: '🇷🇸' },
  { name: 'Seychelles', code: 'SC', dialCode: '+248', flag: '🇸🇨' },
  { name: 'Sierra Leone', code: 'SL', dialCode: '+232', flag: '🇸🇱' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421', flag: '🇸🇰' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386', flag: '🇸🇮' },
  { name: 'Solomon Islands', code: 'SB', dialCode: '+677', flag: '🇸🇧' },
  { name: 'Somalia', code: 'SO', dialCode: '+252', flag: '🇸🇴' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'South Sudan', code: 'SS', dialCode: '+211', flag: '🇸🇸' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Sudan', code: 'SD', dialCode: '+249', flag: '🇸🇩' },
  { name: 'Suriname', code: 'SR', dialCode: '+597', flag: '🇸🇷' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Syria', code: 'SY', dialCode: '+963', flag: '🇸🇾' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: '🇹🇼' },
  { name: 'Tajikistan', code: 'TJ', dialCode: '+992', flag: '🇹🇯' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Timor-Leste', code: 'TL', dialCode: '+670', flag: '🇹🇱' },
  { name: 'Togo', code: 'TG', dialCode: '+228', flag: '🇹🇬' },
  { name: 'Tonga', code: 'TO', dialCode: '+676', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', code: 'TT', dialCode: '+1868', flag: '🇹🇹' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Turkmenistan', code: 'TM', dialCode: '+993', flag: '🇹🇲' },
  { name: 'Tuvalu', code: 'TV', dialCode: '+688', flag: '🇹🇻' },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598', flag: '🇺🇾' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998', flag: '🇺🇿' },
  { name: 'Vanuatu', code: 'VU', dialCode: '+678', flag: '🇻🇺' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58', flag: '🇻🇪' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'Yemen', code: 'YE', dialCode: '+967', flag: '🇾🇪' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263', flag: '🇿🇼' },
];


interface PhoneNumberInputProps {
  value?: string; // Expected format: "+11234567890" or "1234567890" if country is already selected
  onChange?: (value: string) => void;
  defaultCountry?: string; // ISO code, e.g., "IN"
  disabled?: boolean;
}

export default function PhoneNumberInput({
  value = '',
  onChange,
  defaultCountry = 'IN', // Default to India
  disabled = false,
}: PhoneNumberInputProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const initialSelectedCountry = useMemo(() => {
    if (value && value.startsWith('+')) {
      // Try to find country by dial code if value is a full E.164 number
      const countryWithMatchingDialCode = countries.find(c => value.startsWith(c.dialCode));
      if (countryWithMatchingDialCode) return countryWithMatchingDialCode;
    }
    // Fallback to defaultCountry prop or the first country in the list
    return countries.find(c => c.code === defaultCountry) || countries[0];
  }, [value, defaultCountry]);

  const [selectedCountry, setSelectedCountry] = useState<Country>(initialSelectedCountry);

  const initialNumberPart = useMemo(() => {
    if (value && selectedCountry && value.startsWith(selectedCountry.dialCode)) {
      return value.substring(selectedCountry.dialCode.length).replace(/\D/g, '');
    } else if (value && !value.startsWith('+')) {
      // If value is just digits, assume it's the national number part for the current selectedCountry
      return value.replace(/\D/g, '');
    }
    return '';
  }, [value, selectedCountry]);

  const [numberInput, setNumberInput] = useState<string>(initialNumberPart);

  // Effect to update selectedCountry and numberInput if 'value' or 'defaultCountry' prop changes
  useEffect(() => {
    let newSelectedCountry = countries.find(c => c.code === defaultCountry) || countries[0];
    let newNumberPart = '';

    if (value && value.trim() !== '') {
      if (value.startsWith('+')) {
        const foundCountry = countries.find(c => value.startsWith(c.dialCode));
        if (foundCountry) {
          newSelectedCountry = foundCountry;
          newNumberPart = value.substring(foundCountry.dialCode.length).replace(/\D/g, '');
        } else {
          // If starts with + but no matching dial code, keep default country and treat value as national number
          newNumberPart = value.replace(/\D/g, ''); // Or potentially strip '+' if it's not part of a valid dial code
        }
      } else {
        // If value doesn't start with '+', assume it's a national number for the default country
        newNumberPart = value.replace(/\D/g, '');
      }
    }
    
    setSelectedCountry(newSelectedCountry);
    setNumberInput(newNumberPart);
  }, [value, defaultCountry]);


  const handleCountrySelect = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      setPopoverOpen(false);
      if (onChange) {
        // When country changes, construct new full number with current numberInput
        onChange(country.dialCode + numberInput.replace(/\D/g, ''));
      }
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNationalNumber = e.target.value.replace(/\D/g, '');
    setNumberInput(newNationalNumber);
    if (onChange && selectedCountry) {
      onChange(selectedCountry.dialCode + newNationalNumber);
    }
  };
  
  const calculateInputPaddingLeft = (country: Country | undefined): string => {
    if (!country) return '0.75rem'; // Default padding
    const flagWidth = 1.7; // Approximate em width for flag emoji + space
    const dialCodeString = `${country.dialCode}`; // Ensure it's a string
    const dialCodeWidth = dialCodeString.length * 0.6 + 0.5; // Approx em for dial code chars + space
    const extraSpace = 0.5; // A bit more space
    return `${flagWidth + dialCodeWidth + extraSpace}rem`;
  };


  return (
    <div className="flex items-stretch w-full">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className={cn(
              "w-[130px] justify-between rounded-r-none border-r-input pl-3 pr-2",
              "focus:ring-ring focus:ring-2 focus:ring-offset-0 focus:z-10"
            )}
            disabled={disabled}
          >
            <span className="flex items-center gap-2 truncate">
              {selectedCountry?.flag && <span className="text-base">{selectedCountry.flag}</span>}
              <span className="truncate text-xs sm:text-sm">{selectedCountry?.dialCode}</span>
            </span>
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 max-h-[300px] overflow-y-auto z-[60]">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.flag} ${country.name} ${country.dialCode}`}
                    onSelect={() => handleCountrySelect(country.code)}
                    className="flex items-center justify-between w-full cursor-pointer text-sm py-2 px-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{country.dialCode}</span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="relative flex-1">
        {selectedCountry && (
            <span 
                key={selectedCountry.dialCode} // Key to help re-render
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none z-10 flex items-center gap-1.5"
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <span>{selectedCountry.dialCode}</span>
            </span>
          )}
        <Input
          type="tel"
          placeholder="Phone number"
          value={numberInput}
          onChange={handleNumberInputChange}
          className={cn(
            "rounded-l-none flex-1 w-full focus:z-10"
            )} 
          style={{ paddingLeft: calculateInputPaddingLeft(selectedCountry) }}
          disabled={disabled || !selectedCountry}
          aria-label="Phone number"
        />
      </div>
    </div>
  );
}
