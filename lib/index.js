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

let col;

server.route({
  method: ['POST', 'GET'],
  path: '/',
  handler: function (request, reply) {
    let query = {};
    let sort = {};
    // date yesterday/today/tomorrow
    query.mealDate = '20161115';

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
      let message = {
        color: 'green',
        message: docs[0].title,
        notify: false,
        message_format: 'text'
      };
      return reply(message);
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
