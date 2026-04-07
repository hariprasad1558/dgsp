const axios = require('axios');

async function mockUpdate() {
  const payload = {
    status: 'In Progress',
    details: 'Last updated by: Antigravity (Mock)',
    data: {
      formData: {},
      filesMeta: {
        doc_0: 'mock_word.docx',
        doc_1: ['photo1.jpg', 'photo2.jpg'],
        doc_2: 'mock_signed.pdf'
      },
      tableEntries: [{ some: 'data' }],
      updatedAt: new Date().toISOString()
    },
    last_updated_by: 'Antigravity'
  };

  try {
    const res = await axios.post('http://localhost:5000/api/recs/update/3', payload);
    console.log('Update result:', res.data);
    
    // Check stats
    const statsRes = await axios.get('http://localhost:5000/api/recs/stats');
    const rec3 = statsRes.data.list.find(r => r.id === 3);
    console.log('Recommendation 3 in stats:', JSON.stringify(rec3, null, 2));
    
    // Verify hasFiles logic (from AdminDashboard.jsx)
    const rec = rec3;
    const hasFiles = rec.data && rec.data.filesMeta && Object.values(rec.data.filesMeta).some(v => v && (Array.isArray(v) ? v.length > 0 : true));
    console.log('hasFiles verification:', hasFiles);
    
  } catch (err) {
    console.error('Mock update failed:', err.message);
  }
}

mockUpdate();
