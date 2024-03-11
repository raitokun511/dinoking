var MySQLInstance;
var connection;

class UserData {
    connectDatabase()
    {
        var mysql      = require('mysql');
        connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'kingofdino'
        });
        
        connection.connect();
        
        connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results[0].solution);
        });
        
        //connection.end();
    }
    register()
    {
        connection.query("INSERT INTO user (user_name, name, password) VALUES ('dino2', 'Jame', '123456789')", function (error, results) {
            if (error) throw error;
            console.log('Inserted Value');
            });
        connection.end();
    }
    login(username, password, callback)
    {
        let sql = "SELECT id, user_name FROM user WHERE user_name = ? AND password = ?" ;
        connection.query(sql, [username, password], function (error, results, fields) {
            if (error) throw error;
            console.log('ID is: ', results[0]["id"] +" name: " + results[0]['user_name']);
            if (error)
                callback(error, null);
            else
                callback(null, results);
        });
    }
    updateXP(xpValue, userID)
    {
        let sql = "UPDATE user SET xp = xp + ? WHERE id = ?" ;
        connection.query(sql, [xpValue, userID], function (error, results, fields) {
            if (error) throw error;
                //console.log('Not update XP: ');
            if (results)
                console.log('Update XP: ' + xpValue);
        });
    }
    updateGold(goldValue, userID)
    {
        let sql = "UPDATE user SET gold = ? WHERE id = ?" ;
        connection.query(sql, [goldValue, userID], function (error, results, fields) {
            if (error) throw error;
                //console.log('Not update gold: ');
            if (results)
                console.log('Update gold: ' + goldValue);
        });
    }
    updateDia(diaValue, userID)
    {
        let sql = "UPDATE user SET dia = ? WHERE id = ?" ;
        connection.query(sql, [diaValue, userID], function (error, results, fields) {
            if (error) throw error;
                //console.log('Not update dia: ');
            if (results)
                console.log('Update dia: ' + diaValue);
        });
    }
    close()
    {
        connection.end();
    }
}
module.exports = UserData;