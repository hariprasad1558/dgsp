const bcrypt = require('bcrypt');
bcrypt.hash('Test@1234', 10).then(console.log);