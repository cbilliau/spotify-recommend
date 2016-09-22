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

    // Call for artist
    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        var relArtist = artist.id + '/related-artists';
        var relatedReq = getFromApi('artists/' + relArtist);


        // Call for related artists
        relatedReq.on('end', function(item) {
            artist.related = item.artists;
            console.log(artist.related[0].id);

            // iterate over realted artists
            artist.related.forEach(function(artistInfo) {
               var artistId = artistInfo.id + '/top-tracks';
               var topTrackReq = getFromApi('artists/' + artistId, {
                 country: 'us'
               });

              // Call for top tracks of each related artist
              topTrackReq.on('end', function(item) {
                  artist.related.tracks = item.tracks;
                  res.json(artist);
              });

              topTrackReq.on('error', function(code) {
                res.sendStatus(code);
              });
            });
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
