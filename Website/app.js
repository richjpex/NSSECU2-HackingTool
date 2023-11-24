// Adding all needed modules
const express = require('express');
const bodyParser = require('body-parser');
const r = require('rethinkdb');
const hbs = require('hbs');
const app = express();

// Setting IP Address and Port Number
const IP_ADDRESS = 'localhost';
const PORT = 3000;

// Setting usual settings
app.set('view engine', '.hbs');
app.use(express.static(__dirname));
app.set('views', __dirname);
app.use(bodyParser.json());

// Connection to RethinkDB
var connection = null;

// Connect to RethinkDB
const connectDB = async () => {
  try {
    // Connecting
    connection = await r.connect({ host: 'localhost', port: 28015, password:'canada' });
	  
    // Please uncomment the lines below if you want to populate the database with data
    await createTable(connection);
    await insertSeedData(connection); // Insert seed data after creating table
	  
    console.log('Connected to RethinkDB');
  } catch (error) {
    console.error('Error connecting to RethinkDB:', error);
  }
};

// Creating the users table in test db
const createTable = async () => {
  try {
		await r.db('test').tableCreate('users').run(connection, function(err, result) {
		    if (err) throw err;
		    console.log(JSON.stringify(result, null, 2));
		})
	} catch (error) {
    console.error('Error creating table:', error);
  }
};

// Inserting sample data into the database
const insertSeedData = async () => {
	  await r.table('users').insert([
	    { username: "user1", password: "1111"},
	    { username: "user2", password: "2222"},
	    { username: "user3", password: "3333"},
	]).run(connection, function(err, result) {
	    if (err) throw err;
	    console.log(JSON.stringify(result, null, 2));
	})
};

// Rendering Welcome Page
app.get('/', (req, res) => {
  res.render('welcome');
});

// Rendering Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Rendering Register Page
app.get('/register', (req, res) => {
  res.render('register');
});

// Login Handler
app.post('/login', async (req, res) => {
  // Getting the parameters
  const username = req.body.username;
  const password = req.body.password;
  console.log(req.body);

  try {
    // Check if the username is in the database
    r.table('users').filter(r.row('username').eq(username)).
    run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
	    // If there is a user with the username
            if(result.length > 0)
            {
		    // If the password matches with the one in the database
		    if (result[0].password == password)
		    {
			// Send a welcome message
		    	console.log('Welcome, ' + username + '!');
		    	res.send('Welcome, ' + username + '!')
		    }
		    else
		    {
			// Send a failure message
		    	console.log(result);
		    	console.log(result[0]);
		    	console.log('Login Credentials Are Invalid.');
		    	res.send('Login Credentials Are Invalid.');
		    }
            }
            else
            {
		// Send a failure message
            	console.log(result);
	    	console.log(result[0]);
	    	console.log('Login Credentials Are Invalid.');
	    	res.send('Login Credentials Are Invalid.');
            }
            
        });
    });
  } catch (error) {
    console.error('Error during login:', error);
  }
});

// Regiter Handler
app.post('/register', async (req, res) => {
  // Getting the parameters
  const username = req.body.username;
  const password = req.body.password;
  console.log(req.body);

  try {
    // Check if the username is in the database
    r.table('users').filter(r.row('username').eq(username)).
    run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
	    // If there are users with the username
            if(result.length > 0)
            {
		// Send an error message
            	console.log('An Account With the Username Exists Already!');
	    	res.send('An Account With the Username Exists Already!');
            }
            else
            {
		// Add the user
            	r.table('users').insert([
		{ username: username, password: password}
		]).run(connection, function(err, result) {
		if (err) throw err;
		console.log(JSON.stringify(result, null, 2));
		})
		// Send success message
	    	console.log('Successfully Registered.');
	    	res.send('Successfully Registered.');
            }
            
        });
    });
  } catch (error) {
    console.error('Error during login:', error);
  }
});


// Start the server
app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
  // Connect to RethinkDB
  connectDB();
});