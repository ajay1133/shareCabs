const joi = require('joi');
const boom = require('boom');
const superagent = require('superagent');
const config = require('config');

module.exports = {
  plugins: {
    'hapi-swagger': {
      payloadType: 'form',
    },
  },
  
  auth: 'default',
  
  tags: ['api', 'bitBucket'],
  
  description: 'Updates a file in a repository',
  
  notes: 'Updates a file in a repository',
  
  validate: {
    payload: {
      accessToken: joi.string()
                      .required()
                      .description('Access Token'),
      
      path: joi.string()
               .required()
               .description('path of file name after "src"'),
      
      content: joi.string()
                  .required()
                  .description('Content of file'),
      
      message: joi.string()
                  .allow('')
                  .default('Edited with Bitbucket')
                  .description('Commit message')
    },
    options: { abortEarly: false },
  },
  
  handler: async (request, h) => {
    const { payload } = request;
    const { accessToken, path, content, message } = payload;
    
    let res = {};
    const url = `${config.bitBucket.basePath}/src`;
    
    try {
      const postObj = {
        [path]: content,
        message
      };
      
      res = await superagent
        .post(url)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postObj);
    } catch(err) {
      return boom.badRequest(err);
    }
    
    return h.response(res.body);
  },
};