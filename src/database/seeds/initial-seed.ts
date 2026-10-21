// npm run seed

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module.js';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity.js';
import { Role } from '../../roles/entities/role.entity.js';
import { AccountType } from '../../users/enums/account-type.enum.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting database seeding...');

  // 1. Create Platform Admin User
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@roomora.com' },
  });

  let adminUser: User;

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    adminUser = userRepository.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@roomora.com',
      password: hashedPassword,
      accountType: AccountType.PLATFORM_ADMIN,
    });
    adminUser = await userRepository.save(adminUser);
    console.log('✅ Platform Admin created successfully.');
  } else {
    adminUser = existingAdmin;
    console.log('ℹ️ Platform Admin already exists.');
  }

  // 2. Create Initial Hotel Roles (using adminUser.id as createdBy)
  const rolesData = [
    {
      name: 'Hotel Manager',
      description: 'إدارة بيانات الفندق والغرف والمستخدمين والأدوار، الاطلاع على جميع الحجوزات والمهام والفواتير والتقارير، ومتابعة أداء الموظفين.',
    },
    {
      name: 'Receptionist',
      description: 'إدارة بيانات النزالء والحجوزات، تسجيل الوصول والمغادرة، تسجيل طلبات النزالء والخدمات، وإضافة الرسوم والدفعات وفق الصلاحيات المحددة.',
    },
    {
      name: 'Housekeeping Staff',
      description: 'الاطلاع على مهام التنظيف المسندة إليه، ومعرفة الغرفة والملاحظات والأولوية، وتحديث حالة المهمة عند البدء والانتهاء.',
    },
    {
      name: 'Maintenance Staff',
      description: 'الاطلاع على مهام الصيانة المسندة إليه، وتسجيل تفاصيل المشكلة والإجراءات المنفذة، وتحديث حالة المهمة.',
    },
    {
      name: 'Service Staff',
      description: 'الاطلاع على طلبات الخدمات المسندة إليه، مثل طلبات المطعم أو الغسيل، وتحديث حالة الطلب، وتسجيل الخدمة المقدمة عند الحاجة.',
    },
  ];

  for (const roleInfo of rolesData) {
    const existingRole = await roleRepository.findOne({
      where: { name: roleInfo.name },
    });

    if (!existingRole) {
      const role = roleRepository.create({
        name: roleInfo.name,
        description: roleInfo.description,
        createdBy: adminUser.id, // ربطه بمدير المنصة كمنشئ للسجل
        updatedBy: adminUser.id,
      });
      await roleRepository.save(role);
      console.log(`✅ Role created: ${roleInfo.name}`);
    } else {
      console.log(`ℹ️ Role already exists: ${roleInfo.name}`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});