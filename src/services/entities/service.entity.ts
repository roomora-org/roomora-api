import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';

@Entity({ name: 'services' })
export class Service extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'default_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  defaultPrice: number;
}
