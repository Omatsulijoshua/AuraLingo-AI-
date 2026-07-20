const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const audios = await prisma.listeningAudio.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('--- RECENT LISTENING AUDIOS ---');
  for (const a of audios) {
    console.log(`ID: ${a.id}`);
    console.log(`Title: ${a.title}`);
    console.log(`Audio URL: ${a.audioUrl}`);
    console.log(`Transcript Length: ${a.transcript ? a.transcript.length : 0}`);
    console.log('------------------------------');
  }

  const settings = await prisma.appSettings.findMany();
  console.log('--- APP SETTINGS ---');
  for (const s of settings) {
    if (s.key.includes('openai')) {
      console.log(`Key: ${s.key}, Value Length: ${s.value ? s.value.length : 0}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
