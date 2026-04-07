import json

with open('frontend/src/data/recommendations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

missing_records = []

for record in data:
    rec_id = record.get('id')
    has_related_photos = False
    last_section = None
    last_fields = None
    
    if 'tableFields' in record:
        for field in record['tableFields']:
            section = field.get('section')
            if section == 'Related photos/videos':
                has_related_photos = True
                break
            last_section = section
            last_fields = field.get('fields', [])
    
    if not has_related_photos:
        missing_records.append({
            'id': rec_id,
            'last_section': last_section,
            'last_fields': last_fields
        })

print(f'Total records: {len(data)}')
print(f'Records missing "Related photos/videos": {len(missing_records)}')
print()
print('=' * 120)
print('Record IDs missing the field:')
print('=' * 120)
for item in missing_records:
    record_id = item['id']
    last_section = item['last_section']
    last_fields = item['last_fields']
    
    print(f'\nRecord ID: {record_id}')
    print(f'  Last section: "{last_section}"')
    if last_fields:
        print(f'  Last fields in section: {last_fields}')
        # Show what the closing brace would look like
        print(f'  Closing brace structure:')
        print(f'        }},')
    
print()
print('=' * 120)
print(f'Summary: {len(missing_records)} records need the "Related photos/videos" field added')
print('=' * 120)
