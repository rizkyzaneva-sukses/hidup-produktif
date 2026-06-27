import { PrismaClient } from '@prisma/client';
import { scryptSync } from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();
const SALT = 'hp-berkah-2025';

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('⏭️  User sudah ada, seed dilewati.');
    return;
  }

  const username = process.env.SEED_USERNAME || 'admin';
  const password = process.env.SEED_PASSWORD || 'changeme123';
  const nama = process.env.SEED_NAME || 'Admin';

  const passwordHash = scryptSync(password, SALT, 64).toString('hex');

  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase().trim(),
      passwordHash,
      nama,
    },
  });

  console.log(`✅ User default dibuat: ${user.username}`);
  console.log(`   Password: ${password}`);
  console.log('   ⚠️  Segera ganti password setelah login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
