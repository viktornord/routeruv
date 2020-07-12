# routeruv

**routeruv** is a node.js router library without a need to create a server.
It has clear API and zero dependencies.

- Simple API
- Lightweight
- Zero dependencies

## Introduction

Imagine you are doing a serverless app with AWS Lambda or 
you just need an HTTP router but you don't need the actual server.

All you need is to route your request event to a needed handler based on the end point path,
route params and HTTP method. 

You might go we a simple switch case of a set of if statements which could be enough when you have a couple of end points,
but once the app get's complicated with more and more end points you need an elegant solution which will satisfy your needs.

Say you need an express but without server :)

This is where `routeruv` comes for the help!

## Usage

### Import a router
```
const { router, passEvent } = require('routeruv');
```
#### Configure request event mapping (optional)
```javascript
router.configure({
  urlPrefix: 'my-api',
  eventMapper: function(event) {
    return {
      path: event.path,
      httpMethod: event.method,
      query: event.queryStringParameters
    }
  },
  errorHandler: function(error) {
    // Example response. Response should contain statusCode and body. Default is: 500 Internal server error
    return { statusCode: 400, body: 'Invalid username'  }
  }
});
```
`urlPrefix` is not required but if all your end points start with the same segment you might pass it here
and not use it for each end point you add.

For example I if all your end points start with /admin/ I may pass `urlPrefix: '/admin'` 


##### Add your end points configuration
```
router.get(url, middleware1[, midddleware2]...);
router.post(url, middleware1[, midddleware2]...);
router.put(url, middleware1[, midddleware2]...);
router.delete(url, middleware1[, midddleware2]...);
router.patch(url, middleware1[, midddleware2]...);
```
You can keep adding as many middlewares as you wish

The very last middleware return value will be used to create a response object

##### Pass event through
```javascript
const { statusCode,  } = await passEvent(event);
```

### Example

Request like [GET] http://my-domain.com/users/1?q=Bob
should be configured like
```javascript
router.get('/users/:id', (event, { requestQuery, routeParams }) => {
  console.log(event) // log the whole event
});
```

Now let's say you want to auth middleware for a POST end point

```javascript
router.get(
  '/foo/bar',
  (event) => {
    // extract token from event (depend on your event structure)
    const { headers: { Authorization: token } } = event;
    // validateToken (assume you have isTokenValid defined.
    if (!isTokenValid(token)) {
      const error = new Error();
      error.statusCode = 401;
      error.body = 'Unauthorized';
      throw error;
    }
    // pass user to the next middleware (assume you have getUser defined.
    return { currentUser: getUser(token) };
  },
  (event, { requestBody, currentUser }) => {
    // your code...
  },
);
```



Check out [example.js](example.js) for api details 

