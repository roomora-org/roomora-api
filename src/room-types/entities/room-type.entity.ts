import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { RoomTypeEnum } from '../enums/room-type.enum.js';

@Entity({ name: 'room_types' })
export class RoomType extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({
    name: 'room_type',
    type: 'enum',
    enum: RoomTypeEnum,
    enumName: 'room_type_enum',
    default: RoomTypeEnum.SINGLE,
  })
  type: RoomTypeEnum;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer' })
  capacity: number;

  @Column({
    name: 'price_per_night',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  pricePerNight: number;
}
