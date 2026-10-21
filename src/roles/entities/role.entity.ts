import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Employee } from '../../employees/entities/employee.entity.js';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Employee, (employee) => employee.role)
  employees: Relation<Employee[]>;
}
