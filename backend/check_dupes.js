const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const unionTerritories = [
  'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const organizations = [
  'AAI', 'Assam Rifles', 'BCAS', 'BPR&D', 'BSF', 'CAPFs', 'CAPFs/CPOs',
  'CBDT', 'CBI', 'CISF', 'CPOs', 'DGs of CAPFs/CPOs', 'ED', 'FIU-IND',
  'FS CD & HG', 'I4C', 'IB', 'ITBP', 'NATGRID', 'NCB', 'NCRB', 'NDRF',
  'NFSU', 'NIA', 'NTRO', 'R&AW', 'SSB', 'SVPNPA'
];

const ministries = [
  'MEA', 'MHA', 'MOD', 'MoF', 'MORTH', 'MeitY',
  'Ministry of Corporate Affairs', 'Ministry of Education',
  'Ministry of Finance', 'Ministry of Health & Family Welfare',
  'Ministry of I&B', 'Ministry of Labour', 'Ministry of Law & Justice',
  'Ministry of Ports, Shipping & Waterways',
  'Ministry of Social Justice & Empowerment', 'Ministry of Tourism',
  'Ministry of Tribal Affairs', 'Ministry of Women & Child Development',
  'Ministry of Youth Affairs & Sports'
];

const allEntities = [
  ...states,
  ...unionTerritories,
  ...organizations,
  ...ministries
];

const duplicates = allEntities.filter((item, index) => allEntities.indexOf(item) !== index);
console.log('Duplicates in allEntities:', duplicates);
console.log('Total entities:', allEntities.length);
