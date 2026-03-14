const http = require('http');

const testLogin = () => {
  const data = JSON.stringify({
    email: 'nimal.perera@elderease.lk',
    password: 'password123'
  });

  const options = {
    hostname: '192.168.1.3',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('Testing login to http://192.168.1.3:3001/api/auth/login');
  
  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', body);
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.write(data);
  req.end();
};

testLogin();
