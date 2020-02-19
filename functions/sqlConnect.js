'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
try {
  admin.initializeApp();
} catch (e) {}

const sql = require('mssql')

/**
 * Triggers when a user gets a new follower and sends notifications if the user has enabled them.
 * Also avoids sending multiple notifications for the same user by keeping a timestamp of sent notifications.
 */
exports.default = functions.database.ref('/sqlConnect').onWrite(
  async (change, context) => {

    let sqlConn = getConnection()
    
  }
)

async function getConnection () {

  /*const config = {
    user: 'sqlserver',
    password: 'maisFuturo90()12!@',
    server: '34.95.152.68\\portal-mais-futuro:southamerica-east1:maisfuturo', 
    database: 'Sinqia',
  }*/

  const config = {
    user: 'sqlserver',
    password: 'maisFuturo90()12!@',
    server: '34.95.152.68\\portal-mais-futuro:southamerica-east1:maisfuturo',
    database: 'Sinqia',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
  }  

  let pool = await sql.connect(config)
  let result1 = await pool.request()
      //.input('input_parameter', sql.Int, value)
      //.query('select * from mytable where id = @input_parameter')
      .query('select * from Dados_Cadastrais')
      
  console.dir(result1)

  return
  
  /*const options = 
  {  
    host: "34.95.152.68", //IP address of my Cloud SQL Server
    user: 'sqlserver',
    password: 'maisFuturo90()12!@',
    database: 'Sinqia'
  };
  return await sql.connect(config) */
}