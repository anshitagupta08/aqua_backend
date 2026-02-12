import request from 'supertest';
import app from '../../src/index';

export async function loginAndGetCookie() {
  const user = {
    EmployeeId: '10000000',
    name: 'admin',
    email: 'admin@admin.com',
    password: 'admin@123',
  };

  // Register the user first
  await request(app)
    .post('/api/user/signup') // or whatever your endpoint is
    .send(user);

  // Now login
  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ EmployeeId: user.EmployeeId, password: user.password });

  if (loginRes.status !== 200) {
    console.error('Login response:', loginRes.body);
    throw new Error('Login failed in test setup');
  }

  return loginRes.headers['set-cookie']; // returns array of cookies
}
