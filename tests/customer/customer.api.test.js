import request from 'supertest';
import app from '../../src/index';
import { Customer } from '../../src/models';
import { loginAndGetCookie } from '../helpers/loginAndGetCookie';

const uniqueSuffix = Date.now();
const testCustomer = {
  name: 'Sagar Dhaba',
  email: `sagardhaba+${uniqueSuffix}@example.com`,
  phone: `99999${Math.floor(10000 + Math.random() * 89999)}`,
  address: 'Plot 45, NH-24, Ghaziabad',
  isActive: true,
};

let cookie: string | string[];
let createdCustomerId: string | undefined;

beforeAll(async () => {
  cookie = await loginAndGetCookie();
  // Seed a customer
  const customer = await Customer.create(testCustomer);
  createdCustomerId = customer.id;
});

afterAll(async () => {
  // Clean up test customer
  if (createdCustomerId) {
    await Customer.destroy({ where: { id: createdCustomerId } });
  }
});

describe('GET /api/customer/customers', () => {
  it('should return paginated list of customers with totalOrders and totalSpent', async () => {
    const response = await request(app)
      .get('/api/customer/customers')
      .set('Cookie', Array.isArray(cookie) ? cookie.join('; ') : cookie)
      .query({ page: 1, limit: 10 })
      .expect(200);
    if (response.status !== 200) {
      console.error('Response body:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('customers');
    expect(Array.isArray(response.body.data.customers)).toBe(true);

    const customer = response.body.data.customers[0];
    if (customer) {
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('totalOrders');
      expect(customer).toHaveProperty('totalSpent');
    }

    expect(response.body.data).toHaveProperty('pagination');
    expect(response.body.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
    });
  });
});
