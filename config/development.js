const db = require('./db');
const path = require('path');

module.exports = {
  api: {
    host: 'localhost',
    port: 5000,
    secret: 'fdgwVtghrt5345gfdgfd653245235232v2rcra'
  },
  db: db.development,
  aws: {
		s3: {
			bucketWrite: '',
			bucket: '',
			s3Url: ``
		}
	},
  emailUrl:{
    host: ''
  },
  BasePath:{
    host: "http://localhost:3000"
  },
  profileImage:{
    maxPayloadSize: 5242880,
    profileImagePath: path.join(__dirname,"../public/userProfile/images")
  },
  debugLog : 1, //Set 0 to disable and 1 to enable error logg
};

