var fs = require('fs');
var mysql = require('mysql');
var qqmail = require('qqmail');
//var qqmail = require('../qqmail/index');
var async = require('async');
var cookie_util = require('../cookie-util/index');


var conf_json = 'dawn.json';
var dev_conf_json = 'dawn_local.json';
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
try{
  conf = JSON.parse(fs.readFileSync(process.cwd() + '/' + dev_conf_json, "utf-8"));
}
catch(e){
  conf = JSON.parse(fs.readFileSync(process.cwd() + '/' + conf_json, "utf-8"));
}
qqmail.init(conf);

var connection = mysql.createConnection({
  host     : conf.mysql_host,
  user     : conf.mysql_user,
  password : conf.mysql_password,
  database : 'accounts'
});
connection.connect();

loop();

function loop(){
  var limit = 3;
  connection.query('SELECT id,qq,password,recent_login_time from qq where status=1 and TIMESTAMPDIFF(SECOND,recent_login_time,NOW())>24*60*60*30 order by rand() limit ' + limit, function(err, rows, fields) {
    if (err) throw err;

    async.mapLimit(rows, 1, function(temp_row, callback){


      qqmail.login(temp_row.qq, temp_row.password, {
        success: function(self){

        },
        complete: function(self){
          switch (self.logged_obj.login_retcode){
            case 0:
            case '0':
              connection.query('update qq set recent_login_time=now(),cookies_smart="' + cookie_util.get_simple_cookie_str(self.cookies) + '" where qq=' + temp_row.qq, function(err, rows, fields){
                if(err) throw err;
                console.log('【' + temp_row.id + '】' + self.qq + '状态更新成功');
                console.log('等待3秒继续');

                setTimeout(function(){
                  callback(null, temp_row.id + '' + temp_row.qq + temp_row.password);
                }, 3000);

              });
              break;

            case 19:
            case '19':
              // 当前账号异常无法登陆,
              // STATUS_UNKNOWN, "4"
              connection.query('update qq set status=4 where qq=' + temp_row.qq, function(err, rows, fields){
                if(err) throw err;
                console.log('【' + temp_row.id + '】' + self.qq + '，账号异常。');
                console.log('等待10秒继续');

                setTimeout(function(){
                  callback(null, temp_row.id + '' + temp_row.qq + temp_row.password);
                }, 10000);

              });
              break;

            default :
              console.log('【' + temp_row.id + '】' + self.qq + '登陆失败');
              console.log('等待10秒继续');

              setTimeout(function(){
                callback(null, temp_row.id + '' + temp_row.qq + temp_row.password);
              }, 10000);
              break;
          }

        }
      });

    }, function(err, results){
      //console.log(results);

      if(rows.length >= limit){
        loop();
      }
      else{
        connection.end();
      }
    });

  });
}



