const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.setting.upsert({
    where: { key: 'hero_image' },
    update: { value: '/hero/dermadental-hero.png' },
    create: { key: 'hero_image', value: '/hero/dermadental-hero.png' },
  });
  console.log("Updated Setting hero_image in database:", result);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
