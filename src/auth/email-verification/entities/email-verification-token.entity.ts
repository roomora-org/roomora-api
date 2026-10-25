
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

@Entity({ name: 'email_verification_tokens' })
@Index(
    'UQ_email_verification_tokens_token_hash',
    ['tokenHash'],
    { unique: true },
)
export class EmailVerificationToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'user_id',
        type: 'uuid',
    })
    userId: string;

    @ManyToOne(() => User, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;

    @Column({
        name: 'token_hash',
        type: 'varchar',
        length: 64,
    })
    tokenHash: string;

    @Column({
        name: 'expires_at',
        type: 'timestamptz',
    })
    expiresAt: Date;

    @Column({
        name: 'used_at',
        type: 'timestamptz',
        nullable: true,
    })
    usedAt: Date | null;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;
}
