const db = require('./models');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const cfg = require('./cfg.json');
const expresssession = require('express-session');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});

const sessionStore = new (require("connect-session-sequelize")(expresssession.Store))({db: db.sequelize});
const sessionMiddleware = expresssession({secret: cfg.secret, store: sessionStore, resave: false, proxy: true, saveUninitialized: true});
app.use(sessionMiddleware);
sessionStore.sync();

passport.use(new DiscordStrategy({
    clientID: cfg.id,
    clientSecret: cfg.secret,
    callbackURL: cfg.url+'/login/cb',
    scope: ['identify'],
}, (accessToken, refreshToken, profile, cb) => {
    profile.refreshToken = refreshToken;
    cb(null, profile);
}));
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));
app.use(passport.initialize());
app.use(passport.session());
app.get('/login', passport.authenticate('discord'));
app.get('/login/cb', passport.authenticate('discord', {failureRedirect: '/login'}), (req, res) => res.redirect('/'));
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
io.use((socket, next) => {
    if (socket.request.user) next();
    else next(new Error('unauthorised'));
});

app.set('views', './views');
app.set('view engine', 'pug');
app.use((req, res, next) => {
    res.locals = {req};
    next();
});
app.get('/', (req, res) => res.render('home'));
app.use(express.static('static'));

io.on('connection', socket => {
    console.log('Socket connected!');
    console.log(socket.request.user);
});

httpServer.listen(cfg.port);
httpServer.on('listening', () => console.log('http://localhost:'+cfg.port));