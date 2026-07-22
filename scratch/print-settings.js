const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.setting.findMany();
  console.log("Database Settings:", settings);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
