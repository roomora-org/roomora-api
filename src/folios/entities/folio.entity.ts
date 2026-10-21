import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { Reservation } from '../../reservations/entities/reservation.entity.js';
import { FolioStatus } from '../enums/folio-status.enum.js';
import { FolioItem } from '../../folio-items/entities/folio-item.entity.js';
import { Invoice } from '../../invoices/entities/invoice.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';

@Entity({ name: 'folios' })
export class Folio extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'reservation_id', type: 'uuid', unique: true })
  reservationId: string;

  @ManyToOne(() => Reservation, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column({
    name: 'folio_status',
    type: 'enum',
    enum: FolioStatus,
    enumName: 'folio_status_enum',
    default: FolioStatus.OPEN,
  })
  status: FolioStatus;

  @Column({
    name: 'opened_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'created_by_employee_id', type: 'uuid' })
  createdByEmployeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'created_by_employee_id' })
  createdByEmployee: Employee;

  @Column({ name: 'closed_by_employee_id', type: 'uuid', nullable: true })
  closedByEmployeeId: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'closed_by_employee_id' })
  closedByEmployee: Employee | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => FolioItem, (item) => item.folio)
  items: Relation<FolioItem[]>;

  @OneToOne(() => Invoice, (invoice) => invoice.folio)
  invoice: Relation<Invoice>;
}
