var fs = require('fs');
var mysql = require('mysql');
//var qqmail = require('qqmail');
var qqmail = require('../qqmail/index');
var async = require('async');
var cookie_util = require('cookie-util');
//var iqiyi = require('iqiyi-util');


var email = '328828280';
var email_pwd = 'abccc';

// 第一步，先发送找回密码的邮件
// ** 邮件有效期，24小时
//iqiyi.find_pwd(email);


// 第二步，登陆邮箱，找到相应的链接
qqmail.login(email, email_pwd, {
  success: function(self){

  },
  complete: function(self){

    switch (self.logged_obj.login_retcode){
      case 0:
      case '0':

        self.search({
          sender: 'no-reply@qiyi.com'
        }, function(content){

          var reg_href = /href="(http:\/\/passport\.iqiyi\.com\/pages\/secure\/account\/verfiy_email\.action\?token=[^"]+)"/;
          reg_href.exec(content);
          console.log('最终读取的爱奇艺链接：' + RegExp.$1);
        });
        break;

      default :

        break;
    }
  }
});


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