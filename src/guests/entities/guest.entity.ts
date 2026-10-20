import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';

@Entity({ name: 'guests' })
export class Guest extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', nullable: true })
  nationality: string | null;

  @Column({ name: 'country_of_residence', type: 'varchar', nullable: true })
  countryOfResidence: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'passport_number', type: 'varchar', nullable: true, unique: true})
  passportNumber: string | null;
}
