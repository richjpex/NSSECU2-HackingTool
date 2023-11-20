const r = require('rethinkdb');

r.connect({
    host: '127.0.0.1',
    port: 28015,
    db: 'myUsers',
}, (err, conn) => {
    if (err) {
        console.error(`Error connecting to RethinkDB: ${err.message}`);
        return;
    }

    createTable(conn, 'users');
});

function createTable(conn, tableName) {
    r.tableCreate(tableName).run(conn, (err, result) => {
        if (err) {
            console.error(`Error creating table ${tableName}: ${err.message}`);
        } else {
            console.log(JSON.stringify(result));
        }
        conn.close(); // Close the connection after performing the operation
    });
}
