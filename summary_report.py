import json

with open('frontend/src/data/recommendations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Categorize records
with_tablefields = []
without_tablefields = []

for record in data:
    rec_id = record.get('id')
    if 'tableFields' in record and record['tableFields']:
        # Check if it has "Related photos/videos"
        has_related_photos = any(
            field.get('section') == 'Related photos/videos' 
            for field in record['tableFields']
        )
        if not has_related_photos:
            last_field = record['tableFields'][-1]
            with_tablefields.append({
                'id': rec_id,
                'last_section': last_field.get('section')
            })
    else:
        without_tablefields.append(rec_id)

print('RECORDS MISSING "Related photos/videos" FIELD')
print('='*80)
print()
print(f'SUMMARY:')
print(f'  - Total records: {len(data)}')
print(f'  - Records with tableFields but missing the field: {len(with_tablefields)}')
print(f'  - Records without tableFields: {len(without_tablefields)}')
print(f'  - TOTAL MISSING THE FIELD: {len(with_tablefields) + len(without_tablefields)}')
print()
print('='*80)
print('CATEGORY A: Records with tableFields (need field added after last section)')
print('='*80)
print()
for item in with_tablefields:
    print(f"Record ID {item['id']:3d} | Last section: {item['last_section']}")
    print(f"                | Closing brace: " + '      },')
    print()

print('='*80)
print('CATEGORY B: Records without tableFields (need entire tableFields added)')
print('='*80)
print()
print('Record IDs: ' + ', '.join(map(str, without_tablefields)))
print()

print('='*80)
print('QUICK REFERENCE - Record IDs needing the field:')
print('='*80)
all_missing = sorted([item['id'] for item in with_tablefields] + without_tablefields)
print(str(all_missing))
