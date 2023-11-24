const express = require('express');
const bodyParser = require('body-parser');
const r = require('rethinkdb');
const hbs = require('hbs');

const app = express();
const IP_ADDRESS = '0.0.0.0';
const PORT = 3000;

app.set('view engine', '.hbs'); // Set the view engine to 'html'
app.use(express.static(__dirname));
app.set('views', __dirname);

var connection = null;

// Connect to RethinkDB
const connectDB = async () => {
  try {
    connection = await r.connect({ host: 'localhost', port: 28015 });
    //await createTable(connection);
    //await insertSeedData(connection); // Insert seed data after creating table
    console.log('Connected to RethinkDB');
  } catch (error) {
    console.error('Error connecting to RethinkDB:', error);
  }
};

// Create table if not exists
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

// Insert seed data into 'users' table
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


// Middleware to parse JSON
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('welcome');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

// Login endpoint
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log(req.body);

  try {
    // Check if the provided username and password match a user in the 'users' table
    r.table('users').filter(r.row('username').eq(username)).
    run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
            if(result.length > 0)
            {
		    if (result[0].password == password)
		    {
		    	console.log('Welcome, ' + username + '!');
		    	res.send('Welcome, ' + username + '!')
		    }
		    else
		    {
		    	console.log(result);
		    	console.log(result[0]);
		    	console.log('Login Credentials Are Invalid.');
		    	res.send('Login Credentials Are Invalid.');
		    }
            }
            else
            {
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


app.post('/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log(req.body);

  try {
    // Check if the provided username and password match a user in the 'users' table
    r.table('users').filter(r.row('username').eq(username)).
    run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
            if(result.length > 0)
            {
            	console.log('An Account With the Username Exists Already!');
	    	res.send('An Account With the Username Exists Already!');
            }
            else
            {
            	r.table('users').insert([
		{ username: username, password: password}
		]).run(connection, function(err, result) {
		if (err) throw err;
		console.log(JSON.stringify(result, null, 2));
		})
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
  // Connect to RethinkDB and insert seed data when the server starts
  connectDB();
});
