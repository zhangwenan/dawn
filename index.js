var fs = require('fs');
var mysql = require('mysql');

var conf_json = 'dawn.json';
var conf = {
  "mysql_host":"",
  "mysql_user":"",
  "mysql_password":"",

  "typeid":"",
  "softid":"",
  "softkey":"",

  "ysdm_user":"",
  "ysdm_password":""
};
conf = JSON.parse(fs.readFileSync(process.cwd() + '/' + conf_json, "utf-8"));

var connection = mysql.createConnection({
  host     : conf.mysql_host,
  user     : conf.mysql_user,
  password : conf.mysql_password,
  database : 'accounts'
});
connection.connect();

connection.query('SELECT count(*) as total from qq where status=1', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].total);
});

connection.end();
