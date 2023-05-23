(async () => {
    const fs = require('fs');
    const express = require('express');
    const { createServer } = require('http');
    const { Server } = require('socket.io');
    const passport = require('passport');
    const DiscordStrategy = require('passport-discord').Strategy;
    const expresssession = require('express-session');

    const db = require('./models');
    const cfg = require('./cfg.json');
    const characters = require('./characters.json');

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
    app.get('/results', (req, res) => res.render('results', fs.existsSync('results.json') ? {results: JSON.parse(fs.readFileSync('results.json'))} : {}));
    app.get('/blacklist', async (req, res) => res.render('blacklist', req.user ? {blacklisted: (await db.Blacklist.findAll({where: {user: req.user.id}})).map(b => characters.find(c => c.id == b.char))} : {}));
    app.get('/blacklist/remove/*', async (req, res) => {
        if (req.user)
            await db.Blacklist.destroy({where: {user: req.user.id, char: req.originalUrl.slice('/blacklist/remove/'.length)}});
        res.redirect('/blacklist');
    });
    app.get('/votes', async (req, res) => res.render('votes', req.user ? {votes: (await db.Vote.findAll({where: {user: req.user.id}})).map(v => {
        v.win = characters.find(c => c.id == v.win);
        v.lose = characters.find(c => c.id == v.lose);
        return v;
    })} : {}));
    app.get('/votes/remove/*', async (req, res) => {
        if (req.user)
            await db.Vote.destroy({where: {user: req.user.id, id: parseInt(req.originalUrl.slice('/votes/remove/'.length))}});
        total = await db.Vote.count();
        io.emit('total', total);
        res.redirect('/votes');
    });
    app.use(express.static('static'));

    var voters = 0;
    var total = await db.Vote.count(); //get total votes

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const alreadyVoted = async socket => await db.Vote.count({where: {user: socket.request.user.id, win: socket.options[0].id, lose: socket.options[1].id}}) > 0;
    const getOptions = async socket => {
        let blacklisted = (await db.Blacklist.findAll({where: {user: socket.request.user.id}})).map(i => i.char);
        let validChars = characters.filter(c => !blacklisted.includes(c.id));
        if (validChars.length >= 2)
            for (let i = 0; i < 50; i++) { //try 50 times
                socket.options = shuffle(validChars).slice(0, 2);
                if (await alreadyVoted(socket)) continue;
                socket.options.reverse();
                if (await alreadyVoted(socket)) continue;
                return socket.emit('vote', socket.options, await db.Vote.count({where: {user: socket.request.user.id}}));
            }
        socket.emit('none');
    };

    io.on('connection', async socket => {
        console.log(socket.request.user.id + ' connected');
        socket.emit('total', total);
        io.emit('voters', ++voters);
        socket.on('disconnect', () => io.emit('voters', --voters));
        await getOptions(socket);

        socket.on('vote', async option => {
            if (socket.options) {
                option = parseInt(option);
                if (!isNaN(option) && option >= 0 && option <= 1) {
                    let win = socket.options.splice(option, 1)[0].id;
                    let lose = socket.options[0].id;
                    await db.Vote.create({user: socket.request.user.id, win, lose});
                    io.emit('total', ++total);
                    console.log(`Vote #${total} submitted`);
                    getOptions(socket);
                }
            }
        });

        socket.on('blacklist', async option => {
            if (socket.options) {
                option = parseInt(option);
                if (!isNaN(option) && option >= 0 && option <= 2) {
                    if (option == 2) {
                        for (let i of socket.options)
                            await db.Blacklist.create({user: socket.request.user.id, char: i.id});
                    } else
                        await db.Blacklist.create({user: socket.request.user.id, char: socket.options[option].id});
                    getOptions(socket);
                }
            }
        });

        socket.on('reroll', () => getOptions(socket));
    });

    httpServer.listen(cfg.port);
    httpServer.on('listening', () => console.log('http://localhost:'+cfg.port));
})();