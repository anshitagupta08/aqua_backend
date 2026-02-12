import request from 'supertest';
import app from '../../src/index';
import { Employee } from '../../src/models'; // Adjust path as needed

// Generate unique test user
const uniqueSuffix = Date.now();
const testUser = {
  name: 'tester',
  email: `tester+${uniqueSuffix}@tester.com`,
  password: 'tester@123',
  EmployeeId: `1000${uniqueSuffix}`,
  role: 'admin',
};

describe('Employee Auth API', () => {
  afterAll(async () => {
    // Clean up test user
    await Employee.destroy({ where: { email: testUser.email } });
  });

  it('should signup a new user', async () => {
    const res = await request(app).post('/api/user/signup').send(testUser).expect(201);

    expect(res.body).toHaveProperty('message', 'Employee created');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('should not signup a user with duplicate EmployeeId', async () => {
    const res = await request(app).post('/api/user/signup').send(testUser).expect(400);

    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({
        EmployeeId: testUser.EmployeeId,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body.user).toHaveProperty('EmployeeId', testUser.EmployeeId);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({
        EmployeeId: testUser.EmployeeId,
        password: 'wrongpassword',
      })
      .expect(401);

    expect(res.body.message).toMatch(/invalid/i);
  });

  it('should logout and clear cookie', async () => {
    const res = await request(app).post('/api/user/logout').expect(200);

    expect(res.body).toHaveProperty('message', 'Logged out successfully');
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/); // token is cleared
  });
});
