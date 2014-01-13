/**
 * Module dependencies.
 */

var io = require('socket.io').listen(3001)
    , connect = require('connect')
    , http = require('http')
    , directory = 'public/app/'
    , aws_func = require('./aws_wrapper.js')
    , c = require('./constants.js');

var app = connect();
var aws = new aws_func();

io.sockets.on('connection', function (socket) {
    // on connect
    socket.emit(c.CONNECTED, c.CONNECTED);

    /**** Dynamo *****/
        // get requests
    socket.on(c.DYN_GET_MEDIA, function () {
        aws.DynamoMedia.getAll(socket);
    });
    socket.on(c.DYN_GET_USER_MEDIA, function (user) {
        aws.DynamoMedia.getUserMedia(user, socket);
    });
    socket.on(c.DYN_GET_USERS, function () {
        aws.DynamoUsers.getAll(socket);
    });

    // put requests
    socket.on(c.DYN_UPDATE_MEDIA, function (media) {
        aws.DynamoMedia.addUpdateMedia(media, socket);
    });
    socket.on(c.DYN_UPDATE_USER, function (user) {
        aws.DynamoUsers.addUpdateUser(user, socket);
    });

    // delete requests
    socket.on(c.DYN_DELETE_USER, function (userId) {
        aws.DynamoUsers.deleteUser(userId, socket);
    });
    socket.on(c.DYN_DELETE_MEDIA, function (mId) {
        aws.DynamoMedia.deleteMedia(mId, socket);
    });

    /**** RDS *****/
        // RDS get requests
    socket.on(c.RDS_GET_MEDIA, function () {
        aws.RdsMedia.getAll(socket);
    });
    socket.on(c.RDS_GET_USER_MEDIA, function (user) {
        aws.RdsMedia.getUserMedia(user, socket);
    });
    socket.on(c.RDS_GET_USERS, function () {
        aws.RdsUsers.getAll(socket);
    });

    // RDS put requests
    socket.on(c.RDS_UPDATE_MEDIA, function (media) {
        aws.RdsMedia.addUpdateMedia(media, socket);
    });
    socket.on(c.RDS_UPDATE_USER, function (user) {
        aws.RdsUsers.addUpdateUser(user, socket);
    });

    // RDS delete requests
    socket.on(c.RDS_DELETE_USER, function (userId) {
        aws.RdsUsers.deleteUser(userId, socket);
    });
    socket.on(c.RDS_DELETE_MEDIA, function (mId) {
        aws.RdsMedia.deleteMedia(mId, socket);
    });

    /**** S3 *****/
        // S3 generate URL pair
    socket.on(c.S3_GET_URLPAIR, function () {
        aws.S3Utils.generateUrlPair(socket);
    });
    // delete a media using key from the default S3 bucket
    socket.on(c.S3_DELETE, function (key) {
        aws.S3Utils.deleteMedia(key, socket);
    });

    /**** SES *****/
        // for unsubscribing
    socket.on(c.DYN_UNSUBSCRIBE_EMAIL, function (email) {
        aws.DynamoEmail.unsubscribe(email, socket);
    });
    socket.on(c.SES_SEND_EMAIL, function (user) {
        aws.SesUserActivity.sendEmail(user, socket);
    });

});

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

app.use(function (request, response, next) {
    console.log("captured request", request)
    if ("post" === request.method.toLowerCase()) {
        if (endsWith(request.url,"sns")){
            response.writeHead(200, { "Content-Type": "text/plain" });
            response.end("");
            aws.SesBounce.handleBounce(request.body);
            return;
        }
    }

    next();
});

app.use(connect.static(directory))
    .listen(3000);

console.log('Listening on port 3000.');
