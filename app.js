'use strict';

require('dotenv').config({
  path: __dirname + '/../.env'
});

const express = require('express');
var app = require('express')();
var http = require('http').Server(app);

const bodyParser = require('body-parser');
const ejs = require('ejs');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');
const expressSanitizer = require('express-sanitizer');
var expressMongoDb = require('express-mongo-db');
var expressSession = require('express-session');
var User = require('./models/user');
var port = process.env.PORT || 4000;

app.use(expressSession({
  secret: '123456',
  resave: true,
  saveUninitialized: true,
  key: 'id',
  cookie: { maxAge: 86400 * 30 } 
}));
var ssn;


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({
  extended: false
}));


var config = require('./config')
app.use(expressMongoDb(config.database.url));

mongoose.connect('mongodb://localhost:27017/engine', {  useNewUrlParser: true });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
});

app.set('views', __dirname + '/views'); 
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/views'));



http.listen(port, function(){
  console.log('listening on *:' + port);
});

const BRAND_NAME = 'Nexmo';
const NEXMO_API_KEY = 'f1cf8c44';
const NEXMO_API_SECRET = '6kspjhDI3fkntjBg';

const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET
});


app.get('/', (req, res) => {
    ssn = req.session;
    if(ssn.email){
      res.redirect('/dashboard');
    } else {
      if(ssn.error){
        res.render('index',{error:ssn.error});
        req.session.destroy();
      } else {
        res.render('index',{error:''});
      }
    }
});




app.get('/signup', (req, res) => {
    ssn = req.session;
    if(ssn.email){
      res.redirect('/dashboard');
    } else {
      if(ssn.error){
        res.render('signup',{error:ssn.error});
        req.session.destroy();
      } else {
        res.render('signup',{error:''});
      }
    }
});

app.get('/dashboard', (req, res) => {
    ssn = req.session;
    if(ssn.email){
      var search;
      
        res.render('dashboard',{searchval:search,name:ssn.name,email:ssn.email});
      } else {
        res.redirect('/');
      }
});

app.get('/logout',function(req,res){
  req.session.destroy();
  res.redirect('/');
});

app.post('/register', (req, res) => {
  ssn = req.session;
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var phoneNumber = req.body.mobile;
  User.findOne({mobile:req.body.mobile},function(err,mobileno){
    if (!mobileno) {
      ssn.error = 'Invalid Credential.';
      res.redirect('/');
    } else {
      User.findOne({email:req.body.email},function(err,user){
              if (!user) {
                ssn.error = 'Invalid Credential.';
                res.redirect('/');
              } else if (!user.validPassword(password)) {
                  ssn.error = 'Invalid Credential.';
                  res.redirect('/');
              }else {  
              let phoneNumber = req.body.mobile;
              nexmo.verify.request({
                number: phoneNumber,
                brand: BRAND_NAME
              }, (err, result) => {
                if (err) {
                  res.render('status', {
                    message: 'Server Error'
                  });
                } else {
                  let requestId = result.request_id;
                  if (result.status == '0') {
                    ssn = req.session;
                    ssn.user_id = user._id;
                    ssn.name = user.name;
                    ssn.email = user.email;
                    res.render('verify', {
                      requestId: requestId
                    });
                  } else {
                    res.render('status', {
                      message: result.error_text,
                      requestId: requestId
                    });
                  }
                }
              });
              }
          });
        }
      });
});



app.get('/add', function(req, res, next){	
	
	res.render('user/add', {
		title: 'Add New User',
		name: '',	
    email: ''		,
    password:'',
    mobile: ''
	})
})


app.post('/add', function(req, res, next){	
  console.log(req);
  User.findOne({mobile:req.body.mobile},function(err,mobileno){
      if (mobileno) {
        ssn.error = 'Mobile number already exist.';
        res.render('signup',{error:ssn.error});
      } else {
        User.findOne({name:req.body.name},function(err,user){
          if (!user) {
            var user = {
              name: req.body.name,
              email: req.body.email,
              password: req.body.password,
              mobile: req.body.mobile,
              address: req.body.address,
              lat: req.body.lat,
              lng: req.body.lng
            }
                
            req.db.collection('users').insert(user, function(err, result) {
              if (err) {
                
                res.render('/', {
                  title: 'Add New User',
                  name: user.name,
                  email: user.email,
                  password: user.password,
                  mobile: user.mobile,
                  address: user.address,
                  lat: req.body.lat,
                  lng: req.body.lng
                    
                })
              } else {		
                			
                res.redirect('/')
              }
            })	
          } else {
            ssn.error = 'Username already exist.';
            res.render('signup',{error:ssn.error});
          }
        })
      }
    })
})


app.post('/verify', (req, res) => {
  
  let pin = req.body.pin;
  let requestId = req.body.requestId;

  nexmo.verify.check({
    request_id: requestId,
    code: pin
  }, (err, result) => {
    if (err) {
      req.session.destroy();
      res.render('status', {
        message: 'Server Error'
      });
    } else {
      if (result && result.status == '0') {
        res.redirect('/dashboard')
      } else {
        req.session.destroy();
        res.render('status', {
          message: result.error_text,
          requestId: requestId
        });
      }
    }
  });
});

app.post('/search', (req, res) => {
  
   ssn = req.session;
   if(ssn.email){
      var searchval;
      var search = req.body.search;
      
      res.render('users',{searchval:search,name:ssn.name,email:ssn.email});
    } else {
       return res.redirect('/');
    }
});

app.get('/getresult', (req, res) => {
  
  ssn = req.session;
  if(ssn.email){
      var search = req.query.search;
      User.find({name: {$regex: search, $options: 'i'}},function(err,result){
            res.send(result);
          });
    } else {
       return res.redirect('/');
    }
});







