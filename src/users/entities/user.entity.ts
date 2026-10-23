import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import {AccountType} from "../enums/account-type.enum.js";
import {Employee} from "../../employees/entities/employee.entity.js";

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar' })
  password: string;

  @Column({
    name: 'account_type',
    type: 'enum',
    enum: AccountType,
    enumName: 'account_type_enum',
  })
  accountType: AccountType;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @OneToOne(() => Employee, (employee) => employee.user)
  employee: Relation<Employee> | null;
}
