const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const requestIp = require('request-ip');
const auth = require('basic-auth')
// Create an Express application.
const app = express();

// Use the `body-parser` middleware to parse request bodies.
app.use(bodyParser.json());
app.use((req, res, next) => {
  let user = auth(req)

  if (user === undefined || user['name'] !== 'TNeGA' || user['pass'] !== 'aiml') {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="Node"')
    res.end('Unauthorized!')
  } else {
    next()
  }
})
// Connect to a PostgreSQL database.  
// const connectionString = 'postgres://postgres1:postgres@192.168.5.16:5432/npci';
const connectionString = 'postgres://node:node@10.236.250.67:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});
client.connect();

// Create routes for each endpoint.
app.get('/dashboard', (req, res) => {
  // Get the client's IP address.
  const clientIp = requestIp.getClientIp(req);
  // Get the current datetime.
  const currentDatetime = new Date();
  // Get the User Agent.
  const userAgent = req.headers['user-agent'];
  // Get the HTTP method and Request URL.
  const httpMethod = req.method;
  const requestUrl = req.url;
  const getCountQuery = `SELECT (
    (SELECT COUNT(*) FROM grains_log) +
    (SELECT COUNT(*) FROM blockchain_log) +
    (SELECT COUNT(*) FROM hfas_log) +
    (SELECT COUNT(*) FROM npci_log)
  ) AS total_count;  
  `;

  // Log the request details.
  const logQuery = `
    INSERT INTO log (request_datetime, client_ip, user_agent, http_method, request_url)
    VALUES ($1, $2, $3, $4, $5);
  `;
  client.query(logQuery, [currentDatetime, clientIp, userAgent, httpMethod, requestUrl], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Log inserted successfully');
    }
  });
  client.query(getCountQuery, (err, countResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      const totalCount = countResult.rows[0].total_count;

      // Get all logs from the database.
      const getLogsQuery = `SELECT * from log`;
      client.query(getLogsQuery, (err, logsResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          const logs = logsResult.rows;

          // Create a stylish HTML table dynamically.
          const table = `
          <h1> Dashboard Logs</h1>
          <center>
          
          <p>Entire Count: ${totalCount}</p></center>
         
          <style>
                          table {
                            border-collapse: collapse;
                            width: 100%;
                          }
                          th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                          }
                          th {
                            background-color: #f2f2f2;
                          }
                        </style>
                        <table>
                        <tr>
                          <th>ID</th>
                          <th>Request Datetime</th>
                          <th>Client IP</th>
                          <th>User Agent</th>
                          <th>HTTP Method</th>
                          <th>Request URL</th>
                        </tr>
                        ${logs
              .map(
                (log) => `
                            <tr>
                              <td>${log.id}</td>
                              <td>${log.request_datetime.toLocaleString("en-US", { hour12: false })}</td>
                              <td>${log.client_ip}</td>
                              <td>${log.user_agent}</td>
                              <td>${log.http_method}</td>
                              <td>${log.request_url}</td>
                              
                              </tr>
                            `

              )
              .join('')}
                        </table>
                        `;

          // Send the HTML table to the client.
          res.send(table);
        }
      });
    }
  });

});
async function getAllDataByuid(uid) {
  // SELECT name_in_english  FROM pds.pds_source_06032023_stg WHERE uid = '972139499242';
  const res = await client.query('SELECT ufc, old_ration_number, nfsa_card_type, name_in_english, name_in_tamil, father_spouse_name_in_english, father_spouse_name_in_tamil, date_of_birth, age, sex, rel_name, mobile_number, num_of_cylinder, num_of_adult, num_of_child, address_line1, address_line2, address_line3, village_name, taluk_name, district_name, pincode, ration_shop_code, is_disabled  FROM public.pds_march_23  WHERE uid = $1;', [uid]);
  return res.rows;
}
async function getDataByuid(uid) {
  // SELECT name_in_english  FROM pds.pds_source_06032023_stg WHERE uid = '972139499242';
  const res = await client.query('SELECT name_in_english  FROM public.pds_march_23  WHERE uid = $1;', [uid]);
  return res.rows;
}

async function getDataByufc(ufc) {
  // SELECT name_in_english  FROM pds.pds_source_06032023_stg WHERE uid = '972139499242';
 const res = await client.query('SELECT ufc, old_ration_number, nfsa_card_type, name_in_english, name_in_tamil, father_spouse_name_in_english, father_spouse_name_in_tamil, date_of_birth, age, sex, rel_name, mobile_number, num_of_cylinder, num_of_adult, num_of_child, address_line1, address_line2, address_line3, village_name, taluk_name, district_name, pincode, ration_shop_code, is_disabled  FROM public.pds_march_23  WHERE ufc = $1;', [ufc]);
  return res.rows;
}

// const res = await client.query('SELECT *  FROM public.np  WHERE aadharno = $1;', [aadharno]);
// SELECT name_in_english  FROM pds.pds_source_06032023_stg WHERE uid = '972139499242';
async function getDataByaadhar(uid) {
const res = await client.query('SELECT bank_name,bank_status FROM rationshop_survery_pilot_2605 WHERE uid= $1', [uid]);
  return res.rows;
}
// app.get('/api/npci/:aadharno', async (req, res) => {
//   try {
//     const aadharno = req.params.aadharno;
//     const query = 'SELECT status,yes,bank FROM np WHERE CAST(aadharno AS bigint) = $1';
//     const result = await client.query(query, [aadharno]);

//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error executing query:', error);
//     // res.status(500).json({ error: 'Internal server error' });
//   }
// });
// app.get('/api/npci/:aadharno', async (req, res) => {
//   // Get the client's IP address.
//   const clientIp = requestIp.getClientIp(req);

//   // Get the current datetime.
//   const currentDatetime = new Date();

//   // Get the User Agent.
//   const userAgent = req.headers['user-agent'];

//   // Get the HTTP method and Request URL.
//   const httpMethod = req.method;
//   const requestUrl = req.url;

//   // Log the request details.
//   const logQuery = `
//     INSERT INTO npci_log (request_datetime, client_ip, user_agent, http_method, request_url)
//     VALUES ($1, $2, $3, $4, $5);
//   `;
//   client.query(logQuery, [currentDatetime, clientIp, userAgent, httpMethod, requestUrl], (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('Log inserted successfully');
//     }
//   });

//   try {
//     // Get the aadharno from the URL parameters
//     const aadharno = req.params.aadharno;
//     console.log('Aadhar number:', aadharno);

//     // Get the data by aadharno
//     const item = await getDataByaadhar(aadharno);
//     console.log('Retrieved item:', item);

//     // If no item was found, return a 404 status code
//     if (!item) {
//       return res.status(404).send('Item not found');
//     }

//     // Otherwise, create a JWT token with the data
//     const token = jwt.sign({ data: item }, 'secret');
//     console.log('JWT Token:', token);

//     const ip = req.socket.remoteAddress;
//     console.log('Remote IP:', ip);

//     // Return the token to the client
//     res.send({ data: token });

//   } catch (error) {
//     // If an error occurred, return a 500 status code
//     const ip = req.socket.remoteAddress;
//     console.error(error);
//     res.status(500).send('An error occurred');
//     console.log('Error:', error);
//   }
// });

app.get('/api/npci/:uid', async (req, res) => {
  // Get the client's IP address.
  const clientIp = requestIp.getClientIp(req);

  // Get the current datetime.
  const currentDatetime = new Date();

  // Get the User Agent.
  const userAgent = req.headers['user-agent'];

  // Get the HTTP method and Request URL.
  const httpMethod = req.method;
  const requestUrl = req.url;

  // Log the request details.
  const logQuery = `
INSERT INTO npci_log (request_datetime, client_ip, user_agent, http_method, request_url)
VALUES ($1, $2, $3, $4, $5);
`;
  client.query(logQuery, [currentDatetime, clientIp, userAgent, httpMethod, requestUrl], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Log inserted successfully');
    }
  });
  try {
    // Get the ufc from the URL parameters
    const uid = req.params.uid;

    // Get the data by ufc
    const item = await getDataByaadhar(uid);

    // If no item was found, return a 404 status code
    if (!item) {
      return res.status(404).send('Data not found');
    }
    console.log(item);
    // Otherwise, create a JWT token with the data
    const token = jwt.sign({ data: item }, 'secret');

    // if (token.payload == '[]') {
    //   return res.status(404).send({message: 'Invalied UFC number'});
    // }

    const ip = req.socket.remoteAddress;

    // Return the token to the client
    res.send({ data: token });
    // logger.log('info', `${ip}`);

  } catch (error) {
    // If an error occurred, return a 500 status code
    const ip = req.socket.remoteAddress;
    console.error(error);
    res.status(500).send('Data not found');
    // logger.log('ip of user ', `${error}`);

  }
})

//Route that retrieves data by ufc For HFAS
app.get('/api/dataservices/:ufc', async (req, res) => {
  // Get the client's IP address.
  const clientIp = requestIp.getClientIp(req);

  // Get the current datetime.
  const currentDatetime = new Date();

  // Get the User Agent.
  const userAgent = req.headers['user-agent'];

  // Get the HTTP method and Request URL.
  const httpMethod = req.method;
  const requestUrl = req.url;

  // Log the request details.
  const logQuery = `
    INSERT INTO hfas_log (request_datetime, client_ip, user_agent, http_method, request_url)
    VALUES ($1, $2, $3, $4, $5);
  `;
  client.query(logQuery, [currentDatetime, clientIp, userAgent, httpMethod, requestUrl], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Log inserted successfully');
    }
  });
  try {
    // Get the ufc from the URL parameters
    const ufc = req.params.ufc;

    // Get the data by ufc
    const item = await getDataByufc(ufc);

    // If no item was found, return a 404 status code
    if (!item) {
      return res.status(404).send('Item not found');
    }
    console.log(item);
    // Otherwise, create a JWT token with the data
    const token = jwt.sign({ data: item }, 'secret');

    // if (token.payload == '[]') {
    //   return res.status(404).send({message: 'Invalied UFC number'});
    // }

    const ip = req.socket.remoteAddress;

    // Return the token to the client
    res.send({ data: token });
    // logger.log('info', `${ip}`);

  } catch (error) {
    // If an error occurred, return a 500 status code
    const ip = req.socket.remoteAddress;
    console.error(error);
    res.status(500).send('An error occurred');
    // logger.log('ip of user ', `${error}`);

  }
});
//Route that retrieves data by ufc For Blockchain
app.get('/api/blockchain/:uid', async (req, res) => {
  // Get the client's IP address.
  const clientIp = requestIp.getClientIp(req);

  // Get the current datetime.
  const currentDatetime = new Date();

  // Get the User Agent.
  const userAgent = req.headers['user-agent'];

  // Get the HTTP method and Request URL.
  const httpMethod = req.method;
  const requestUrl = req.url;

  // Log the request details.
  const logQuery = `
  INSERT INTO blockchain_log (request_datetime, client_ip, user_agent, http_method, request_url)
  VALUES ($1, $2, $3, $4, $5);
`;
  client.query(logQuery, [currentDatetime, clientIp, userAgent, httpMethod, requestUrl], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Log inserted successfully');
    }
  });
  try {
    // Get the ufc from the URL parameters
    const uid = req.params.uid;

    // Get the data by ufc
    const item = await getDataByuid(uid);

    // If no item was found, return a 404 status code
    if (!item) {
      return res.status(404).send('Item not found');
    }
    console.log(item);
    // Otherwise, create a JWT token with the data
    const token = jwt.sign({ data: item }, 'secret');

    // if (token.payload == '[]') {
    //   return res.status(404).send({message: 'Invalied UFC number'});
    // }

    const ip = req.socket.remoteAddress;

    // Return the token to the client
    res.send({ data: token });
    // logger.log('info', `${ip}`);

  } catch (error) {
    // If an error occurred, return a 500 status code
    const ip = req.socket.remoteAddress;
    console.error(error);
    res.status(500).send('An error occurred');
    // logger.log('ip of user ', `${error}`);

  }
});
//Route that retrieves data by ufc For GRAINS
app.get('/api/hfasbyuid/:uid', async (req, res) => {
  // Get the client's IP address.
  const clientIp = requestIp.getClientIp(req);

  // Get the current datetime.
  const currentDatetime = new Date();

  // Get the User Agent.
  const userAgent = req.headers['user-agent'];

  // Get the HTTP method and Request URL.
  const httpMethod = req.method;
  const requestUrl = req.url;

  // Log the request details.
  const logQuery = `
  INSERT INTO grains_log (request_datetime, client_ip, user_agent, http_method, request_url)
  VALUES ($1, $2, $3, $4, $5);
`;
  client.query(logQuery, [currentDatetime, clientIp, userAgent, httpMethod, requestUrl], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Log inserted successfully');
    }
  });
  try {
    // Get the ufc from the URL parameters
    const uid = req.params.uid;

    // Get the data by ufc
    const item = await getAllDataByuid(uid);

    // If no item was found, return a 404 status code
    if (!item) {
      return res.status(404).send('Item not found');
    }
    console.log(item);
    // Otherwise, create a JWT token with the data
    const token = jwt.sign({ data: item }, 'secret');

    // if (token.payload == '[]') {
    //   return res.status(404).send({message: 'Invalied UFC number'});
    // }

    const ip = req.socket.remoteAddress;

    // Return the token to the client
    res.send({ data: token });
    // logger.log('info', `${ip}`);

  } catch (error) {
    // If an error occurred, return a 500 status code
    const ip = req.socket.remoteAddress;
    console.error(error);
    res.status(500).send('An error occurred');
    // logger.log('ip of user ', `${error}`);

  }
});

//LOGS
app.get('/npci/logs', (req, res) => {
  // Get the total count of logs from the database.
  const getCountQuery = 'SELECT COUNT(*) FROM npci_log;';
  client.query(getCountQuery, (err, countResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      const totalCount = countResult.rows[0].count;

      // Get all logs from the database.
      const getLogsQuery = 'SELECT * FROM npci_log;';
      client.query(getLogsQuery, (err, logsResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          const logs = logsResult.rows;

          // Create a stylish HTML table dynamically.
          const table = `
          <center><p>Total Count: ${totalCount}</p></center>
            <h1>NPCI Log</h1>
          <style>
                          table {
                            border-collapse: collapse;
                            width: 100%;
                          }
                          th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                          }
                          th {
                            background-color: #f2f2f2;
                          }
                        </style>
                        <table>
                        <tr>
                          <th>ID</th>
                          <th>Request Datetime</th>
                          <th>Client IP</th>
                          <th>User Agent</th>
                          <th>HTTP Method</th>
                          <th>Request URL</th>
                        </tr>
                        ${logs
              .map(
                (log) => `
                            <tr>
                              <td>${log.id}</td>
                              <td>${log.request_datetime.toLocaleString("en-US", { hour12: false })}</td>
                              <td>${log.client_ip}</td>
                              <td>${log.user_agent}</td>
                              <td>${log.http_method}</td>
                              <td>${log.request_url}</td>
                            </tr>`
              )
              .join('')}
                        </table>
                        `;

          // Send the HTML table to the client.
          res.send(table);
        }
      });
    }
  });
});
app.get('/hfas/logs', (req, res) => {

  // Get the total count of logs from the database.
  const getCountQuery = 'SELECT COUNT(*) FROM hfas_log;';
  client.query(getCountQuery, (err, countResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      const totalCount = countResult.rows[0].count;

      // Get all logs from the database.
      const getLogsQuery = 'SELECT * FROM hfas_log;';
      client.query(getLogsQuery, (err, logsResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          const logs = logsResult.rows;

          // Create a stylish HTML table dynamically.
          const table = `
          <center><p>Total Count: ${totalCount}</p></center>
            <h1>HFAS Log</h1>
          <style>
                          table {
                            border-collapse: collapse;
                            width: 100%;
                          }
                          th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                          }
                          th {
                            background-color: #f2f2f2;
                          }
                        </style>
                        <table>
                        <tr>
                          <th>ID</th>
                          <th>Request Datetime</th>
                          <th>Client IP</th>
                          <th>User Agent</th>
                          <th>HTTP Method</th>
                          <th>Request URL</th>
                        </tr>
                        ${logs
              .map(
                (log) => `
                            <tr>
                              <td>${log.id}</td>
                              <td>${log.request_datetime.toLocaleString("en-US", { hour12: false })}</td>
                              <td>${log.client_ip}</td>
                              <td>${log.user_agent}</td>
                              <td>${log.http_method}</td>
                              <td>${log.request_url}</td>
                            </tr>`
              )
              .join('')}
                        </table>
                        `;

          // Send the HTML table to the client.
          res.send(table);
        }
      });
    }
  });
});
app.get('/grains/logs', (req, res) => {

  // Get the total count of logs from the database.
  const getCountQuery = 'SELECT COUNT(*) FROM grains_log;';
  client.query(getCountQuery, (err, countResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      const totalCount = countResult.rows[0].count;

      // Get all logs from the database.
      const getLogsQuery = 'SELECT * FROM grains_log;';
      client.query(getLogsQuery, (err, logsResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          const logs = logsResult.rows;

          // Create a stylish HTML table dynamically.
          const table = `
            <h1>GRAINS Log</h1>
            <center><p>Total Count: ${totalCount}</p></center>
            <style>
                            table {
                              border-collapse: collapse;
                              width: 100%;
                            }
                            th, td {
                              border: 1px solid #ddd;
                              padding: 8px;
                              text-align: left;
                            }
                            th {
                              background-color: #f2f2f2;
                            }
                          </style>
                          <table>
                          <tr>
                            <th>ID</th>
                            <th>Request Datetime</th>
                            <th>Client IP</th>
                            <th>User Agent</th>
                            <th>HTTP Method</th>
                            <th>Request URL</th>
                          </tr>
                          ${logs
              .map(
                (log) => `
                              <tr>
                                <td>${log.id}</td>
                                <td>${log.request_datetime.toLocaleString("en-US", { hour12: false })}</td>
                                <td>${log.client_ip}</td>
                                <td>${log.user_agent}</td>
                                <td>${log.http_method}</td>
                                <td>${log.request_url}</td>
                              </tr>`
              )
              .join('')}
                          </table>
                          `;

          // Send the HTML table to the client.
          res.send(table);
        }
      });
    }
  });
});
app.get('/blockchain/logs', (req, res) => {

  // Get the total count of logs from the database.
  const getCountQuery = 'SELECT COUNT(*) FROM blockchain_log;';
  client.query(getCountQuery, (err, countResult) => {
    if (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    } else {
      const totalCount = countResult.rows[0].count;

      // Get all logs from the database.
      const getLogsQuery = 'SELECT * FROM blockchain_log;';
      client.query(getLogsQuery, (err, logsResult) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          const logs = logsResult.rows;

          // Create a stylish HTML table dynamically.
          const table = `
            <h1> BlockChain Logs</h1>
            <center>
            
            <p>Total Count: ${totalCount}</p></center>
           
            <style>
                            table {
                              border-collapse: collapse;
                              width: 100%;
                            }
                            th, td {
                              border: 1px solid #ddd;
                              padding: 8px;
                              text-align: left;
                            }
                            th {
                              background-color: #f2f2f2;
                            }
                          </style>
                          <table>
                          <tr>
                            <th>ID</th>
                            <th>Request Datetime</th>
                            <th>Client IP</th>
                            <th>User Agent</th>
                            <th>HTTP Method</th>
                            <th>Request URL</th>
                          </tr>
                          ${logs
              .map(
                (log) => `
                              <tr>
                                <td>${log.id}</td>
                                <td>${log.request_datetime.toLocaleString("en-US", { hour12: false })}</td>
                                <td>${log.client_ip}</td>
                                <td>${log.user_agent}</td>
                                <td>${log.http_method}</td>
                                <td>${log.request_url}</td>
                              </tr>`
              )
              .join('')}
                          </table>
                          `;

          // Send the HTML table to the client.
          res.send(table);
        }
      });
    }
  });
});




// Close the database connection when the server is shut down.
process.on('SIGINT', () => {
  client.end();
  process.exit();
});

// Run the application.
app.listen(8443, () => {
  console.log('App listening on port 8443');
});

