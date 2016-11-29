'use strict';

import Hapi from 'hapi';
import Good from 'good';
import MongoPlug from 'mongo-plug';
import Boom from 'boom';

// Server connection
const server = new Hapi.Server();
server.connection({
  host: process.env.HOST,
  port: process.env.PORT
});
const request = require('request');

let col;

server.route({
  method: ['POST', 'GET'],
  path: '/',
  handler: function (req, rep) {
    let query = {};
    let sort = {};
    let message = {};
    // date yesterday/today/tomorrow
    query.mealDate = '20161129';
    col.find(query).sort(sort).toArray((err, docs) => {
      if(docs.length === 0) {
        request(`${process.env.TOWERMAN_URI}?menuDate=${query.mealDate}`, (error, response, body) => {
          if (!error && response.statusCode == 200) {
            col.insertMany(JSON.parse(body).data);
          }
        });
      }
    });

    // time lunch/dinner
    query.mealTime = 1;

    // cafeteria 9F/22F
    query.cafeteriaId = '22F';

    // recommended true/false
    // query.umaiCount = { $gte: 1 };

    // healthy true/false
    // query['ingredients.healthy'] = true;

    // lowest/highest components
    sort['components.carb'] = 1;

    // with/without ingredients
    // query['ingredients.pork'] = false;

    col.find(query).sort(sort).toArray((err, docs) => {
      /*
      {
        "color": "green",
        "message": "It's going to be sunny tomorrow! (yey)",
        "notify": false,
        "message_format": "text"
      }
      */

      if(docs.length > 0) {
        message = {
          color: 'green',
          message: docs[2].title,
          notify: false,
          message_format: 'text'
        };
      } else {
        message = {
          color: 'green',
          message: 'Oops...',
          notify: false,
          message_format: 'text'
        };
      }
      return rep(message);
    });
  },
  config: {
    timeout: {
      server: process.env.DEFAULT_TIMEOUT  // FIXME make server default?
    }
  }
});

server.register([{
  // MongoDB plugin
  register: MongoPlug,
  options: {
    url: process.env.MONGODB_URI
  }
}, {
  // Logging plugin
  register: Good,
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*'
      }
    }]
  }
}], (err) => {
  if (err) {
    throw err;
  }
  server.start((err) => {
    if (err) {
      throw err;
    }
    server.log('info', 'Hapi server started at: ' + server.info.uri);
    col = server.db.collection('menu');
  });
});
