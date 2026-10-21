import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
