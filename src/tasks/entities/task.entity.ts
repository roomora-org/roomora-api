import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity.js';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { Room } from '../../rooms/entities/room.entity.js';
import {
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskSource,
} from '../enums/task.enum.js';
import { Employee } from '../../employees/entities/employee.entity.js';

@Entity({ name: 'tasks' })
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  hotelId: string;

  @ManyToOne(() => Hotel, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'assigned_to_user_id', type: 'uuid' })
  assignedToUserId: string;

  @ManyToOne(() => Employee, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'assigned_to_employee_id' })
  assignedToEmployee: Employee;

  @Column({
    type: 'enum',
    enum: TaskType,
    enumName: 'task_type_enum',
  })
  taskType: TaskType;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'task_priority',
    type: 'enum',
    enum: TaskPriority,
    enumName: 'task_priority_enum',
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    name: 'task_status',
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status_enum',
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    name: 'task_source',
    type: 'enum',
    enum: TaskSource,
    enumName: 'task_source_enum',
  })
  source: TaskSource;

  @Column({ name: 'due_at', type: 'timestamptz' })
  dueAt: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'completion_notes', type: 'text', nullable: true })
  completionNotes: string | null;
}
