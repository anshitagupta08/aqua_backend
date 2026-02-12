import { sequelize } from '../src/configs/sequelize'; // Adjust if needed

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
