var fs = require('fs');
var mysql = require('mysql');
//var qqmail = require('qqmail');
var qqmail = require('../qqmail/index');
var async = require('async');
var cookie_util = require('cookie-util');
var iqiyi = require('./../iqiyi/index');

//var iqiyi = require('iqiyi-util');



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
  database : 'accounts_160312'
});
connection.connect();


loop();
function loop(){

  /**
   * `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
   `user` varchar (80) NOT NULL UNIQUE COMMENT '爱奇艺账号',
   `password` varchar (50) NOT NULL COMMENT '爱奇艺密码',
   `email` VARCHAR(20) DEFAULT '' COMMENT'爱奇艺绑定的邮箱',
   `mobile` varchar(11) NOT NULL DEFAULT '' COMMENT'爱奇艺绑定的手机号',
   `sold_time` datetime DEFAULT NULL COMMENT '账号卖出的时间',
   lock，是否封锁
   */
  var limit = 10;
  connection.query("SELECT a.id,a.user,a.password as iqiyi_pwd,a.email,a.mobile,a.sold_time,b.qq,b.password as qq_pwd from iqiyi as a,qq as b where TIMESTAMPDIFF(SECOND,a.sold_time,NOW())>24*60*60 and a.sold_time IS NOT null and a.email like concat(b.qq,'%') order by id limit " + limit, function(err, rows, fields) {
    if (err) throw err;

    async.mapLimit(rows, 1, function(temp_row, callback){

      // 第一步，先发送找回密码的邮件
// ** 邮件有效期，24小时

// 第二步，登陆邮箱，找到相应的链接

      var email = temp_row.qq;
      var email_pwd = temp_row.qq_pwd;
      var t = 5;
      qqmail.login(email, email_pwd, {
        success: function(self){

        },
        complete: function(self){

          switch (self.logged_obj.login_retcode){
            case 0:
            case '0':
              self.get_cur_white_domains(function(white_domain_arr){
                if(!/qiyi/.test(white_domain_arr)){
                  console.log('没有qiyi.com，需要添加')
                  self.add_white_domain("qiyi.com", function(){

                    iqiyi.find_pwd(email + '@qq.com');

                    console.log('等待'+ t +'秒');
                    setTimeout(function(){
                      search(temp_row);
                    }, t*1000);
                  })
                }
                else{
                  console.log('qiyi.com已经在白名单了')
                  iqiyi.find_pwd(email + '@qq.com');
                  console.log('等待'+ t +'秒');
                  setTimeout(function(){
                    search(temp_row);
                  }, t*1000);
                }

              });

            function search(temp_row){
              self.search({
                sender: 'no-reply@qiyi.com'
              }, function(content){

                var reg_href = /href="(http:\/\/passport\.iqiyi\.com\/pages\/secure\/account\/verfiy_email\.action\?token=[^"]+)"/;
                reg_href.exec(content);
                var final_url = RegExp.$1;
                console.log('最终读取的爱奇艺链接：' + final_url);

                var new_pwd = getRandomPassword();
                iqiyi.reset_pwd(final_url, new_pwd, function(){

                  connection.query('update iqiyi set sold_time=null,password="'+ new_pwd + '" where user="' + temp_row.user + '"', function(err, rows, fields){
                    if(err) throw err;

                    console.log('【' + temp_row.id + '】' + self.qq + '状态更新成功');
                    console.log('等待3秒继续');

                    setTimeout(function(){
                      callback(null, temp_row.user + '|' + new_pwd);
                    }, 3000);

                  });

                });

                console.log(email + '@qq.com|' + new_pwd);
              });
            }

              break;

            default :
              callback(null, temp_row.user + '，重置失败');

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





// 第三步，找回密码
// http://passport.iqiyi.com/pages/secure/account/verfiy_email.action?token=D7uaE14bUytLAjRLSQzw5DPsBgKb4zQOGv6enJXASnzQZIUr78iUZohKDn6ojQl1WBEKMfp9i%2BHjGC8tJuAdvw%3D%3D

// 生成随机的8位密码
// aaabbb33
function getRandomPassword(){
  var ret = "";
  var letter_arr = "ABCDEFHJKMNPRSTUVWXYZ";
  var num_arr = "23456789";

  var idx = parseInt(Math.random() * letter_arr.length);
  ret += letter_arr[idx];
  ret += letter_arr[idx];
  ret += letter_arr[idx];
  letter_arr = letter_arr.replace(letter_arr[idx], '');

  idx = parseInt(Math.random() * letter_arr.length);
  ret += letter_arr[idx];
  ret += letter_arr[idx];
  ret += letter_arr[idx];

  idx = parseInt(Math.random() * num_arr.length);
  ret += num_arr[idx];
  ret += num_arr[idx];

  return ret.toLowerCase();
}