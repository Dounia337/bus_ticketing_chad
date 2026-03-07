const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phoneNumber: '+23566778899' },
    update: {},
    create: {
      fullName: 'Administrateur',
      phoneNumber: '+23566778899',
      email: 'admin@chadbusticketing.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.phoneNumber);
  
  // Create routes
  const routes = [
    { originCity: "N'Djamena", destinationCity: 'Moundou', basePrice: 15000, distance: 475, estimatedDuration: 480 },
    { originCity: "N'Djamena", destinationCity: 'Sarh', basePrice: 12000, distance: 585, estimatedDuration: 540 },
    { originCity: "N'Djamena", destinationCity: 'Abéché', basePrice: 18000, distance: 900, estimatedDuration: 720 },
    { originCity: 'Moundou', destinationCity: 'Sarh', basePrice: 8000, distance: 320, estimatedDuration: 300 },
  ];
  
  for (const route of routes) {
    await prisma.route.upsert({
      where: { originCity_destinationCity: { originCity: route.originCity, destinationCity: route.destinationCity } },
      update: {},
      create: route,
    });
  }
  console.log('✅ Routes created');
  
  // Create buses
  const buses = [
    { busNumber: 'BUS001', capacity: 40, plateNumber: 'TD-001-ND', condition: 'GOOD', model: 'Mercedes Sprinter' },
    { busNumber: 'BUS002', capacity: 35, plateNumber: 'TD-002-ND', condition: 'GOOD', model: 'Toyota Coaster' },
  ];
  
  for (const bus of buses) {
    const newBus = await prisma.bus.upsert({
      where: { busNumber: bus.busNumber },
      update: {},
      create: bus,
    });
    
    const existingSeats = await prisma.seat.count({ where: { busId: newBus.id } });
    if (existingSeats === 0) {
      const seats = Array.from({ length: bus.capacity }, (_, i) => ({ busId: newBus.id, seatNumber: i + 1 }));
      await prisma.seat.createMany({ data: seats });
    }
  }
  console.log('✅ Buses and seats created');
  
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
