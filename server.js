'use strict'

const json = require('koa-json')
const Koa = require('koa')
const BLServer = require('./models/BLServer.js')
const User = require('./models/User.js')
const app = new Koa()
const logger = require('koa-logger')
const router = require('koa-router')()
const koaBody = require('koa-body')({
	text: false,
	json: false,
})

app.use(json())

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://' + process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, promiseLibrary: require('bluebird') })
	.then(() => console.log("Connection successful!"))
	.catch((err) => console.log(err));

const SERVER_TIMEOUT_MSEC = 10 * 60 * 1000

const LIST_PREFIX = 'FIELDS\tIP\tPORT\tPASSWORDED\tDEDICATED\tVERSION\tSERVERNAME\tPLAYERS\tMAXPLAYERS\tMAPNAME\tBRICKCOUNT\r\nSTART\r\n'
const LIST_SUFFIX = 'END\r\n'

const servers = []

function wrapCall(requestCreator) {
	return async (ctx) => {
		try {
			const response = await requestCreator(ctx)
			ctx.status = 200
			ctx.body = {
				...response,
				ok: true,
			}

		} catch (error) {
			ctx.throw(error.code, error.message)
		}
	}
}

router.get('/index.php', ctx => {
	const list = servers.map(server =>
		server.ip + '\t' +
		server.port + '\t' +
		(server.passworded ? '1' : '0') + '\t' +
		(server.dedicated ? '1' : '0') + '\t' +
		server.ver + '\t' +
		server.servername + '\t' +
		server.players + '\t' +
		server.maxplayers + '\t' +
		server.mapname + '\t' +
		server.brickcount + '\r\n').join('')
	ctx.body = LIST_PREFIX + list + LIST_SUFFIX
})

router.get('/json', async (ctx) => {
	return new Promise(function(resolve, reject) {
		BLServer.find()
		.lean()
		.select('-_id')
		.then(res => {
			ctx.body = {servers: res}
			console.log(res)
			resolve();
		})
		.catch(err => {
			throw err;
		})
	})
})

router.post('/postServer.php', koaBody, wrapCall((ctx) => {
	var ipAddr = ctx.request.headers["x-forwarded-for"];
	if (ipAddr) {
		var list = ipAddr.split(",");
		ipAddr = list[list.length - 1];
	} else {
		ipAddr = ctx.request.ip;
	}
	console.log(ctx.request.body)
	let ip = ipAddr;
	let port = parseInt(ctx.request.body.Port, 10)
	let blid = parseInt(ctx.request.body.blid, 10)
	let host;
	let passworded = ctx.request.body.Passworded === '1'
	let dedicated = ctx.request.body.Dedicated === '1'
	let ver = parseInt(ctx.request.body.ver, 10)
	let servername = ctx.request.body.ServerName || ''
	let players = parseInt(ctx.request.body.Players, 10)
	let maxplayers = parseInt(ctx.request.body.MaxPlayers, 10)
	let mapname = ctx.request.body.Map || ''
	let brickcount = parseInt(ctx.request.body.BrickCount, 10)

	if (ip.startsWith('::ffff:')) ip = ip.slice(7)
	if (Number.isNaN(blid) || blid < 0) return ctx.body = 'FAIL invalid blid\r\n'
	if (Number.isNaN(port) || port < 1 || port > 65535) return ctx.body = 'FAIL invalid port\r\n'
	if (Number.isNaN(players) || players < 0) players = 0
	if (Number.isNaN(maxplayers) || maxplayers < 0) maxplayers = 0
	if (Number.isNaN(brickcount) || brickcount < 0) brickcount = 0
	User.findOne({ id: blid }, function (err, res) {
		if (err || !res) {
			return ctx.body = 'FAIL invalid blid\r\n';
		}
		host = res.username

		let serverhost;
		if (host.endsWith('s')) { serverhost = host + '\'' } else { serverhost = host + '\'s' }
		servername = `[v${ver}] ${serverhost} ${servername}`
		// TODO: verify auth, get name (?)

		let server = servers.find(candidate =>
			candidate.ip === ip && candidate.port === candidate.port)

		if (server) {
			clearTimeout(server.timeout)
		} else {
			server = {
				ip,
				port,
			}
			servers.push(server)
		}

		server.timeout = setTimeout(serverTimeout, SERVER_TIMEOUT_MSEC, server)

		server.passworded = passworded
		server.dedicated = dedicated
		server.ver = ver
		server.servername = servername
		server.players = players
		server.maxplayers = maxplayers
		server.mapname = mapname
		server.brickcount = brickcount
		BLServer.create({ ip, port, host, blid, passworded, dedicated, ver, servername, players, maxplayers, mapname, brickcount, ver })

		return Promise.resolve({
			message: "Successfully posted server!"
		})
	})
	// console.log(validateBLID(blid));
	
	// FAIL <text>
	// MMTOK <token>
	// MATCHMAKER <ip>
	// NOTE <text>
}))

function serverTimeout(server) {
	const index = servers.indexOf(server)
	if (index === -1) return

	// swap-and-pop
	servers[index] = servers[servers.length - 1]
	servers.pop()
	BLServer.remove({servername: servers[index].servername})
}

function validateBLID(blid) {
	let person = User.findOne({ id: blid })
	return person;
}

app.use(logger())
var port = process.env.PORT || 3001;
app.use(router.routes())
app.listen(port);
