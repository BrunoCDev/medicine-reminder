// REQUIRE DEPENDENCIES
const { json } = require("body-parser");
const cors = require("cors");
const express = require("express");
const massive = require("massive");
const session = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

// const { getDatabaseUser } = require('./controllers/user.controller')

const PORT = 3005;

const {
  CONNECTION_STRING,
  AUTH_DOMAIN,
  CLIENT_SECRET,
  CLIENT_ID,
  SESSION_SECRET
} = require("./config");

// MAKE PORT AND APP
const app = express();

// USING BODY PARSER AND CORS
app.use(json());
app.use(cors());

// SETTING UP DATABASE CONNECTION
massive(CONNECTION_STRING)
  .then(db => {
    app.set("db", db);
  })
  .catch(console.log);

// SETTING UP SESSION
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 525600 * 60 * 1000
    }
  })
);

// SETTING UP AUTH
app.use(passport.initialize());
app.use(passport.session());

// REQUIRING AUTH
passport.use(
  new Auth0Strategy(
    {
      domain: AUTH_DOMAIN,
      clientSecret: CLIENT_SECRET,
      clientID: CLIENT_ID,
      callbackURL: "http://172.31.99.168:3005/auth",
      scope: "openid profile user"
    },
    (acessToken, refreshToken, extraParams, profile, done) => {
      app
        .get("db")
        .getUserById(profile.id)
        .then(response => {
          if (!response[0]) {
            app
              .get("db")
              .createUserById([profile.id, profile.displayName])
              .then(created => {
                done(null, created[0]);
              });
          } else {
            return done(null, response[0]);
          }
        });
    }
  )
);

// PASSPORT SERIALIZE AND DESERIALIZE
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// SETTING UP AUTHENTICATION
app.get(
  "/auth",
  passport.authenticate("auth0", {
    successRedirect: "http://172.31.99.168:3005/dashboard",
    failureRedirect: "http://172.31.99.168:19001/"
  })
);

// REQUEST USER FROM DATABASE
// app.get('/api/user/:id', getDatabaseUser)

// APP LISTEN
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
