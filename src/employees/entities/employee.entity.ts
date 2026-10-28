import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { Role } from '../../roles/entities/role.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity({ name: 'employees' })
export class Employee extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.employee, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: Relation<User>;

  // Hotel is nullable: a newly-registered manager has no hotel until onboarding.
  @Column({ name: 'hotel_id', type: 'uuid', nullable: true })
  hotelId: string | null;

  @ManyToOne(() => Hotel, (hotel) => hotel.employees, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'hotel_id', referencedColumnName: 'id' })
  hotel: Relation<Hotel> | null;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.employees, { nullable: false })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Relation<Role>;

  @Column({ name: 'invited_by_user_id', type: 'uuid', nullable: true })
  invitedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'invited_by_user_id',
    referencedColumnName: 'id',
  })
  invitedBy: Relation<User> | null;

  @Column({ name: 'invited_at', type: 'timestamptz', nullable: true })
  invitedAt: Date | null;
}