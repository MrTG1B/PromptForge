
"use client";

import React, { useState, useEffect } from 'react';
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
}

const countries: Country[] = [
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Brazil', code: 'BR', dialCode: '+55' },
  { name: 'China', code: 'CN', dialCode: '+86' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27' },
  { name: 'Afghanistan', code: 'AF', dialCode: '+93' },
  { name: 'Albania', code: 'AL', dialCode: '+355' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213' },
  { name: 'Andorra', code: 'AD', dialCode: '+376' },
  { name: 'Angola', code: 'AO', dialCode: '+244' },
  { name: 'Argentina', code: 'AR', dialCode: '+54' },
  { name: 'Armenia', code: 'AM', dialCode: '+374' },
  { name: 'Austria', code: 'AT', dialCode: '+43' },
  { name: 'Azerbaijan', code: 'AZ', dialCode: '+994' },
  { name: 'Bahamas', code: 'BS', dialCode: '+1242' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880' },
  { name: 'Barbados', code: 'BB', dialCode: '+1246' },
  { name: 'Belarus', code: 'BY', dialCode: '+375' },
  { name: 'Belgium', code: 'BE', dialCode: '+32' },
  { name: 'Belize', code: 'BZ', dialCode: '+501' },
  { name: 'Benin', code: 'BJ', dialCode: '+229' },
  { name: 'Bhutan', code: 'BT', dialCode: '+975' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591' },
  { name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387' },
  { name: 'Botswana', code: 'BW', dialCode: '+267' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359' },
  { name: 'Burkina Faso', code: 'BF', dialCode: '+226' },
  { name: 'Burundi', code: 'BI', dialCode: '+257' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855' },
  { name: 'Cameroon', code: 'CM', dialCode: '+237' },
  { name: 'Cape Verde', code: 'CV', dialCode: '+238' },
  { name: 'Central African Republic', code: 'CF', dialCode: '+236' },
  { name: 'Chad', code: 'TD', dialCode: '+235' },
  { name: 'Chile', code: 'CL', dialCode: '+56' },
  { name: 'Colombia', code: 'CO', dialCode: '+57' },
  { name: 'Comoros', code: 'KM', dialCode: '+269' },
  { name: 'Congo, Dem. Rep.', code: 'CD', dialCode: '+243' },
  { name: 'Congo, Rep.', code: 'CG', dialCode: '+242' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506' },
  { name: "Côte d'Ivoire", code: 'CI', dialCode: '+225' },
  { name: 'Croatia', code: 'HR', dialCode: '+385' },
  { name: 'Cuba', code: 'CU', dialCode: '+53' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420' },
  { name: 'Denmark', code: 'DK', dialCode: '+45' },
  { name: 'Djibouti', code: 'DJ', dialCode: '+253' },
  { name: 'Dominica', code: 'DM', dialCode: '+1767' },
  { name: 'Dominican Republic', code: 'DO', dialCode: '+1' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593' },
  { name: 'Egypt', code: 'EG', dialCode: '+20' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503' },
  { name: 'Equatorial Guinea', code: 'GQ', dialCode: '+240' },
  { name: 'Eritrea', code: 'ER', dialCode: '+291' },
  { name: 'Estonia', code: 'EE', dialCode: '+372' },
  { name: 'Eswatini', code: 'SZ', dialCode: '+268' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251' },
  { name: 'Fiji', code: 'FJ', dialCode: '+679' },
  { name: 'Finland', code: 'FI', dialCode: '+358' },
  { name: 'Gabon', code: 'GA', dialCode: '+241' },
  { name: 'Gambia', code: 'GM', dialCode: '+220' },
  { name: 'Georgia', code: 'GE', dialCode: '+995' },
  { name: 'Ghana', code: 'GH', dialCode: '+233' },
  { name: 'Greece', code: 'GR', dialCode: '+30' },
  { name: 'Grenada', code: 'GD', dialCode: '+1473' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502' },
  { name: 'Guinea', code: 'GN', dialCode: '+224' },
  { name: 'Guinea-Bissau', code: 'GW', dialCode: '+245' },
  { name: 'Guyana', code: 'GY', dialCode: '+592' },
  { name: 'Haiti', code: 'HT', dialCode: '+509' },
  { name: 'Honduras', code: 'HN', dialCode: '+504' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852' },
  { name: 'Hungary', code: 'HU', dialCode: '+36' },
  { name: 'Iceland', code: 'IS', dialCode: '+354' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62' },
  { name: 'Iran', code: 'IR', dialCode: '+98' },
  { name: 'Iraq', code: 'IQ', dialCode: '+964' },
  { name: 'Ireland', code: 'IE', dialCode: '+353' },
  { name: 'Israel', code: 'IL', dialCode: '+972' },
  { name: 'Italy', code: 'IT', dialCode: '+39' },
  { name: 'Jamaica', code: 'JM', dialCode: '+1876' },
  { name: 'Jordan', code: 'JO', dialCode: '+962' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7' },
  { name: 'Kenya', code: 'KE', dialCode: '+254' },
  { name: 'Kiribati', code: 'KI', dialCode: '+686' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965' },
  { name: 'Kyrgyzstan', code: 'KG', dialCode: '+996' },
  { name: 'Laos', code: 'LA', dialCode: '+856' },
  { name: 'Latvia', code: 'LV', dialCode: '+371' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961' },
  { name: 'Lesotho', code: 'LS', dialCode: '+266' },
  { name: 'Liberia', code: 'LR', dialCode: '+231' },
  { name: 'Libya', code: 'LY', dialCode: '+218' },
  { name: 'Liechtenstein', code: 'LI', dialCode: '+423' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370' },
  { name: 'Luxembourg', code: 'LU', dialCode: '+352' },
  { name: 'Macau', code: 'MO', dialCode: '+853' },
  { name: 'Madagascar', code: 'MG', dialCode: '+261' },
  { name: 'Malawi', code: 'MW', dialCode: '+265' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60' },
  { name: 'Maldives', code: 'MV', dialCode: '+960' },
  { name: 'Mali', code: 'ML', dialCode: '+223' },
  { name: 'Malta', code: 'MT', dialCode: '+356' },
  { name: 'Mauritania', code: 'MR', dialCode: '+222' },
  { name: 'Mauritius', code: 'MU', dialCode: '+230' },
  { name: 'Mexico', code: 'MX', dialCode: '+52' },
  { name: 'Moldova', code: 'MD', dialCode: '+373' },
  { name: 'Monaco', code: 'MC', dialCode: '+377' },
  { name: 'Mongolia', code: 'MN', dialCode: '+976' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382' },
  { name: 'Morocco', code: 'MA', dialCode: '+212' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95' },
  { name: 'Namibia', code: 'NA', dialCode: '+264' },
  { name: 'Nauru', code: 'NR', dialCode: '+674' },
  { name: 'Nepal', code: 'NP', dialCode: '+977' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505' },
  { name: 'Niger', code: 'NE', dialCode: '+227' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234' },
  { name: 'North Korea', code: 'KP', dialCode: '+850' },
  { name: 'North Macedonia', code: 'MK', dialCode: '+389' },
  { name: 'Norway', code: 'NO', dialCode: '+47' },
  { name: 'Oman', code: 'OM', dialCode: '+968' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92' },
  { name: 'Palau', code: 'PW', dialCode: '+680' },
  { name: 'Palestine', code: 'PS', dialCode: '+970' },
  { name: 'Panama', code: 'PA', dialCode: '+507' },
  { name: 'Papua New Guinea', code: 'PG', dialCode: '+675' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595' },
  { name: 'Peru', code: 'PE', dialCode: '+51' },
  { name: 'Philippines', code: 'PH', dialCode: '+63' },
  { name: 'Poland', code: 'PL', dialCode: '+48' },
  { name: 'Portugal', code: 'PT', dialCode: '+351' },
  { name: 'Puerto Rico', code: 'PR', dialCode: '+1' }, // Often grouped with US
  { name: 'Qatar', code: 'QA', dialCode: '+974' },
  { name: 'Romania', code: 'RO', dialCode: '+40' },
  { name: 'Russia', code: 'RU', dialCode: '+7' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250' },
  { name: 'Samoa', code: 'WS', dialCode: '+685' },
  { name: 'San Marino', code: 'SM', dialCode: '+378' },
  { name: 'Sao Tome and Principe', code: 'ST', dialCode: '+239' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966' },
  { name: 'Senegal', code: 'SN', dialCode: '+221' },
  { name: 'Serbia', code: 'RS', dialCode: '+381' },
  { name: 'Seychelles', code: 'SC', dialCode: '+248' },
  { name: 'Sierra Leone', code: 'SL', dialCode: '+232' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386' },
  { name: 'Solomon Islands', code: 'SB', dialCode: '+677' },
  { name: 'Somalia', code: 'SO', dialCode: '+252' },
  { name: 'South Korea', code: 'KR', dialCode: '+82' },
  { name: 'South Sudan', code: 'SS', dialCode: '+211' },
  { name: 'Spain', code: 'ES', dialCode: '+34' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94' },
  { name: 'Sudan', code: 'SD', dialCode: '+249' },
  { name: 'Suriname', code: 'SR', dialCode: '+597' },
  { name: 'Sweden', code: 'SE', dialCode: '+46' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41' },
  { name: 'Syria', code: 'SY', dialCode: '+963' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886' },
  { name: 'Tajikistan', code: 'TJ', dialCode: '+992' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255' },
  { name: 'Thailand', code: 'TH', dialCode: '+66' },
  { name: 'Timor-Leste', code: 'TL', dialCode: '+670' },
  { name: 'Togo', code: 'TG', dialCode: '+228' },
  { name: 'Tonga', code: 'TO', dialCode: '+676' },
  { name: 'Trinidad and Tobago', code: 'TT', dialCode: '+1868' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216' },
  { name: 'Turkey', code: 'TR', dialCode: '+90' },
  { name: 'Turkmenistan', code: 'TM', dialCode: '+993' },
  { name: 'Tuvalu', code: 'TV', dialCode: '+688' },
  { name: 'Uganda', code: 'UG', dialCode: '+256' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998' },
  { name: 'Vanuatu', code: 'VU', dialCode: '+678' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84' },
  { name: 'Yemen', code: 'YE', dialCode: '+967' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263' },
];


interface PhoneNumberInputProps {
  value?: string; // Expected format: "+11234567890"
  onChange?: (value: string) => void;
  defaultCountry?: string; // ISO code, e.g., "US"
  disabled?: boolean;
}

export default function PhoneNumberInput({
  value = '',
  onChange,
  defaultCountry = 'US', // Default to United States
  disabled = false,
}: PhoneNumberInputProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    countries.find(c => c.code === defaultCountry) || countries.find(c => c.code === 'US') || countries[0]
  );
  const [numberInput, setNumberInput] = useState('');

  useEffect(() => {
    if (value && selectedCountry?.dialCode && value.startsWith(selectedCountry.dialCode)) {
      setNumberInput(value.substring(selectedCountry.dialCode.length));
    } else if (value) {
      // Try to find a country match if value doesn't match current selectedCountry
      let matched = false;
      for (const country of countries) {
        if (value.startsWith(country.dialCode)) {
          setSelectedCountry(country);
          setNumberInput(value.substring(country.dialCode.length));
          matched = true;
          break;
        }
      }
      if (!matched) { // If no country code in value, assume it's just the number part
        setNumberInput(value.replace(/^\+/, '')); // Remove leading + if any
      }
    } else {
      setNumberInput(''); // Clear if value is empty
    }
  }, [value, selectedCountry?.dialCode]);


  const handleCountrySelect = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      setPopoverOpen(false);
      if (onChange) {
        // Preserve existing number input if user just changes country code
        onChange(country.dialCode + numberInput);
      }
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumberInput = e.target.value.replace(/\D/g, ''); // Allow only digits
    setNumberInput(newNumberInput);
    if (onChange && selectedCountry) {
      onChange(selectedCountry.dialCode + newNumberInput);
    }
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
              "w-[130px] justify-between rounded-r-none border-r-input",
              "focus:ring-ring focus:ring-2 focus:ring-offset-0 focus:z-10" // Ensure focus ring is visible
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {selectedCountry ? `${selectedCountry.name} (${selectedCountry.dialCode})` : "Select Country"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 max-h-[300px] overflow-y-auto z-[60]"> {/* Increased z-index */}
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={country.name} // Value for CMDK search
                    onSelect={() => handleCountrySelect(country.code)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <span className="truncate">{country.name}</span>
                    <span className="text-muted-foreground ml-2">{country.dialCode}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="relative flex-1">
        {selectedCountry && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none z-10">
              {selectedCountry.dialCode}
            </span>
          )}
        <Input
          type="tel"
          placeholder="Phone number"
          value={numberInput}
          onChange={handleNumberInputChange}
          className={cn(
            "rounded-l-none flex-1 w-full focus:z-10", // Ensure focus ring is visible
            selectedCountry ? `pl-[${(selectedCountry.dialCode.length * 8) + 12}px]` : "pl-3" // Dynamic padding
            )} 
          style={{ paddingLeft: selectedCountry ? `${selectedCountry.dialCode.length * 0.6 + 0.75}em` : '0.75em' }} // More reliable padding
          disabled={disabled || !selectedCountry}
          aria-label="Phone number"
        />
      </div>
    </div>
  );
}
