import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const AppDataSource = new DataSource({
    type: 'postgres',
    host: getRequiredEnv('DB_HOST'),
    port: Number(getRequiredEnv('DB_PORT')),
    username: getRequiredEnv('DB_USERNAME'),
    password: getRequiredEnv('DB_PASSWORD'),
    database: getRequiredEnv('DB_DATABASE'),

    entities: [join(currentDirectory, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(currentDirectory, 'migrations', '*{.ts,.js}')],
    synchronize: false,
    migrationsRun: false,
});

export default AppDataSource;