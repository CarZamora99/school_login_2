
//Invocamos a express
const express = require('express');
const app = express();

//Seteamos urlencoded para datos de formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({path: './env/.env'});

//El directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

// Invocamos a bcrypts
const bcryptjs = require('bcryptjs');

//Variable de session
const session = require('express-session');
app.use(session({
    secret:'secret',
    resave: true,
    saveUninitialized: true
}));

//Invocar la BD
const connection = require('./database/db');

//Estableciendo las rutas

app.get('/login', (req, res)=>{
    res.render('login.ejs');
})
app.get('/register', (req, res)=>{
    res.render('register.ejs');
})

//Registro
app.post('/register', async (req, res)=>{
    const user = req.body.user;
    const name = req.body.name;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    let rol = 'admin';
    connection.query('INSERT INTO users SET ?',{name:name, user:user, password:passwordHash, rol:rol}, async(error, results)=>{
        if(error){
            console.log(error);
        }else{
            res.render('register.ejs',{
                alert: true,
                alertTitle: "Registration",
                alertMessage: "Successful Registration!",
                alertIcon: 'success',
                showConfirmButton: false,
                timer:1500,
                ruta:''
            })
        }
    })
})

//Autenticacion
app.post('/auth', async (req, res)=>{
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    if(user && pass){
       connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results)=>{
           if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].password))){
            res.render('login.ejs',{
                alert: true,
                alertTitle: "Error",
                alertMessage: "User and/or password is incorrect",
                alertIcon: 'error',
                showConfirmButton: true,
                timer:false,
                ruta:'login'
            })
           }else{
            req.session.loggedin = true;
            req.session.name = results[0].name;
            res.render('login.ejs',{
                alert: true,
                alertTitle: "Successful",
                alertMessage: "Authentication Correct",
                alertIcon: 'success',
                showConfirmButton: false,
                timer:1500,
                ruta:''
            })
           }
       }) 
    }else{
        res.render('login.ejs',{
            alert: true,
            alertTitle: "Error",
            alertMessage: "User and/or password is incorrect",
            alertIcon: 'warning',
            showConfirmButton: true,
            timer:1500,
            ruta:'login'
        })
    }
})

app.get('/', (req, res)=> {
    if(req.session.loggedin){
        res.render('index.ejs',{
            login: true,
            name: req.session.name
        })
    }else{
        res.render('index.ejs',{
            login: false,
            name: 'Debe iniciar sesion'
        })
    }
})

//Logout
app.get('/logout', (req, res)=> {
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

//Mensaje de servidor 
app.listen(3000, (req, res)=> {
    console.log('Server Running in localhost');
})