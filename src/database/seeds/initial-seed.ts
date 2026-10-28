import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module.js';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity.js';
import { Role } from '../../roles/entities/role.entity.js';
import { AccountType } from '../../users/enums/account-type.enum.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { HotelStatus } from '../../hotels/enums/hotel-status.enum.js';
import { Employee } from '../../employees/entities/employee.entity.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting database seeding...');

  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);
  const hotelRepository = dataSource.getRepository(Hotel);
  const employeeRepository = dataSource.getRepository(Employee);

  // ==========================================
  // 1. Create Roles
  // ==========================================
  const rolesData = [
    { name: 'Hotel Manager', description: 'Hotel Manager / Owner' },
    { name: 'Receptionist', description: 'Front Desk Staff' },
    { name: 'Housekeeping Staff', description: 'Cleaning Staff' },
    { name: 'Maintenance Staff', description: 'Maintenance Staff' },
    { name: 'Service Staff', description: 'Service / Amenities Staff' },
  ];

  const roles: Record<string, Role> = {};

  for (const roleInfo of rolesData) {
    let role = await roleRepository.findOne({ where: { name: roleInfo.name } });
    if (!role) {
      role = roleRepository.create(roleInfo);
      await roleRepository.save(role);
      console.log(`✅ Role created: ${roleInfo.name}`);
    } else {
      console.log(`ℹ️ Role already exists: ${roleInfo.name}`);
    }
    roles[roleInfo.name] = role;
  }

  // ==========================================
  // 2. Create Platform Admin
  // ==========================================
  const adminEmail = 'admin@roomora.com';
  let adminUser = await userRepository.findOne({ where: { email: adminEmail } });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    adminUser = userRepository.create({
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      accountType: AccountType.PLATFORM_ADMIN,
      emailVerifiedAt: new Date(),
    });
    await userRepository.save(adminUser);
    console.log('✅ Platform Admin created.');
  } else {
    console.log('ℹ️ Platform Admin already exists.');
  }

  // ==========================================
  // 3. Create Demo Hotel
  // ==========================================
  const hotelEmail = 'contact@grandpalace.com';
  let demoHotel = await hotelRepository.findOne({ where: { email: hotelEmail } });

  if (!demoHotel) {
    demoHotel = hotelRepository.create({
      name: 'Grand Palace Hotel',
      slug: 'grand-palace-hotel',
      description: 'A luxury 5-star hotel in the heart of the city.',
      email: hotelEmail,
      phone: '+970 2 123 4567',
      country: 'Palestine',
      city: 'Ramallah',
      address: '123 Main Street, Ramallah',
      logoUrl: 'https://via.placeholder.com/150',
      starRating: 5,
      timeZone: 'Asia/Hebron',
      checkInTime: '14:00',
      checkOutTime: '12:00',
      status: HotelStatus.ACTIVE,
    });
    await hotelRepository.save(demoHotel);
    console.log('✅ Demo Hotel created.');
  } else {
    console.log('ℹ️ Demo Hotel already exists.');
  }

  // ==========================================
  // 4. Create Demo Users + Employees
  // ==========================================
  const demoPassword = await bcrypt.hash('password123', 10);

  const demoUsers = [
    {
      firstName: 'Hasan',
      lastName: 'Manager',
      email: 'manager@roomora.com',
      roleName: 'Hotel Manager',
    },
    {
      firstName: 'Rana',
      lastName: 'Receptionist',
      email: 'receptionist@roomora.com',
      roleName: 'Receptionist',
    },
    {
      firstName: 'Khalid',
      lastName: 'Housekeeping',
      email: 'housekeeping@roomora.com',
      roleName: 'Housekeeping Staff',
    },
    {
      firstName: 'Omar',
      lastName: 'Maintenance',
      email: 'maintenance@roomora.com',
      roleName: 'Maintenance Staff',
    },
    {
      firstName: 'Layla',
      lastName: 'Service',
      email: 'service@roomora.com',
      roleName: 'Service Staff',
    },
  ];

  for (const demo of demoUsers) {
    let user = await userRepository.findOne({ where: { email: demo.email } });

    if (!user) {
      user = userRepository.create({
        firstName: demo.firstName,
        lastName: demo.lastName,
        email: demo.email,
        password: demoPassword,
        accountType: AccountType.HOTEL_EMPLOYEE,
        emailVerifiedAt: new Date(),
      });
      await userRepository.save(user);
      console.log(`✅ User created: ${demo.email}`);
    } else {
      console.log(`ℹ️ User already exists: ${demo.email}`);
    }

    // Create Employee
    const existingEmployee = await employeeRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (!existingEmployee && demoHotel) {
      const role = roles[demo.roleName];
      if (!role) {
        console.error(`❌ Role not found: ${demo.roleName}`);
        continue;
      }

      const employee = employeeRepository.create({
        userId: user.id,
        hotelId: demoHotel.id,
        roleId: role.id,
      });
      await employeeRepository.save(employee);
      console.log(`✅ Employee created: ${demo.email} (${demo.roleName})`);
    } else {
      console.log(`ℹ️ Employee already exists for: ${demo.email}`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('   Platform Admin: admin@roomora.com / Admin@123456');
  console.log('   Hotel Manager:  manager@roomora.com / password123');
  console.log('   Receptionist:   receptionist@roomora.com / password123');
  console.log('   Housekeeping:   housekeeping@roomora.com / password123');
  console.log('   Maintenance:    maintenance@roomora.com / password123');
  console.log('   Service:        service@roomora.com / password123');

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});