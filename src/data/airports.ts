export interface Airport {
  code: string
  name: string
  city: string
  country: string
  cityCode?: string // parent city code for grouping
}

export interface CityGroup {
  cityCode: string
  city: string
  country: string
  airports: Airport[]
}

export const AIRPORTS: Airport[] = [
  // ── USA ──
  { code: 'JFK', name: 'John F. Kennedy Intl',        city: 'New York',      country: 'USA',         cityCode: 'NYC' },
  { code: 'LGA', name: 'LaGuardia',                   city: 'New York',      country: 'USA',         cityCode: 'NYC' },
  { code: 'EWR', name: 'Newark Liberty Intl',         city: 'New York',      country: 'USA',         cityCode: 'NYC' },
  { code: 'LAX', name: 'Los Angeles Intl',            city: 'Los Angeles',   country: 'USA',         cityCode: 'LAX' },
  { code: 'BUR', name: 'Hollywood Burbank',           city: 'Los Angeles',   country: 'USA',         cityCode: 'LAX' },
  { code: 'LGB', name: 'Long Beach',                  city: 'Los Angeles',   country: 'USA',         cityCode: 'LAX' },
  { code: 'ORD', name: "O'Hare Intl",                 city: 'Chicago',       country: 'USA',         cityCode: 'CHI' },
  { code: 'MDW', name: 'Midway Intl',                 city: 'Chicago',       country: 'USA',         cityCode: 'CHI' },
  { code: 'SFO', name: 'San Francisco Intl',          city: 'San Francisco', country: 'USA',         cityCode: 'SFO' },
  { code: 'OAK', name: 'Oakland Intl',                city: 'San Francisco', country: 'USA',         cityCode: 'SFO' },
  { code: 'SJC', name: 'San Jose Intl',               city: 'San Francisco', country: 'USA',         cityCode: 'SFO' },
  { code: 'MIA', name: 'Miami Intl',                  city: 'Miami',         country: 'USA',         cityCode: 'MIA' },
  { code: 'FLL', name: 'Fort Lauderdale Intl',        city: 'Miami',         country: 'USA',         cityCode: 'MIA' },
  { code: 'DFW', name: 'Dallas Fort Worth Intl',      city: 'Dallas',        country: 'USA',         cityCode: 'DFW' },
  { code: 'DAL', name: 'Dallas Love Field',           city: 'Dallas',        country: 'USA',         cityCode: 'DFW' },
  { code: 'IAH', name: 'George Bush Intercontinental',city: 'Houston',       country: 'USA',         cityCode: 'HOU' },
  { code: 'HOU', name: 'William P. Hobby',            city: 'Houston',       country: 'USA',         cityCode: 'HOU' },
  { code: 'SEA', name: 'Seattle-Tacoma Intl',         city: 'Seattle',       country: 'USA',         cityCode: 'SEA' },
  { code: 'BOS', name: 'Logan Intl',                  city: 'Boston',        country: 'USA',         cityCode: 'BOS' },
  { code: 'DEN', name: 'Denver Intl',                 city: 'Denver',        country: 'USA',         cityCode: 'DEN' },
  { code: 'ATL', name: 'Hartsfield-Jackson',          city: 'Atlanta',       country: 'USA',         cityCode: 'ATL' },
  { code: 'LAS', name: 'Harry Reid Intl',             city: 'Las Vegas',     country: 'USA',         cityCode: 'LAS' },
  { code: 'MCO', name: 'Orlando Intl',                city: 'Orlando',       country: 'USA',         cityCode: 'MCO' },
  { code: 'PHX', name: 'Phoenix Sky Harbor',          city: 'Phoenix',       country: 'USA',         cityCode: 'PHX' },
  { code: 'IAD', name: 'Dulles Intl',                 city: 'Washington DC', country: 'USA',         cityCode: 'WAS' },
  { code: 'DCA', name: 'Reagan National',             city: 'Washington DC', country: 'USA',         cityCode: 'WAS' },
  { code: 'BWI', name: 'Baltimore/Washington Intl',   city: 'Washington DC', country: 'USA',         cityCode: 'WAS' },
  // ── UK ──
  { code: 'LHR', name: 'Heathrow',                    city: 'London',        country: 'UK',          cityCode: 'LON' },
  { code: 'LGW', name: 'Gatwick',                     city: 'London',        country: 'UK',          cityCode: 'LON' },
  { code: 'STN', name: 'Stansted',                    city: 'London',        country: 'UK',          cityCode: 'LON' },
  { code: 'LTN', name: 'Luton',                       city: 'London',        country: 'UK',          cityCode: 'LON' },
  { code: 'LCY', name: 'City Airport',                city: 'London',        country: 'UK',          cityCode: 'LON' },
  { code: 'MAN', name: 'Manchester Intl',             city: 'Manchester',    country: 'UK',          cityCode: 'MAN' },
  { code: 'EDI', name: 'Edinburgh',                   city: 'Edinburgh',     country: 'UK',          cityCode: 'EDI' },
  // ── France ──
  { code: 'CDG', name: 'Charles de Gaulle',           city: 'Paris',         country: 'France',      cityCode: 'PAR' },
  { code: 'ORY', name: 'Orly',                        city: 'Paris',         country: 'France',      cityCode: 'PAR' },
  { code: 'NCE', name: 'Nice Côte d\'Azur',           city: 'Nice',          country: 'France',      cityCode: 'NCE' },
  // ── Germany ──
  { code: 'FRA', name: 'Frankfurt Intl',              city: 'Frankfurt',     country: 'Germany',     cityCode: 'FRA' },
  { code: 'MUC', name: 'Munich Intl',                 city: 'Munich',        country: 'Germany',     cityCode: 'MUC' },
  { code: 'BER', name: 'Berlin Brandenburg',          city: 'Berlin',        country: 'Germany',     cityCode: 'BER' },
  { code: 'DUS', name: 'Düsseldorf Intl',             city: 'Düsseldorf',    country: 'Germany',     cityCode: 'DUS' },
  { code: 'HAM', name: 'Hamburg',                     city: 'Hamburg',       country: 'Germany',     cityCode: 'HAM' },
  // ── UAE ──
  { code: 'DXB', name: 'Dubai Intl',                  city: 'Dubai',         country: 'UAE',         cityCode: 'DXB' },
  { code: 'DWC', name: 'Al Maktoum Intl',             city: 'Dubai',         country: 'UAE',         cityCode: 'DXB' },
  { code: 'AUH', name: 'Abu Dhabi Intl',              city: 'Abu Dhabi',     country: 'UAE',         cityCode: 'AUH' },
  { code: 'SHJ', name: 'Sharjah Intl',                city: 'Sharjah',       country: 'UAE',         cityCode: 'SHJ' },
  // ── Japan ──
  { code: 'NRT', name: 'Narita Intl',                 city: 'Tokyo',         country: 'Japan',       cityCode: 'TYO' },
  { code: 'HND', name: 'Haneda',                      city: 'Tokyo',         country: 'Japan',       cityCode: 'TYO' },
  { code: 'KIX', name: 'Kansai Intl',                 city: 'Osaka',         country: 'Japan',       cityCode: 'OSA' },
  { code: 'ITM', name: 'Itami',                       city: 'Osaka',         country: 'Japan',       cityCode: 'OSA' },
  { code: 'NGO', name: 'Chubu Centrair',              city: 'Nagoya',        country: 'Japan',       cityCode: 'NGO' },
  { code: 'CTS', name: 'New Chitose',                 city: 'Sapporo',       country: 'Japan',       cityCode: 'CTS' },
  // ── India ──
  { code: 'BOM', name: 'Chhatrapati Shivaji Intl',   city: 'Mumbai',         country: 'India',       cityCode: 'BOM' },
  { code: 'DEL', name: 'Indira Gandhi Intl',          city: 'Delhi',          country: 'India',       cityCode: 'DEL' },
  { code: 'BLR', name: 'Kempegowda Intl',             city: 'Bangalore',      country: 'India',       cityCode: 'BLR' },
  { code: 'MAA', name: 'Chennai Intl',                city: 'Chennai',        country: 'India',       cityCode: 'MAA' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose',  city: 'Kolkata',        country: 'India',       cityCode: 'CCU' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl',           city: 'Hyderabad',      country: 'India',       cityCode: 'HYD' },
  { code: 'COK', name: 'Cochin Intl',                 city: 'Kochi',          country: 'India',       cityCode: 'COK' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel',    city: 'Ahmedabad',      country: 'India',       cityCode: 'AMD' },
  { code: 'GOI', name: 'Goa Intl (Dabolim)',          city: 'Goa',            country: 'India',       cityCode: 'GOA' },
  { code: 'GOX', name: 'Manohar Intl (Mopa)',         city: 'Goa',            country: 'India',       cityCode: 'GOA' },
  { code: 'JAI', name: 'Jaipur Intl',                 city: 'Jaipur',         country: 'India',       cityCode: 'JAI' },
  { code: 'PNQ', name: 'Pune Airport',                city: 'Pune',           country: 'India',       cityCode: 'PNQ' },
  { code: 'LKO', name: 'Chaudhary Charan Singh Intl', city: 'Lucknow',        country: 'India',       cityCode: 'LKO' },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee Intl',  city: 'Amritsar',       country: 'India',       cityCode: 'ATQ' },
  { code: 'SXR', name: 'Sheikh ul-Alam Intl',         city: 'Srinagar',       country: 'India',       cityCode: 'SXR' },
  { code: 'IXC', name: 'Chandigarh Intl',             city: 'Chandigarh',     country: 'India',       cityCode: 'IXC' },
  { code: 'PAT', name: 'Jay Prakash Narayan Intl',    city: 'Patna',          country: 'India',       cityCode: 'PAT' },
  { code: 'VNS', name: 'Lal Bahadur Shastri Intl',   city: 'Varanasi',       country: 'India',       cityCode: 'VNS' },
  { code: 'BHO', name: 'Raja Bhoj Airport',           city: 'Bhopal',         country: 'India',       cityCode: 'BHO' },
  { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport',city: 'Indore',        country: 'India',       cityCode: 'IDR' },
  { code: 'NAG', name: 'Dr. Babasaheb Ambedkar Intl', city: 'Nagpur',         country: 'India',       cityCode: 'NAG' },
  { code: 'TRV', name: 'Trivandrum Intl',             city: 'Thiruvananthapuram', country: 'India',   cityCode: 'TRV' },
  { code: 'IXE', name: 'Mangaluru Intl',              city: 'Mangaluru',      country: 'India',       cityCode: 'IXE' },
  { code: 'CJB', name: 'Coimbatore Intl',             city: 'Coimbatore',     country: 'India',       cityCode: 'CJB' },
  { code: 'VTZ', name: 'Visakhapatnam Airport',       city: 'Visakhapatnam',  country: 'India',       cityCode: 'VTZ' },
  { code: 'BBI', name: 'Biju Patnaik Intl',           city: 'Bhubaneswar',    country: 'India',       cityCode: 'BBI' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi',  city: 'Guwahati',       country: 'India',       cityCode: 'GAU' },
  { code: 'IMF', name: 'Bir Tikendrajit Intl',        city: 'Imphal',         country: 'India',       cityCode: 'IMF' },
  { code: 'IXR', name: 'Birsa Munda Airport',         city: 'Ranchi',         country: 'India',       cityCode: 'IXR' },
  { code: 'DIB', name: 'Dibrugarh Airport',           city: 'Dibrugarh',      country: 'India',       cityCode: 'DIB' },
  { code: 'IXB', name: 'Bagdogra Airport',            city: 'Siliguri',       country: 'India',       cityCode: 'IXB' },
  { code: 'IXS', name: 'Silchar Airport',             city: 'Silchar',        country: 'India',       cityCode: 'IXS' },
  { code: 'IXJ', name: 'Jammu Airport',               city: 'Jammu',          country: 'India',       cityCode: 'IXJ' },
  { code: 'IXM', name: 'Madurai Airport',             city: 'Madurai',        country: 'India',       cityCode: 'IXM' },
  { code: 'TRZ', name: 'Tiruchirappalli Intl',        city: 'Tiruchirappalli',country: 'India',       cityCode: 'TRZ' },
  { code: 'BDQ', name: 'Vadodara Airport',            city: 'Vadodara',       country: 'India',       cityCode: 'BDQ' },
  { code: 'STV', name: 'Surat Airport',               city: 'Surat',          country: 'India',       cityCode: 'STV' },
  { code: 'JDH', name: 'Jodhpur Airport',             city: 'Jodhpur',        country: 'India',       cityCode: 'JDH' },
  { code: 'UDR', name: 'Maharana Pratap Airport',     city: 'Udaipur',        country: 'India',       cityCode: 'UDR' },
  { code: 'RPR', name: 'Swami Vivekananda Airport',   city: 'Raipur',         country: 'India',       cityCode: 'RPR' },
  { code: 'IXU', name: 'Aurangabad Airport',          city: 'Aurangabad',     country: 'India',       cityCode: 'IXU' },
  { code: 'PNY', name: 'Puducherry Airport',          city: 'Puducherry',     country: 'India',       cityCode: 'PNY' },
  { code: 'IXZ', name: 'Veer Savarkar Intl',          city: 'Port Blair',     country: 'India',       cityCode: 'IXZ' },
  { code: 'AGX', name: 'Agatti Airport',              city: 'Agatti',         country: 'India',       cityCode: 'AGX' },
  { code: 'DED', name: 'Jolly Grant Airport',         city: 'Dehradun',       country: 'India',       cityCode: 'DED' },
  { code: 'GWL', name: 'Gwalior Airport',             city: 'Gwalior',        country: 'India',       cityCode: 'GWL' },
  { code: 'JLR', name: 'Jabalpur Airport',            city: 'Jabalpur',       country: 'India',       cityCode: 'JLR' },
  { code: 'SHL', name: 'Shillong Airport',            city: 'Shillong',       country: 'India',       cityCode: 'SHL' },
  { code: 'DMU', name: 'Dimapur Airport',             city: 'Dimapur',        country: 'India',       cityCode: 'DMU' },
  { code: 'TEZ', name: 'Tezpur Airport',              city: 'Tezpur',         country: 'India',       cityCode: 'TEZ' },
  { code: 'IXA', name: 'Agartala Airport',            city: 'Agartala',       country: 'India',       cityCode: 'IXA' },
  // ── Singapore ──
  { code: 'SIN', name: 'Changi',                      city: 'Singapore',     country: 'Singapore',   cityCode: 'SIN' },
  // ── Australia ──
  { code: 'SYD', name: 'Kingsford Smith',             city: 'Sydney',        country: 'Australia',   cityCode: 'SYD' },
  { code: 'MEL', name: 'Melbourne',                   city: 'Melbourne',     country: 'Australia',   cityCode: 'MEL' },
  { code: 'BNE', name: 'Brisbane',                    city: 'Brisbane',      country: 'Australia',   cityCode: 'BNE' },
  { code: 'PER', name: 'Perth',                       city: 'Perth',         country: 'Australia',   cityCode: 'PER' },
  { code: 'ADL', name: 'Adelaide',                    city: 'Adelaide',      country: 'Australia',   cityCode: 'ADL' },
  // ── China ──
  { code: 'PEK', name: 'Capital Intl',                city: 'Beijing',       country: 'China',       cityCode: 'BJS' },
  { code: 'PKX', name: 'Daxing Intl',                 city: 'Beijing',       country: 'China',       cityCode: 'BJS' },
  { code: 'PVG', name: 'Pudong Intl',                 city: 'Shanghai',      country: 'China',       cityCode: 'SHA' },
  { code: 'SHA', name: 'Hongqiao Intl',               city: 'Shanghai',      country: 'China',       cityCode: 'SHA' },
  { code: 'CAN', name: 'Baiyun Intl',                 city: 'Guangzhou',     country: 'China',       cityCode: 'CAN' },
  { code: 'HKG', name: 'Hong Kong Intl',              city: 'Hong Kong',     country: 'China',       cityCode: 'HKG' },
  { code: 'CTU', name: 'Tianfu Intl',                 city: 'Chengdu',       country: 'China',       cityCode: 'CTU' },
  // ── South Korea ──
  { code: 'ICN', name: 'Incheon Intl',                city: 'Seoul',         country: 'South Korea', cityCode: 'SEL' },
  { code: 'GMP', name: 'Gimpo Intl',                  city: 'Seoul',         country: 'South Korea', cityCode: 'SEL' },
  // ── Thailand ──
  { code: 'BKK', name: 'Suvarnabhumi',                city: 'Bangkok',       country: 'Thailand',    cityCode: 'BKK' },
  { code: 'DMK', name: 'Don Mueang',                  city: 'Bangkok',       country: 'Thailand',    cityCode: 'BKK' },
  { code: 'HKT', name: 'Phuket Intl',                 city: 'Phuket',        country: 'Thailand',    cityCode: 'HKT' },
  // ── Indonesia ──
  { code: 'CGK', name: 'Soekarno–Hatta Intl',        city: 'Jakarta',       country: 'Indonesia',   cityCode: 'JKT' },
  { code: 'HLP', name: 'Halim Perdanakusuma',         city: 'Jakarta',       country: 'Indonesia',   cityCode: 'JKT' },
  { code: 'DPS', name: 'Ngurah Rai Intl',             city: 'Bali',          country: 'Indonesia',   cityCode: 'DPS' },
  // ── Malaysia ──
  { code: 'KUL', name: 'Kuala Lumpur Intl',           city: 'Kuala Lumpur',  country: 'Malaysia',    cityCode: 'KUL' },
  { code: 'SZB', name: 'Sultan Abdul Aziz Shah',      city: 'Kuala Lumpur',  country: 'Malaysia',    cityCode: 'KUL' },
  // ── Canada ──
  { code: 'YYZ', name: 'Pearson Intl',                city: 'Toronto',       country: 'Canada',      cityCode: 'YTO' },
  { code: 'YTZ', name: 'Billy Bishop',                city: 'Toronto',       country: 'Canada',      cityCode: 'YTO' },
  { code: 'YVR', name: 'Vancouver Intl',              city: 'Vancouver',     country: 'Canada',      cityCode: 'YVR' },
  { code: 'YUL', name: 'Montréal-Trudeau',            city: 'Montreal',      country: 'Canada',      cityCode: 'YMQ' },
  { code: 'YYC', name: 'Calgary Intl',                city: 'Calgary',       country: 'Canada',      cityCode: 'YYC' },
  // ── Europe ──
  { code: 'AMS', name: 'Schiphol',                    city: 'Amsterdam',     country: 'Netherlands', cityCode: 'AMS' },
  { code: 'MAD', name: 'Adolfo Suárez Barajas',       city: 'Madrid',        country: 'Spain',       cityCode: 'MAD' },
  { code: 'BCN', name: 'El Prat',                     city: 'Barcelona',     country: 'Spain',       cityCode: 'BCN' },
  { code: 'FCO', name: 'Fiumicino',                   city: 'Rome',          country: 'Italy',       cityCode: 'ROM' },
  { code: 'CIA', name: 'Ciampino',                    city: 'Rome',          country: 'Italy',       cityCode: 'ROM' },
  { code: 'MXP', name: 'Malpensa',                    city: 'Milan',         country: 'Italy',       cityCode: 'MIL' },
  { code: 'LIN', name: 'Linate',                      city: 'Milan',         country: 'Italy',       cityCode: 'MIL' },
  { code: 'BGY', name: 'Bergamo (Orio al Serio)',     city: 'Milan',         country: 'Italy',       cityCode: 'MIL' },
  { code: 'VIE', name: 'Vienna Intl',                 city: 'Vienna',        country: 'Austria',     cityCode: 'VIE' },
  { code: 'ZRH', name: 'Zurich',                      city: 'Zurich',        country: 'Switzerland', cityCode: 'ZRH' },
  { code: 'GVA', name: 'Geneva',                      city: 'Geneva',        country: 'Switzerland', cityCode: 'GVA' },
  { code: 'BRU', name: 'Brussels',                    city: 'Brussels',      country: 'Belgium',     cityCode: 'BRU' },
  { code: 'CPH', name: 'Copenhagen',                  city: 'Copenhagen',    country: 'Denmark',     cityCode: 'CPH' },
  { code: 'ARN', name: 'Stockholm Arlanda',           city: 'Stockholm',     country: 'Sweden',      cityCode: 'STO' },
  { code: 'BMA', name: 'Stockholm Bromma',            city: 'Stockholm',     country: 'Sweden',      cityCode: 'STO' },
  { code: 'OSL', name: 'Oslo Gardermoen',             city: 'Oslo',          country: 'Norway',      cityCode: 'OSL' },
  { code: 'HEL', name: 'Helsinki-Vantaa',             city: 'Helsinki',      country: 'Finland',     cityCode: 'HEL' },
  { code: 'LIS', name: 'Lisbon Humberto Delgado',     city: 'Lisbon',        country: 'Portugal',    cityCode: 'LIS' },
  { code: 'ATH', name: 'Athens Eleftherios Venizelos',city: 'Athens',        country: 'Greece',      cityCode: 'ATH' },
  { code: 'WAW', name: 'Warsaw Chopin',               city: 'Warsaw',        country: 'Poland',      cityCode: 'WAW' },
  { code: 'PRG', name: 'Václav Havel',                city: 'Prague',        country: 'Czechia',     cityCode: 'PRG' },
  { code: 'BUD', name: 'Budapest Liszt Ferenc',       city: 'Budapest',      country: 'Hungary',     cityCode: 'BUD' },
  // ── Middle East ──
  { code: 'DOH', name: 'Hamad Intl',                  city: 'Doha',          country: 'Qatar',       cityCode: 'DOH' },
  { code: 'RUH', name: 'King Khalid Intl',            city: 'Riyadh',        country: 'Saudi Arabia',cityCode: 'RUH' },
  { code: 'JED', name: 'King Abdulaziz Intl',         city: 'Jeddah',        country: 'Saudi Arabia',cityCode: 'JED' },
  { code: 'AMM', name: 'Queen Alia Intl',             city: 'Amman',         country: 'Jordan',      cityCode: 'AMM' },
  { code: 'TLV', name: 'Ben Gurion',                  city: 'Tel Aviv',      country: 'Israel',      cityCode: 'TLV' },
  { code: 'IST', name: 'Istanbul Intl',               city: 'Istanbul',      country: 'Turkey',      cityCode: 'IST' },
  { code: 'SAW', name: 'Sabiha Gökçen',               city: 'Istanbul',      country: 'Turkey',      cityCode: 'IST' },
  { code: 'KWI', name: 'Kuwait Intl',                 city: 'Kuwait City',   country: 'Kuwait',      cityCode: 'KWI' },
  { code: 'BAH', name: 'Bahrain Intl',                city: 'Bahrain',       country: 'Bahrain',     cityCode: 'BAH' },
  { code: 'MCT', name: 'Muscat Intl',                 city: 'Muscat',        country: 'Oman',        cityCode: 'MCT' },
  // ── Africa ──
  { code: 'CAI', name: 'Cairo Intl',                  city: 'Cairo',         country: 'Egypt',       cityCode: 'CAI' },
  { code: 'JNB', name: 'OR Tambo Intl',               city: 'Johannesburg',  country: 'South Africa',cityCode: 'JNB' },
  { code: 'CPT', name: 'Cape Town Intl',              city: 'Cape Town',     country: 'South Africa',cityCode: 'CPT' },
  { code: 'NBO', name: 'Jomo Kenyatta Intl',          city: 'Nairobi',       country: 'Kenya',       cityCode: 'NBO' },
  { code: 'ADD', name: 'Bole Intl',                   city: 'Addis Ababa',   country: 'Ethiopia',    cityCode: 'ADD' },
  { code: 'CMN', name: 'Mohammed V Intl',             city: 'Casablanca',    country: 'Morocco',     cityCode: 'CMN' },
  { code: 'LOS', name: 'Murtala Muhammed Intl',       city: 'Lagos',         country: 'Nigeria',     cityCode: 'LOS' },
  // ── Latin America ──
  { code: 'GRU', name: 'Guarulhos Intl',              city: 'São Paulo',     country: 'Brazil',      cityCode: 'SAO' },
  { code: 'CGH', name: 'Congonhas',                   city: 'São Paulo',     country: 'Brazil',      cityCode: 'SAO' },
  { code: 'GIG', name: 'Galeão Intl',                 city: 'Rio de Janeiro',country: 'Brazil',      cityCode: 'RIO' },
  { code: 'SDU', name: 'Santos Dumont',               city: 'Rio de Janeiro',country: 'Brazil',      cityCode: 'RIO' },
  { code: 'EZE', name: 'Ezeiza Intl',                 city: 'Buenos Aires',  country: 'Argentina',   cityCode: 'BUE' },
  { code: 'AEP', name: 'Jorge Newbery',               city: 'Buenos Aires',  country: 'Argentina',   cityCode: 'BUE' },
  { code: 'BOG', name: 'El Dorado Intl',              city: 'Bogotá',        country: 'Colombia',    cityCode: 'BOG' },
  { code: 'MEX', name: 'Benito Juárez Intl',          city: 'Mexico City',   country: 'Mexico',      cityCode: 'MEX' },
  { code: 'NLU', name: 'Felipe Ángeles Intl',         city: 'Mexico City',   country: 'Mexico',      cityCode: 'MEX' },
  { code: 'LIM', name: 'Jorge Chávez Intl',           city: 'Lima',          country: 'Peru',        cityCode: 'LIM' },
  { code: 'SCL', name: 'Arturo Merino Benítez',       city: 'Santiago',      country: 'Chile',       cityCode: 'SCL' },
  // ── South / SE Asia ──
  { code: 'KHI', name: 'Jinnah Intl',                 city: 'Karachi',       country: 'Pakistan',    cityCode: 'KHI' },
  { code: 'LHE', name: 'Allama Iqbal Intl',           city: 'Lahore',        country: 'Pakistan',    cityCode: 'LHE' },
  { code: 'ISB', name: 'Islamabad Intl',              city: 'Islamabad',     country: 'Pakistan',    cityCode: 'ISB' },
  { code: 'DAC', name: 'Hazrat Shahjalal Intl',       city: 'Dhaka',         country: 'Bangladesh',  cityCode: 'DAC' },
  { code: 'CMB', name: 'Bandaranaike Intl',           city: 'Colombo',       country: 'Sri Lanka',   cityCode: 'CMB' },
  { code: 'KTM', name: 'Tribhuvan Intl',              city: 'Kathmandu',     country: 'Nepal',       cityCode: 'KTM' },
  { code: 'MNL', name: 'Ninoy Aquino Intl',           city: 'Manila',        country: 'Philippines', cityCode: 'MNL' },
  { code: 'CEB', name: 'Mactan-Cebu Intl',            city: 'Cebu',          country: 'Philippines', cityCode: 'CEB' },
  { code: 'SGN', name: 'Tan Son Nhat Intl',           city: 'Ho Chi Minh',   country: 'Vietnam',     cityCode: 'SGN' },
  { code: 'HAN', name: 'Noi Bai Intl',                city: 'Hanoi',         country: 'Vietnam',     cityCode: 'HAN' },
  { code: 'RGN', name: 'Yangon Intl',                 city: 'Yangon',        country: 'Myanmar',     cityCode: 'RGN' },
  { code: 'BKK', name: 'Suvarnabhumi',                city: 'Bangkok',       country: 'Thailand',    cityCode: 'BKK' },
]

/** Build grouped city structure from flat airport list */
export function buildCityGroups(airports: Airport[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const ap of airports) {
    const key = ap.cityCode ?? ap.code
    if (!map.has(key)) {
      map.set(key, { cityCode: key, city: ap.city, country: ap.country, airports: [] })
    }
    // avoid duplicates
    const grp = map.get(key)!
    if (!grp.airports.find(a => a.code === ap.code)) {
      grp.airports.push(ap)
    }
  }
  return Array.from(map.values())
}

/** Search airports + return grouped results for the dropdown */
export function searchAirports(query: string, limit = 10): CityGroup[] {
  if (!query || query.length === 0) return []
  const q = query.toUpperCase().trim()
  const ql = query.toLowerCase().trim()

  const matched = AIRPORTS.filter(a =>
    a.code.startsWith(q) ||
    a.city.toLowerCase().startsWith(ql) ||
    a.city.toLowerCase().includes(ql) ||
    a.name.toLowerCase().includes(ql) ||
    a.country.toLowerCase().startsWith(ql) ||
    (a.cityCode && a.cityCode.startsWith(q))
  )

  // group matched airports by city
  const groups = buildCityGroups(matched)

  // total airport count cap
  let total = 0
  const capped: CityGroup[] = []
  for (const grp of groups) {
    if (total >= limit) break
    capped.push(grp)
    total += grp.airports.length
  }
  return capped
}

/** Find a single airport by IATA code */
export function findAirport(code: string): Airport | undefined {
  return AIRPORTS.find(a => a.code === code.toUpperCase())
}
