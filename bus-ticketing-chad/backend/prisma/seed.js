const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Seed script to populate the database with initial data for Chad bus system
 * Run with: npx prisma db seed
 */
async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  console.log('🗑️  Clearing existing data...');
  await prisma.payment.deleteMany();
  await prisma.luggage.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.route.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      fullName: 'Administrateur Système',
      phoneNumber: '+23599999999',
      email: 'admin@buschad.com',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create sample user
  const userPassword = await bcrypt.hash('User123!', 10);
  const user = await prisma.user.create({
    data: {
      fullName: 'Jean Dupont',
      phoneNumber: '+23566666666',
      email: 'jean.dupont@example.com',
      password: userPassword,
      role: 'USER',
      isVerified: true,
    },
  });
  console.log(`✅ User created: ${user.email}`);

  // Create major routes in Chad
  console.log('🛣️  Creating routes...');
  const routes = [
    { origin: "N'Djamena", destination: 'Moundou', price: 15000, distance: 466 },
    { origin: "N'Djamena", destination: 'Abéché', price: 20000, distance: 850 },
    { origin: "N'Djamena", destination: 'Sarh', price: 18000, distance: 652 },
    { origin: 'Moundou', destination: 'Sarh', price: 10000, distance: 332 },
    { origin: "N'Djamena", destination: 'Bongor', price: 12000, distance: 285 },
    { origin: "N'Djamena", destination: 'Bol', price: 16000, distance: 325 },
  ];

  const createdRoutes = [];
  for (const route of routes) {
    const r = await prisma.route.create({
      data: {
        originCity: route.origin,
        destinationCity: route.destination,
        basePrice: route.price,
        distance: route.distance,
        active: true,
      },
    });
    createdRoutes.push(r);
    console.log(`  ✓ Route: ${r.originCity} → ${r.destinationCity} (${r.basePrice} FCFA)`);
  }

  // Create buses
  console.log('🚌 Creating buses...');
  const buses = [
    { number: 'BUS-001', capacity: 45, model: 'Mercedes Benz O500R', year: 2020 },
    { number: 'BUS-002', capacity: 40, model: 'Yutong ZK6100H', year: 2019 },
    { number: 'BUS-003', capacity: 50, model: 'Higer KLQ6129Q', year: 2021 },
    { number: 'BUS-004', capacity: 35, model: 'Toyota Coaster', year: 2018 },
    { number: 'BUS-005', capacity: 45, model: 'Mercedes Benz O500R', year: 2022 },
  ];

  const createdBuses = [];
  for (const bus of buses) {
    const b = await prisma.bus.create({
      data: {
        busNumber: bus.number,
        capacity: bus.capacity,
        status: 'AVAILABLE',
        condition: 'GOOD',
        plateNumber: `TD-${Math.floor(Math.random() * 10000)}`,
        model: bus.model,
        year: bus.year,
      },
    });
    createdBuses.push(b);
    console.log(`  ✓ Bus: ${b.busNumber} (${b.capacity} seats)`);

    // Create seats for each bus
    const seatPromises = [];
    // Create seats in format: A1-A5, B1-B5, etc.
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    let seatCount = 0;
    for (const row of rows) {
      for (let col = 1; col <= 5; col++) {
        if (seatCount >= bus.capacity) break;
        seatPromises.push(
          prisma.seat.create({
            data: {
              busId: b.id,
              seatNumber: `${row}${col}`,
              isBooked: false,
            },
          })
        );
        seatCount++;
      }
      if (seatCount >= bus.capacity) break;
    }
    await Promise.all(seatPromises);
  }

  // Create trips for the next 7 days
  console.log('🗓️  Creating trips...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 0; day < 7; day++) {
    const departureDate = new Date(today);
    departureDate.setDate(today.getDate() + day);

    // Create 2 trips per day for the first route (N'Djamena to Moundou)
    const morningTrip = await prisma.trip.create({
      data: {
        routeId: createdRoutes[0].id,
        busId: createdBuses[0].id,
        departureDate: departureDate,
        departureTime: '06:00',
        arrivalTime: '13:00',
        availableSeats: createdBuses[0].capacity,
        status: day === 0 ? 'BOARDING' : 'SCHEDULED',
      },
    });

    const eveningTrip = await prisma.trip.create({
      data: {
        routeId: createdRoutes[0].id,
        busId: createdBuses[1].id,
        departureDate: departureDate,
        departureTime: '14:00',
        arrivalTime: '21:00',
        availableSeats: createdBuses[1].capacity,
        status: 'SCHEDULED',
      },
    });

    // Create trips for N'Djamena to Abéché
    await prisma.trip.create({
      data: {
        routeId: createdRoutes[1].id,
        busId: createdBuses[2].id,
        departureDate: departureDate,
        departureTime: '05:00',
        arrivalTime: '17:00',
        availableSeats: createdBuses[2].capacity,
        status: 'SCHEDULED',
      },
    });

    if (day === 0) {
      console.log(`  ✓ Day ${day + 1}: ${departureDate.toLocaleDateString('fr-FR')}`);
    }
  }
  console.log(`  ✓ Created trips for 7 days`);

  // System configuration
  console.log('⚙️  Setting system configuration...');
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'DEFAULT_FREE_LUGGAGE_KG',
        value: '20',
        description: 'Poids gratuit des bagages par défaut (kg)',
      },
      {
        key: 'EXTRA_LUGGAGE_FEE_PER_KG',
        value: '500',
        description: 'Frais supplémentaires par kg de bagage (FCFA)',
      },
      {
        key: 'MAX_LUGGAGE_PER_PASSENGER',
        value: '3',
        description: 'Nombre maximum de bagages par passager',
      },
      {
        key: 'BOOKING_EXPIRY_HOURS',
        value: '24',
        description: 'Heures avant expiration des réservations non payées',
      },
    ],
  });
  console.log('  ✓ System config set');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • Users: ${await prisma.user.count()}`);
  console.log(`   • Routes: ${await prisma.route.count()}`);
  console.log(`   • Buses: ${await prisma.bus.count()}`);
  console.log(`   • Seats: ${await prisma.seat.count()}`);
  console.log(`   • Trips: ${await prisma.trip.count()}`);
  console.log(`   • System Config: ${await prisma.systemConfig.count()}`);
  console.log('\n🔐 Admin credentials:');
  console.log('   Email: admin@buschad.com');
  console.log('   Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
