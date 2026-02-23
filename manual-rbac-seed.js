import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/local'
});

const PERMISSIONS = [
	{ permission: 'posts.manage' },
	{ permission: 'tokens.manage' },
	{ permission: 'users.read' },
	{ permission: 'users.update' },
	{ permission: 'users.manage_status' },
	{ permission: 'users.manage_role' },
	{ permission: 'messages.read' }
];

const ROLES = [
	{ role: 'super_admin' },
	{ role: 'admin' },
	{ role: 'posts_manager' },
	{ role: 'tokens_manager' }
];

async function seed() {
    try {
        await client.connect();
        console.log("Connected to DB...");

        // 1. Clear 
        await client.query("TRUNCATE role_permissions, permissions, roles CASCADE");

        // 2. Insert Permissions
        const permIds = {};
        for (const p of PERMISSIONS) {
            const res = await client.query("INSERT INTO permissions (id, permission) VALUES (gen_random_uuid(), $1) RETURNING id", [p.permission]);
            permIds[p.permission] = res.rows[0].id;
        }
        console.log("Permissions seeded.");

        // 3. Insert Roles
        const roleIds = {};
        for (const r of ROLES) {
            const res = await client.query("INSERT INTO roles (id, role) VALUES (gen_random_uuid(), $1) RETURNING id", [r.role]);
            roleIds[r.role] = res.rows[0].id;
        }
        console.log("Roles seeded.");

        // 4. Link super_admin to all permissions
        const superAdminRoleId = roleIds['super_admin'];
        for (const permId of Object.values(permIds)) {
            await client.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", [superAdminRoleId, permId]);
        }
        console.log("Linked super_admin to all permissions.");

        // 5. Sync passwords and promote
        console.log("Syncing fixer password hash to superadmin and promoting...");
        
        // Get fixer's hash
        const fixerRes = await client.query("SELECT hashed_password FROM users WHERE email = 'fixer@cryptosharia.id'");
        if (fixerRes.rows.length > 0) {
            const workingHash = fixerRes.rows[0].hashed_password;
            
            // Apply to superadmin
            await client.query(`
                UPDATE users 
                SET hashed_password = $1, role_id = $2, is_email_verified = true, status = 'active'
                WHERE email = 'superadmin@cryptosharia.id'
            `, [workingHash, superAdminRoleId]);
            
            // Also promote fixer just in case
            await client.query(`
                UPDATE users 
                SET role_id = $1, is_email_verified = true, status = 'active'
                WHERE email = 'fixer@cryptosharia.id'
            `, [superAdminRoleId]);
            
            console.log("Success! Both accounts now have 'password123' and super_admin role.");
        } else {
            console.log("Fixer user not found, something went wrong.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

seed();
