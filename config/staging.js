const db = require('./db');
const path = require('path');
module.exports = {
  api: {
    host: '0.0.0.0',
    port: 4001,
    secret: process.env.API_SECRET
  },
  db: db.staging,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    prefix: 'socialtostream_'
  },
  aws: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
    s3: {
      bucketWrite: 'socialtostream-development-original',
      bucket: 'socialtostream-development'
    }
  },
  BasePath:{
    host: "http://fan.simsaw.com"
  },
  emailUrl: {
    host: 'smtps://username:password@smtp.example.com/?pool=true'
  },
  profileImage: {
    maxPayloadSize: 5242880,
    profileImagePath: path.join(__dirname,"../public/userProfile/images")
  },
  debugLog : 1, //Set 0 to disable and 1 to enable error logs
  cron : 0,
  sendEmail: 1,
  registerTargetArn: 'arn:aws:sns:us-east-1:749476954039:s2s_registration',
  ARNdeleteApprovedMediaRequest : 'arn:aws:sns:us-east-1:749476954039:s2s_flagged_media',
  snsNotification: 1,
  cognito: {
    userPoolId: 'us-east-1_RRaTVuShu',
    clientId: '568kfnt8gbko9ur6a8icmppfod'
  }
};
