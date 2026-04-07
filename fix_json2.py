#!/usr/bin/env python3
import json

# Read the file
with open('frontend/src/data/recommendations.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We know the problem is at lines 569-574 (0-indexed: 568-573)
# The issue is missing "section" field and missing comma between array elements

# Let's rewrite just those lines
lines[568] = '      {\n'  # Line 569
lines[569] = '        "section": "Cataloguing Community Resources & Rescue Forces",\n'  # NEW
lines[570] = '        "fields": [\n'  # Line 571 adjusted for new indentation
lines[571] = '          "Details of the mechanism devised for cataloguing of community resources and rescue forces, which could be mobilised in times of need",\n'  # Added comma!
lines[572] = '          "Some instances of effective use of such catalogues"\n'  # Line 573
lines[573] = '        ]\n'  # Line 574
lines[574] = '      }\n'  # Line 575 - closing brace
lines[575] = '    ]\n'  # Line 576 - closing tableFields array
# line 576 should be },

# Write back
with open('frontend/src/data/recommendations.json', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed JSON by adding missing section and comma")

# Validate
with open('frontend/src/data/recommendations.json', 'r', encoding='utf-8') as f:
    content = f.read()

try:
    json.loads(content)
    print("✓ JSON is now valid!")
except json.JSONDecodeError as e:
    print(f"✗ Still has errors: {e}")
