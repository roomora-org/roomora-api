import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HotelsModule } from './hotels/hotels.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';
import { GuestsModule } from './guests/guests.module.js';
import { RoomTypesModule } from './room-types/room-types.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { FoliosModule } from './folios/folios.module.js';
import { ServicesModule } from './services/services.module.js';
import { FolioItemsModule } from './folio-items/folio-items.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { EmployeesModule } from './employees/employees.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT') ?? 5432),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),

        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    HotelsModule,
    RolesModule,
    UsersModule,
    GuestsModule,
    RoomTypesModule,
    RoomsModule,
    TasksModule,
    ReservationsModule,
    FoliosModule,
    ServicesModule,
    FolioItemsModule,
    InvoicesModule,
    EmployeesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
