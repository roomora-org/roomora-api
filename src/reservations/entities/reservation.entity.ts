import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { Guest } from '../../guests/entities/guest.entity.js';
import { Room } from '../../rooms/entities/room.entity.js';
import { ReservationStatus } from '../enums/reservation-status.enum.js';

@Entity({ name: 'reservations' })
export class Reservation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'guest_id', type: 'uuid' })
  guestId: string;

  @ManyToOne(() => Guest, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'check_in_date', type: 'date' })
  checkInDate: Date;

  @Column({ name: 'check_out_date', type: 'date' })
  checkOutDate: Date;

  @Column({ name: 'adults_count', type: 'integer', default: 1 })
  adultsCount: number;

  @Column({ name: 'children_count', type: 'integer', default: 0 })
  childrenCount: number;

  @Column({
    name: 'reservation_status',
    type: 'enum',
    enum: ReservationStatus,
    enumName: 'reservation_status_enum',
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  specialRequests: string | null;

  @Column({
    name: 'total_room_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalRoomPrice: number;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;
}
