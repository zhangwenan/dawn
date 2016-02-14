var fs = require('fs');
var mysql = require('mysql');
var qqmail = require('qqmail');
var async = require('async');
var cookie_util = require('./lib/cookie_util.js');


var conf_json = 'dawn.json';
var conf = {
  "mysql_host":"",
  "mysql_user":"",
  "mysql_password":"",

  "typeid":"",
  "softid":"",
  "softkey":"",

  "username":"",
  "password":""
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

connection.query('SELECT id,qq,password,recent_login_time from qq where status=1 and TIMESTAMPDIFF(SECOND,recent_login_time,NOW())>24*60*60*30 order by id limit 3', function(err, rows, fields) {
  if (err) throw err;

  async.mapLimit(rows, 1, function(temp_row, callback){


    qqmail.login(temp_row.qq, temp_row.password, {
      success: function(self){
        if(self.logged_obj.login_retcode == 0){
          connection.query('update qq set recent_login_time=now(),cookies_smart="' + cookie_util.get_simple_cookie_str(self.cookies) + '" where qq=' + temp_row.qq, function(err, rows, fields){
            if(err) throw err;
            console.log('【' + temp_row.id + '】' + self.qq + '状态更新成功');

            callback(null, temp_row.id + '' + temp_row.qq + temp_row.password);
          });
        }
      }
    });

  }, function(err, results){
    //console.log(results);
    connection.end();
  });

});


