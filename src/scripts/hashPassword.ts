import bcrypt from 'bcrypt';
import sql from 'mssql';
import config from '../config';

async function updateAdminPassword() {
  const password = 'Admin123!@#';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  const dbConfig: sql.config = {
    server: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: 'sa',
    password: 'YourStrongPassword123!',
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };

  try {
    const pool = await new sql.ConnectionPool(dbConfig).connect();
    await pool.request()
      .input('hash', sql.NVarChar, hash)
      .input('email', sql.NVarChar, 'admin@qcsmanagement.com')
      .query('UPDATE Users SET PasswordHash = @hash WHERE Email = @email');
    
    console.log('Admin password updated successfully');
    console.log('Email: admin@qcsmanagement.com');
    console.log('Password: Admin123!@#');
    
    await pool.close();
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

updateAdminPassword().catch(console.error);