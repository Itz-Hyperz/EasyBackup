// Basic Imports
const config = require("./config.json");
const express = require("express");
const app = express();
const chalk = require('chalk');
const fs = require('node:fs');

// Backend Initialization
const backend = require('./backend.js');
backend.init(app);

// Routing
app.get('', async function(req, res) {
    res.render('index.ejs');
});

app.post('/backup', async function(req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    if(!req.headers.secret) return res.type('json').send(JSON.stringify({"success": false,"info": "No secret was provided in post request headers."}, null, 4) + '\n');
    if(req.headers.secret !== config.apiSecret) return res.type('json').send(JSON.stringify({"success": false,"info": "Secret does not match the secret provided in the EasyBackup config file."}, null, 4) + '\n');
    if(!req.files[0]) return res.type('json').send(JSON.stringify({"success": false,"info": "No file was provided in the post request."}, null, 4) + '\n');
    req.files.forEach(function(file) {
        fs.writeFileSync(`./uploads/${file.originalname}`, file.buffer)
    });
    return res.type('json').send(JSON.stringify({"success": true,"info": "Backup success!"}, null, 4) + '\n');
});

// MAKE SURE THIS IS LAST FOR 404 PAGE REDIRECT
app.get('*', function(req, res){
    res.render('404.ejs');
});

// Server Initialization
app.listen(config.port)
console.log(chalk.blue('EasyBackup Started on Port ' + config.port));

// Rejection Handler
process.on('unhandledRejection', (err) => { 
    if(config.debugMode) console.log(chalk.red(err));
});