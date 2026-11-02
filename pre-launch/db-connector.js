const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Credenciales extraídas de web_infrastructure/talkme_api.php
const dbConfig = {
    host: '31.11.39.205',
    user: 'Sql1934281',
    password: 'Henar0741@',
    database: 'Sql1934281_1',
    connectTimeout: 5000,       // 5s max to connect — fail fast
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

/**
 * Función para probar la conexión a la Base de Datos Remota
 */
async function testConnection() {
    try {
        console.log("🔌 Iniciando prueba de conexión con MySQL remoto...");
        const [rows, fields] = await pool.execute('SELECT 1 + 1 AS solution');
        console.log("✅ Conexión Exitosa. Resultado de prueba MySQL:", rows[0].solution);
        return true;
    } catch (error) {
        console.error("❌ Error de conexión a MySQL:", error.message);
        return false;
    }
}

/**
 * Comprueba el estado de una licencia vinculada a un Hardware ID
 */
async function checkLicenseStatus(hardwareFingerprint) {
    try {
        const query = `
            SELECT l.status, l.expires_at, l.license_key
            FROM tm_licenses l
            JOIN tm_hw_bindings b ON l.id = b.license_id
            WHERE b.hw_fingerprint = ?
        `;
        const [rows] = await pool.execute(query, [hardwareFingerprint]);
        
        if (rows.length > 0) {
            console.log("🔑 Licencia encontrada para este Hardware ID:");
            console.log(rows[0]);
            return rows[0];
        } else {
            console.log("⚠️ No se ha encontrado ninguna licencia asociada a este equipo.");
            return null;
        }
    } catch (error) {
        console.error("❌ Error consultando licencia:", error.message);
        throw error;
    }
}

async function getLicenseExpiry(licenseKey) {
    try {
        const query = 'SELECT expires_at FROM tm_licenses WHERE license_key = ?';
        const [rows] = await pool.execute(query, [licenseKey]);
        if (rows.length > 0) {
            return rows[0].expires_at;
        }
        return null;
    } catch (error) {
        console.error("❌ Error consultando fecha de expiración:", error.message);
        return null;
    }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    (async () => {
        const isConnected = await testConnection();
        if (isConnected) {
            // Usamos un Hash de prueba simulado para la consulta
            const mockHash = '90d808834aef9846c6587c1f628f963842d9503c2ed6a2d28067cb725d4ee9fc';
            console.log(`\n🔎 Buscando licencia para Hardware ID: ${mockHash}`);
            await checkLicenseStatus(mockHash);
        }
        process.exit(0);
    })();
}

async function changeUserPassword(email, oldPassword, newPassword) {
    try {
        const query = 'SELECT id, password_hash FROM tm_users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        
        if (rows.length === 0) {
            return { success: false, error: 'Usuario no encontrado' };
        }
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        
        if (!isMatch) {
            return { success: false, error: 'La contraseña actual es incorrecta' };
        }
        
        const newHash = await bcrypt.hash(newPassword, 10);
        const updateQuery = 'UPDATE tm_users SET password_hash = ? WHERE id = ?';
        await pool.execute(updateQuery, [newHash, user.id]);
        
        return { success: true };
    } catch (error) {
        console.error("❌ Error cambiando contraseña:", error.message);
        return { success: false, error: 'Error interno en la base de datos' };
    }
}

module.exports = { testConnection, checkLicenseStatus, getLicenseExpiry, changeUserPassword };
