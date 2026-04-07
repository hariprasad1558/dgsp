const fs = require('fs-extra');
const path = require('path');

const test = async () => {
  try {
    const filePath = path.join(__dirname, 'frontend/src/data/recommendations.json');
    console.log('Target path:', filePath);
    const fileData = await fs.readFile(filePath, 'utf8');
    const recommendations = JSON.parse(fileData);
    console.log('Read count:', recommendations.length);
    
    const maxId = recommendations.reduce((max, r) => Math.max(max, r.id || 0), 0);
    const maxRecNo = recommendations.reduce((max, r) => Math.max(max, parseInt(r.recNo) || 0), 0);
    console.log('Max ID:', maxId, 'Max RecNo:', maxRecNo);
    
    const newRec = {
      id: maxId + 1,
      recNo: (maxRecNo + 1).toString(),
      recommendation: 'Test recommendation',
      actionedBy: 'Test officer',
      category: 'Immediately Actionable',
      documentFields: []
    };
    
    recommendations.push(newRec);
    console.log('New count after push:', recommendations.length);
    // Not writing to real file yet
  } catch (err) {
    console.error('ERROR:', err);
  }
};

test();
