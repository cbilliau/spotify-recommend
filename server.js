var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();

var getFromApi = function(endpoint, args) {
    console.log('line 7: ' + endpoint+args);
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
            //  console.log(response);
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        // create artist obj using res (item)
        var artist = item.artists.items[0];
        var relArtist = artist.id + '/related-artists';
        // submit next api call for related artists
        var relatedReq = getFromApi('artists/' + relArtist);

        relatedReq.on('end', function(item) {
        // Add .related to artist obj
        artist.related = item.artists;
        // Return artist obj
        res.json(artist);
        });

        relatedReq.on('error', function(code) {
            res.sendStatus(code);
        });
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});

app.listen(process.env.PORT || 8080);
