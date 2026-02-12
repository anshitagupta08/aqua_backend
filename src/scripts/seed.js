require('dotenv').config();
const { sequelize } = require('../configs/sequelize');
const {
  Employee,
  Customer,
  Product,
  Order,
  OrderItem,
  Feedback,
  Enquiry,
  Promotion,
} = require('../models');
async function seed() {
  try {
    await sequelize.sync({ force: true }); // WARNING: Drops and recreates all tables

    // Create Users (employees)
    const passwordHash = 'securepassword123'; // Replace with hashed password in real case
    const users = await Employee.bulkCreate([
      {
        EmployeeName: 'Ravi Sharma',
        EmployeeId: 10007845,
        EmployeePhone: '5641689845',
        EmployeeMailId: 'ravi@chickendelivery.com',
        EmployeePassword: passwordHash,
        EmployeeRoleID: 1,
        is_active: true,
      },
      {
        EmployeeName: 'Meena Rathi',
        EmployeeId: 10005896,
        EmployeePhone: '7891532145',
        EmployeeMailId: 'meena@chickendelivery.com',
        EmployeePassword: passwordHash,
        EmployeeRoleID: 1,
        is_active: true,
      },
    ]);

    // Create Customers
    const customers = await Customer.bulkCreate([
      {
        name: 'Sagar Dhaba',
        email: 'sagardhaba@example.com',
        phone: '9999912345',
        address: 'Plot 45, NH-24, Ghaziabad',
        isActive: true,
      },
      {
        name: 'Fresh Mart',
        email: 'freshmart@example.com',
        phone: '9876543210',
        address: 'Shop 12, Sector 21 Market, Noida',
        isActive: true,
      },
      {
        name: 'Rohit Sharma',
        email: 'rohitsharma@example.com',
        phone: '9123456780',
        address: 'Flat 4B, Green Residency, Lucknow',
        isActive: true,
      },
    ]);

    // Create Products
    const products = await Product.bulkCreate([
      {
        name: 'Raw Chicken - 1kg',
        description: 'Fresh, farm-raised chicken, cleaned and packed.',
        price: 220,
        isActive: true,
      },
      {
        name: 'Boneless Chicken - 500g',
        description: 'Boneless chicken breast pieces, hygienically packed.',
        price: 180,
        isActive: true,
      },
      {
        name: 'Chicken Sausages - 250g',
        description: 'Ready-to-cook chicken sausages.',
        price: 120,
        isActive: true,
      },
    ]);

    console.log('🐔 Seed data for Chicken Supply CRM created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
