var fs = require('fs');
var mysql = require('mysql');
var qqmail = require('qqmail');


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
qqmail.init(conf);

var connection = mysql.createConnection({
  host     : conf.mysql_host,
  user     : conf.mysql_user,
  password : conf.mysql_password,
  database : 'accounts'
});
connection.connect();

connection.query('SELECT id,qq,password from qq where status=1 order by id limit 1', function(err, rows, fields) {
  if (err) throw err;
  for(var i=0; i<rows.length; i++){
    console.log(rows[i].id, rows[i].qq, rows[i].password);
    qqmail.login(rows[i].qq, rows[i].password);
    if(qqmail.logged_obj.login_retcode == 0){
      connection.query('update qq set recent_login_time=now() where qq=' + rows[i].qq);
    }
  }
});

connection.end();
