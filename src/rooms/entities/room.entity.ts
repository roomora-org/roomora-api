import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { RoomType } from '../../room-types/entities/room-type.entity.js';
import { OccupancyStatus } from '../enums/occupancy-status.enum.js';
import { CleaningStatus } from '../enums/cleaning-status.enum.js';
import { MaintenanceStatus } from '../enums/maintenance-status.js';

@Entity({ name: 'rooms' })
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'room_type_id', type: 'uuid' })
  roomTypeId: string;

  @ManyToOne(() => RoomType, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType;

  @Column({ name: 'room_number', type: 'varchar' })
  roomNumber: string;

  @Column({ name: 'floor_number', type: 'integer' })
  floorNumber: number;

  @Column({
    name: 'occupancy_status',
    type: 'enum',
    enum: OccupancyStatus,
    enumName: 'occupancy_status_enum',
    default: OccupancyStatus.VACANT,
  })
  occupancyStatus: OccupancyStatus;

  @Column({
    name: 'cleaning_status',
    type: 'enum',
    enum: CleaningStatus,
    enumName: 'cleaning_status_enum',
    default: CleaningStatus.DIRTY,
  })
  cleaningStatus: CleaningStatus;

  @Column({
    name: 'maintenance_status',
    type: 'enum',
    enum: MaintenanceStatus,
    enumName: 'maintenance_status_enum',
    default: MaintenanceStatus.NORMAL,
  })
  maintenanceStatus: MaintenanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
