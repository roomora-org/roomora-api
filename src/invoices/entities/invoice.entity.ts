import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { Folio } from '../../folios/entities/folio.entity.js';
import { Guest } from '../../guests/entities/guest.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { InvoiceStatus } from '../enums/invoice-status.enum.js';

@Entity({ name: 'invoices' })
export class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'folio_id', type: 'uuid', unique: true })
  folioId: string;

  @ManyToOne(() => Folio, (folio) => folio.invoice, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'folio_id' })
  folio: Relation<Folio>;

  @Column({ name: 'guest_id', type: 'uuid' })
  guestId: string;

  @ManyToOne(() => Guest, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @Column({ name: 'invoice_number', type: 'varchar', unique: true })
  invoiceNumber: string; // الرقم التسلسلي للفاتورة

  @Column({
    name: 'invoice_status',
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'invoice_status_enum',
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalAmount: number; // إجمالي المبلغ المطلوب دفعه

  @Column({ name: 'issued_at', type: 'timestamptz', nullable: true })
  issuedAt: Date | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'paid_by_user_id', type: 'uuid', nullable: true })
  paidByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'paid_by_user_id' })
  paidByUser: User | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;
}
