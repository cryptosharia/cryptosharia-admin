import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool, { schema });

async function seed() {
    console.log('Seeding database...');
    
    try {
        const existingRoles = await db.select().from(schema.roles);
        if (existingRoles.length > 0) {
            console.log('Roles already exist. Skipping role seed.');
        } else {
            console.log('Seeding roles and permissions...');

            // 1. Create Roles
            const [superAdmin, editor, viewer] = await db.insert(schema.roles).values([
                { name: 'Super Admin', slug: 'super_admin' },
                { name: 'Editor', slug: 'editor' },
                { name: 'Viewer', slug: 'viewer' }
            ]).returning();

            // 2. Create Permissions
            const modules = ['tokens', 'principles', 'contributors', 'admins', 'activity', 'settings'];
            const actions = ['view', 'create', 'edit', 'delete'];
            
            const permissionValues = [];
            for (const module of modules) {
                for (const action of actions) {
                    permissionValues.push({
                        name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.charAt(0).toUpperCase() + module.slice(1)}`,
                        slug: `${module}.${action}`,
                        module: module
                    });
                }
            }

            const allPermissions = await db.insert(schema.permissions).values(permissionValues).returning();

            // 3. Assign Permissions to Roles
            // Super Admin gets everything
            await db.insert(schema.rolePermissions).values(
                allPermissions.map(p => ({ roleId: superAdmin.id, permissionId: p.id }))
            );

            // Editor gets everything except admins and settings management
            const editorPerms = allPermissions.filter(p => !['admins', 'settings'].includes(p.module));
            await db.insert(schema.rolePermissions).values(
                editorPerms.map(p => ({ roleId: editor.id, permissionId: p.id }))
            );

            // Viewer gets only view permissions
            const viewerPerms = allPermissions.filter(p => p.slug.endsWith('.view'));
            await db.insert(schema.rolePermissions).values(
                viewerPerms.map(p => ({ roleId: viewer.id, permissionId: p.id }))
            );
            
            // 4. Create Initial Super Admin
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@cryptosharia.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'password';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            await db.insert(schema.admins).values({
                name: 'Super Admin',
                email: adminEmail,
                hashedPassword: hashedPassword,
                roleId: superAdmin.id,
                isActive: true
            });
            console.log(`Super Admin created: ${adminEmail} / ${adminPassword}`);
        }

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await pool.end();
        console.log('Seeding finished.');
    }
}

seed();
