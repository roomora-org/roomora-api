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
import { Service } from '../../services/entities/service.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';

@Entity({ name: 'folio_items' })
export class FolioItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'folio_id', type: 'uuid' })
  folioId: string;

  @ManyToOne(() => Folio, (folio) => folio.items, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'folio_id' })
  folio: Relation<Folio>;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId: string | null;

  @ManyToOne(() => Service, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'service_id' })
  service: Service | null;

  @Column({ name: 'service_name', type: 'varchar' })
  serviceName: string; // اسم الخدمة أو البند (مثل سعر الغرفة أو وجبة)

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1,
  })
  quantity: number;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unitPrice: number;

  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalPrice: number; // (quantity * unit_price)

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'voided_at', type: 'timestamptz', nullable: true })
  voidedAt: Date | null;

  @Column({ name: 'voided_by_employee_id', type: 'uuid', nullable: true })
  voidedByEmployeeId: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'voided_by_employee_id' })
  voidedByEmployee: Employee | null;

  @Column({ name: 'void_reason', type: 'text', nullable: true })
  voidReason: string | null;
}
