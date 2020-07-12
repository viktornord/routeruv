/**
 * This is an example usage
 */

const { router, passEvent } = require('./index');

router.configure({
  urlPrefix: 'my-api',
  eventMapper: function(event) {
    return {
      path: event.path,
      httpMethod: event.method,
      query: event.queryStringParameters
    }
  },
  // create and error handler
  // error handler should return error specific response, otherwise it will be 500 Internal server error by default
  /**
   * @param {{ NO_END_POINT_ERROR: boolean }} error
   * @return {{statusCode: number, body: Object}}
   */
  errorHandler: function(error) {
    if (error.NO_END_POINT_ERROR) { // this property will be true if there is no end point configured
      console.error('This error means there is no such end point configured');
      return {
        statusCode: 404,
      }
    }
    console.error(error);
  }
});

router.get(
  '/foo/bar/:id',
  // middlware 1
  (event, { routeParams, requestQuery }) => {
    const { id } = routeParams;
    const { foo } = requestQuery; // assume it was called like /foo/bar/1?foo=2
    console.log(id); // logs 1
    console.log(foo); // logs 2

    return { extraData: { foo: 'my additional data' } }
  },
  // middlware 2
  (event, { routeParams, requestQuery, extraData }) => {
    const { foo } = extraData;
    console.log(foo); // logs "my additional data"

    // result of the last middleware will be served as a response body and statusCode 200
    return { one: 1 };
  });

router.post('/bar/baz', (event, { requestBody }) => {
    // do some stuff...

    // alternatively you can pass statusCode and specify response body in the last middleware
    return {
      statusCode: 201,
      body: { created: true },
    };
  });


// global middleware
router
  .whenMatches(event => event.path.includes('/protected/'))
  .do((event) => {
    const { headers: { Authorization: token } } = event;
    if (event.path.includes('/protected/') && !token) {
      const error = new Error();
      error.statusCode = 401;
      error.body = 'Unauthorized';
      throw error;
    }
    const currentUser = getUserByToken(token);  // assume getUserByToken already defined

    return { currentUser };
  });

// then in each end point that includes /protected/ segment will have user in it
router.get('/protected/users', (event, { currentUser }) => {
  // your code...
});


// main handler example
async function myMainRequestHandler(event) {
  const response = await passEvent(event);
  const { statusCode, body } = response;
  // your code...
}
