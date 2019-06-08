const express = require("express")
const logger = require("morgan")
const debug = require("debug")("app")
const cookieParser = require("cookie-parser")
const session = require("cookie-session")
const bodyParser = require("body-parser")
const compression = require("compression")

const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy

const index = require("./routes/index")
const users = require("./routes/users")
const auth = require("./routes/auth")

const app = express()

app.use(compression())
app.use(logger("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({ keys: [process.env.cookieSigningKey || "super-secret-key"] }))

app.use(passport.initialize())
app.use(passport.session())

const Account = require("./db/Account")

passport.use(new LocalStrategy(Account.authenticate()))

passport.serializeUser(Account.serializeUser())
passport.deserializeUser(Account.deserializeUser())

require("./db/bootstrap-mongoose")

app.all("*", function(req, res, next) {
  if (req.path === "/" || req.path.match("/auth")) next()
  else ensureAuthenticated(req, res, next)
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.sendStatus(401)
}

app.use("/", index)
app.use("/users", users)
app.use("/auth", auth)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error("Not Found")
  err.status = 404
  next(err)
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get("env") === "development" ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render("error")
})

app.set("port", process.env.PORT || 3002)
var server = app.listen(app.get("port"), function() {
  console.log("Express server listening on port " + server.address().port)
})
