import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  type Relation,
} from 'typeorm';

import { HotelStatus } from '../enums/hotel-status.enum.js';
import { BaseEntity } from '../../common/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity({ name: 'hotels' })
export class Hotel extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ name: 'alternative_phone', type: 'varchar', nullable: true })
  alternativePhone: string | null;

  @Column({ type: 'varchar' })
  country: string;

  @Column({ type: 'varchar' })
  city: string;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ name: 'postal_code', type: 'varchar', nullable: true })
  postalCode: string | null;

  @Column({ name: 'logo_url', type: 'text' })
  logoUrl: string;

  @Column({ name: 'star_rating', type: 'integer', nullable: true })
  starRating: number | null;

  @Column({
    name: 'time_zone',
    type: 'varchar',
    default: 'UTC',
  })
  timeZone: string;

  @Column({ name: 'check_in_time', type: 'time', default: '14:00' })
  checkInTime: string;

  @Column({ name: 'check_out_time', type: 'time', default: '12:00' })
  checkOutTime: string;

  @Column({
    name: 'hotel_status',
    type: 'enum',
    enum: HotelStatus,
    enumName: 'hotel_status_enum',
    default: HotelStatus.PENDING,
  })
  status: HotelStatus;

  @OneToMany(() => User, (user) => user.hotel)
  employees: Relation<User[]>;
}
