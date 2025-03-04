const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { ClinicUser } = require('../clinic/models'); // Load ClinicUser model
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await ClinicUser.findOne({ where: { email: profile.emails[0].value } });

        if (!user) {
          user = await ClinicUser.create({
            email: profile.emails[0].value,
            name: profile.displayName,
            role: 'patient', // Default role
            photo: profile.photos[0].value,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await ClinicUser.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;